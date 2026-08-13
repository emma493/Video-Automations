import React from 'react';
import { DashboardStats } from '../types';
import { Video, Clock, Loader2, CheckCircle, AlertTriangle, TrendingUp, Calendar, CheckCheck } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Videos',
      value: stats.total,
      icon: Video,
      accentBorder: 'border-l-[#667EEA]',
      badgeColor: 'text-[#667EEA] bg-[#667EEA]/10'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      accentBorder: 'border-l-[#FFD700]',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
    },
    {
      label: 'Processing',
      value: stats.processing,
      icon: Loader2,
      accentBorder: 'border-l-[#667EEA]',
      badgeColor: 'text-[#667EEA] bg-[#667EEA]/10',
      animateIcon: stats.processing > 0
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      accentBorder: 'border-l-[#00C853]',
      badgeColor: 'text-[#00C853] bg-[#00C853]/10'
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: AlertTriangle,
      accentBorder: 'border-l-[#FF1744]',
      badgeColor: 'text-[#FF1744] bg-[#FF1744]/10'
    },
    {
      label: 'Success Rate',
      value: `${stats.success_rate}%`,
      icon: TrendingUp,
      accentBorder: 'border-l-[#764BA2]',
      badgeColor: 'text-[#764BA2] dark:text-purple-300 bg-[#764BA2]/10'
    },
    {
      label: 'Total Uploads',
      value: stats.total_uploads,
      icon: CheckCheck,
      accentBorder: 'border-l-[#00C853]',
      badgeColor: 'text-[#00C853] bg-[#00C853]/10'
    },
    {
      label: 'Due in 24h',
      value: stats.upcoming_24h,
      icon: Calendar,
      accentBorder: 'border-l-[#FFD700]',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${card.accentBorder} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider truncate">
                {card.label}
              </p>
              <div className={`p-1 rounded-lg ${card.badgeColor}`}>
                <IconComponent
                  className={`w-3.5 h-3.5 ${card.animateIcon ? 'animate-spin' : ''}`}
                />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {card.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};

