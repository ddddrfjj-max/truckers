import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', trend, trendUp }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trendUp ? 'text-green-600' : 'text-red-500')}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
