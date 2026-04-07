'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Stats } from '@/lib/types';

export default function StatBar() {
  const { data } = useSWR<Stats>('/api/stats', fetcher, { refreshInterval: 10000 });

  const stats = [
    { label: 'Total Cameras', value: data?.cameras.total ?? '—' },
    { label: 'Live', value: data?.cameras.live ?? '—', highlight: true },
    { label: 'Connecting', value: data?.cameras.connecting ?? '—' },
    { label: 'Offline', value: data?.cameras.offline ?? '—' },
    { label: 'Viewers', value: data?.viewers ?? '—' },
    { label: 'Clients', value: data?.clients ?? '—' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6">
      {stats.map(({ label, value, highlight }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-gray-100'}`}>
            {value}
          </div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
