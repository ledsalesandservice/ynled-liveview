export type CameraStatus = 'offline' | 'connecting' | 'live';

export interface Camera {
  id: string;
  name: string;
  client: string;
  yt_key: string | null;
  yt_url: string | null;
  destination: 'youtube' | 'private' | 'both';
  status: CameraStatus;
  bitrate: number;
  viewers: number;
  uptime_start: string | null;
  last_seen: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: number;
  camera_id: string | null;
  event: string;
  message: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  contact: string | null;
  address: string | null;
  plan: string | null;
  mrr: number;
  created_at: string;
  camera_count?: number;
  total_viewers?: number;
}

export interface Stats {
  cameras: { total: number; live: number; connecting: number; offline: number };
  viewers: number;
  clients: number;
}

export interface Health {
  status: string;
  uptime_seconds: number;
  cpu: { cores: number; load_1m: string; usage_pct: number };
  memory: { total_mb: number; used_mb: number; free_mb: number; usage_pct: number };
  streams: { live: number; connecting: number };
  services: { nginx_rtmp: string; ehome_listener: string };
}
