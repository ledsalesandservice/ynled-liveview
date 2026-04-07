'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Camera, ActivityEvent } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import EmbedModal from '@/components/EmbedModal';
import toast from 'react-hot-toast';

interface CameraDetail extends Camera {
  recent_activity: ActivityEvent[];
}

export default function CameraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: camera, mutate } = useSWR<CameraDetail>(`/api/cameras/${id}`, fetcher, {
    refreshInterval: 10000,
  });

  async function restart() {
    const res = await fetch(`/api/cameras/${id}/restart`, { method: 'POST' });
    if (res.ok) {
      toast.success('Restart triggered');
      mutate();
    } else {
      toast.error('Restart failed');
    }
  }

  async function remove() {
    if (!confirm(`Remove ${id}? This cannot be undone.`)) return;
    const res = await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(`${id} removed`);
      router.push('/');
    } else {
      toast.error('Failed to remove camera');
    }
  }

  if (!camera) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">{camera.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{camera.client} · <span className="font-mono">{camera.id}</span></p>
        </div>
        <StatusBadge status={camera.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-gray-300">Stream Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Destination</dt>
              <dd className="text-gray-200">{camera.destination}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Bitrate</dt>
              <dd className="text-gray-200">{camera.bitrate > 0 ? `${(camera.bitrate / 1000).toFixed(1)} Mbps` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Viewers</dt>
              <dd className="text-gray-200">{camera.viewers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Last Seen</dt>
              <dd className="text-gray-200">{camera.last_seen ? new Date(camera.last_seen).toLocaleString() : '—'}</dd>
            </div>
            {camera.yt_url && (
              <div className="flex justify-between">
                <dt className="text-gray-500">YouTube</dt>
                <dd>
                  <a href={camera.yt_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
                    Watch →
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-gray-300">Actions</h2>
          <div className="space-y-2">
            <button onClick={restart} className="w-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Restart Stream
            </button>
            {camera.yt_url && (
              <div className="w-full bg-gray-800 hover:bg-gray-700 text-sm font-medium py-2 rounded-lg transition-colors text-center">
                <EmbedModal cameraId={camera.id} cameraName={camera.name} />
              </div>
            )}
            <button onClick={remove} className="w-full bg-red-900 hover:bg-red-800 text-red-300 text-sm font-medium py-2 rounded-lg transition-colors">
              Remove Camera
            </button>
          </div>
          {camera.notes && (
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">{camera.notes}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-sm text-gray-300 mb-4">Recent Activity</h2>
        {camera.recent_activity.length === 0 && <p className="text-sm text-gray-500">No activity recorded.</p>}
        <ul className="space-y-2">
          {camera.recent_activity.map((ev) => (
            <li key={ev.id} className="flex items-start gap-3 text-sm">
              <span className="text-xs font-mono text-gray-400 mt-0.5">{ev.event}</span>
              <span className="text-gray-400 flex-1">{ev.message}</span>
              <span className="text-xs text-gray-600">{new Date(ev.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
