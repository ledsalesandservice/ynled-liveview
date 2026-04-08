/**
 * ehome-listener/server.js
 * Hikvision EHome v4.0 TCP listener on port 7660.
 *
 * Protocol overview (EHome v4.0):
 *   Camera opens TCP connection to server and sends a registration packet.
 *   Packet structure:
 *     Bytes 0-3:   Magic "ISUP" or 0x20 0x00 0x00 0x00 (varies by firmware)
 *     Byte 4:      Version (0x04 for EHome 4.0)
 *     Byte 5:      Message type:
 *                    0x01 = Registration request
 *                    0x02 = Registration response (server sends back)
 *                    0x06 = Keepalive
 *                    0x07 = Keepalive response
 *     Bytes 6-9:   Sequence number (uint32 BE)
 *     Bytes 10-11: Reserved
 *     Bytes 12-15: Payload length (uint32 LE)
 *     Bytes 16+:   Payload (device ID string, null-terminated or length-bounded)
 *
 * On registration:
 *   - Extract device ID from payload
 *   - Log to SQLite
 *   - Send registration acknowledgment
 *   - Trigger camera-relay to start RTSP pull (if rtsp_url known in DB)
 *
 * NOTE: The EHome binary protocol is partially reverse-engineered from open sources.
 * If camera registration doesn't parse correctly, check the raw hex dump in the logs
 * and adjust DEVICE_ID_OFFSET / parsing below.
 */

const net = require('net');
const { logEvent, upsertCamera, setStatus, db } = require('../db');
const relay = require('../camera-relay');

const EHOME_PORT = process.env.EHOME_PORT || 7660;

// Packet constants
const MSG_REGISTER   = 0x01;
const MSG_KEEPALIVE  = 0x06;
const MSG_KA_RESP    = 0x07;

function buildAck(seqBuf) {
  // Registration ACK: same header, msg type 0x02, empty payload
  const buf = Buffer.alloc(16);
  buf.write('ISUP', 0, 'ascii');
  buf[4] = 0x04;           // version
  buf[5] = 0x02;           // reg response
  seqBuf.copy(buf, 6, 0, 4); // echo sequence
  buf.writeUInt32LE(0, 12); // payload length 0
  return buf;
}

function buildKaResponse(seqBuf) {
  const buf = Buffer.alloc(16);
  buf.write('ISUP', 0, 'ascii');
  buf[4] = 0x04;
  buf[5] = MSG_KA_RESP;
  seqBuf.copy(buf, 6, 0, 4);
  buf.writeUInt32LE(0, 12);
  return buf;
}

function parseDeviceId(payload) {
  // Payload starts with device ID as null-terminated ASCII string
  const nullIdx = payload.indexOf(0x00);
  const raw = nullIdx >= 0 ? payload.slice(0, nullIdx) : payload;
  return raw.toString('ascii').trim();
}

function onCameraConnect(socket) {
  const remoteIp = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
  console.log(`[ehome] connection from ${remoteIp}`);

  let cameraId = null;
  let buf = Buffer.alloc(0);

  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);

    // Process all complete packets in the buffer
    while (buf.length >= 16) {
      const payloadLen = buf.readUInt32LE(12);
      const totalLen = 16 + payloadLen;
      if (buf.length < totalLen) break; // wait for more data

      const packet = buf.slice(0, totalLen);
      buf = buf.slice(totalLen);

      const version = packet[4];
      const msgType = packet[5];
      const seqBuf = packet.slice(6, 10);
      const payload = packet.slice(16, totalLen);

      // Hex dump for debugging unknown packets
      if (msgType !== MSG_KEEPALIVE && msgType !== MSG_KA_RESP) {
        console.log(`[ehome] pkt type=0x${msgType.toString(16).padStart(2,'0')} ver=${version} payloadLen=${payloadLen}`);
        if (payloadLen > 0) console.log(`[ehome] payload hex: ${payload.slice(0,64).toString('hex')}`);
      }

      if (msgType === MSG_REGISTER) {
        cameraId = parseDeviceId(payload);
        if (!cameraId) {
          console.warn(`[ehome] registration from ${remoteIp} — could not parse device ID, raw: ${payload.toString('hex')}`);
          socket.destroy();
          return;
        }
        console.log(`[ehome] REGISTERED device=${cameraId} ip=${remoteIp}`);
        upsertCamera(cameraId, { name: cameraId });
        setStatus(cameraId, 'connecting');
        logEvent(cameraId, 'connected', `EHome registration from ${remoteIp}`, remoteIp);

        // Send ACK
        socket.write(buildAck(seqBuf));

        // Trigger RTSP relay if we have a known RTSP URL for this camera
        const camRow = db.prepare('SELECT rtsp_url FROM cameras WHERE id = ?').get(cameraId);
        if (camRow?.rtsp_url) {
          console.log(`[ehome] triggering relay for ${cameraId}`);
          relay.startRelay(cameraId, camRow.rtsp_url, cameraId);
        } else {
          console.log(`[ehome] no rtsp_url for ${cameraId} — add it via cameras.json or API`);
        }

      } else if (msgType === MSG_KEEPALIVE) {
        if (cameraId) {
          setStatus(cameraId, 'live');
          db.prepare('UPDATE cameras SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(cameraId);
        }
        socket.write(buildKaResponse(seqBuf));

      } else {
        console.log(`[ehome] unhandled msg type 0x${msgType.toString(16)} from ${cameraId || remoteIp}`);
      }
    }
  });

  socket.on('close', () => {
    if (cameraId) {
      console.log(`[ehome] ${cameraId} disconnected`);
      setStatus(cameraId, 'offline');
      logEvent(cameraId, 'disconnected', `connection closed from ${remoteIp}`, remoteIp);
      relay.stopRelay(cameraId);
    }
  });

  socket.on('error', err => {
    console.error(`[ehome] socket error ${cameraId || remoteIp}: ${err.message}`);
  });

  // 5-minute idle timeout
  socket.setTimeout(300000, () => {
    console.warn(`[ehome] ${cameraId || remoteIp} timed out`);
    socket.destroy();
  });
}

const tcpServer = net.createServer(onCameraConnect);
tcpServer.listen(EHOME_PORT, '0.0.0.0', () => {
  console.log(`[ehome] TCP listener ready on port ${EHOME_PORT}`);
});

tcpServer.on('error', err => {
  console.error(`[ehome] server error: ${err.message}`);
});

module.exports = tcpServer;
