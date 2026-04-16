import { cn, STATUS_COLORS, getStatusLabel } from '@/lib/utils';

interface Props {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', colorClass, className)}>
      {getStatusLabel(status)}
    </span>
  );
}
