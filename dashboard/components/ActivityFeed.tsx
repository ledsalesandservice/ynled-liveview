'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ActivityEvent } from '@/lib/types';

const EVENT_COLORS: Record<string, string> = {
  connected: 'text-green-400',
  disconnected: 'text-red-400',
  restarted: 'text-yellow-400',
  error: 'text-red-500',
  provisioned: 'text-blue-400',
  deprovisioned: 'text-gray-400',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityFeed() {
  const { data: events } = useSWR<ActivityEvent[]>('/api/activity', fetcher, {
    refreshInterval: 10000,
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-semibold text-sm text-gray-300 mb-4">Activity Feed</h2>
      {!events && <p className="text-sm text-gray-500">Loading…</p>}
      {events && events.length === 0 && (
        <p className="text-sm text-gray-500">No activity yet.</p>
      )}
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {events?.map((ev) => (
          <li key={ev.id} className="flex items-start gap-3 text-sm">
            <span className={`text-xs font-mono mt-0.5 ${EVENT_COLORS[ev.event] ?? 'text-gray-400'}`}>
              {ev.event}
            </span>
            <span className="text-gray-400 flex-1">{ev.message ?? `${ev.camera_id ?? 'system'}`}</span>
            <span className="text-xs text-gray-600 shrink-0">{timeAgo(ev.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
