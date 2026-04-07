'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Camera } from '@/lib/types';
import StatusBadge from './StatusBadge';
import EmbedModal from './EmbedModal';

export default function CameraCard({ camera, onRestart }: { camera: Camera; onRestart: () => void }) {
  async function restart() {
    const res = await fetch(`/api/cameras/${camera.id}/restart`, { method: 'POST' });
    if (res.ok) {
      toast.success(`Restart triggered for ${camera.id}`);
      onRestart();
    } else {
      toast.error('Restart failed');
    }
  }

  const bitrateLabel = camera.bitrate > 0 ? `${(camera.bitrate / 1000).toFixed(1)} Mbps` : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/cameras/${camera.id}`} className="font-semibold text-gray-100 hover:text-brand transition-colors">
            {camera.name}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">{camera.client}</p>
        </div>
        <StatusBadge status={camera.status} />
      </div>

      <div className="text-xs text-gray-500 font-mono">{camera.id}</div>

      {bitrateLabel && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${Math.min((camera.bitrate / 8000) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{bitrateLabel}</span>
        </div>
      )}

      {camera.viewers > 0 && (
        <p className="text-xs text-gray-400">{camera.viewers} viewer{camera.viewers !== 1 ? 's' : ''}</p>
      )}

      <div className="flex gap-3 pt-1 border-t border-gray-800">
        <button
          onClick={restart}
          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Restart
        </button>
        {camera.yt_url && <EmbedModal cameraId={camera.id} cameraName={camera.name} />}
        <Link href={`/cameras/${camera.id}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto">
          Details →
        </Link>
      </div>
    </div>
  );
}
