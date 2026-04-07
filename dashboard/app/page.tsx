'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Camera } from '@/lib/types';
import StatBar from '@/components/StatBar';
import CameraCard from '@/components/CameraCard';
import ActivityFeed from '@/components/ActivityFeed';

export default function DashboardPage() {
  const { data: cameras, mutate } = useSWR<Camera[]>('/api/cameras', fetcher, {
    refreshInterval: 10000,
  });

  return (
    <>
      <h1 className="text-xl font-bold text-gray-100 mb-6">LiveView Dashboard</h1>
      <StatBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-sm text-gray-300 mb-4">
            Cameras{cameras ? ` (${cameras.length})` : ''}
          </h2>
          {!cameras && <p className="text-sm text-gray-500">Loading…</p>}
          {cameras && cameras.length === 0 && (
            <p className="text-sm text-gray-500">
              No cameras yet.{' '}
              <a href="/cameras/new" className="text-brand hover:underline">
                Provision your first camera →
              </a>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cameras?.map((cam) => (
              <CameraCard key={cam.id} camera={cam} onRestart={() => mutate()} />
            ))}
          </div>
        </div>

        <div>
          <ActivityFeed />
        </div>
      </div>
    </>
  );
}
