import type { CameraStatus } from '@/lib/types';

const config: Record<CameraStatus, { label: string; dot: string; text: string }> = {
  live: { label: 'Live', dot: 'bg-green-500 animate-pulse', text: 'text-green-400' },
  connecting: { label: 'Connecting', dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-400' },
  offline: { label: 'Offline', dot: 'bg-gray-500', text: 'text-gray-400' },
};

export default function StatusBadge({ status }: { status: CameraStatus }) {
  const c = config[status] ?? config.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
