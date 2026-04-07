'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Health } from '@/lib/types';

function ServicePill({ status }: { status: string }) {
  const running = status === 'running';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${running ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
      {status}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d > 0 && `${d}d`, h > 0 && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

export default function SettingsPage() {
  const { data: health, error } = useSWR<Health>('/api/health', fetcher, { refreshInterval: 30000 });

  return (
    <>
      <h1 className="text-xl font-bold text-gray-100 mb-6">Settings & VPS Health</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 mb-4">VPS Health</h2>
          {error && <p className="text-sm text-red-400">Cannot reach VPS API. Check that the server is running and API_TOKEN is set correctly.</p>}
          {!health && !error && <p className="text-sm text-gray-500">Loading…</p>}
          {health && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Uptime</dt>
                <dd className="text-gray-200">{formatUptime(health.uptime_seconds)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">CPU ({health.cpu.cores} cores)</dt>
                <dd className="text-gray-200">{health.cpu.usage_pct}% (load {health.cpu.load_1m})</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Memory</dt>
                <dd className="text-gray-200">{health.memory.used_mb} / {health.memory.total_mb} MB ({health.memory.usage_pct}%)</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">nginx-rtmp</dt>
                <dd><ServicePill status={health.services.nginx_rtmp} /></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">EHome Listener</dt>
                <dd><ServicePill status={health.services.ehome_listener} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Active Streams</dt>
                <dd className="text-green-400">{health.streams.live} live, {health.streams.connecting} connecting</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 mb-4">Configuration Notes</h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li>
              <span className="text-gray-300 font-medium block mb-0.5">API Token</span>
              Stored in <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">/opt/ynled/.env</code> on the VPS. Never exposed in client-side code. Rotate by running <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">openssl rand -hex 32</code> and updating both <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">/opt/ynled/.env</code> and Vercel env vars.
            </li>
            <li>
              <span className="text-gray-300 font-medium block mb-0.5">Adding a Camera</span>
              Configure EHome on the camera first (Platform Access → EHome, port 7660, server: your VPS domain). Then provision it here with the matching Device ID.
            </li>
            <li>
              <span className="text-gray-300 font-medium block mb-0.5">YouTube Stream Key</span>
              Create a stream in YouTube Studio → Go Live → Stream. Enable "Start automatically when encoder connects." Paste the key when provisioning the camera.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
