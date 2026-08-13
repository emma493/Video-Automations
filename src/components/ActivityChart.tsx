import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface ActivityChartProps {
  isDarkMode?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ isDarkMode }) => {
  // Generate sample 7-day timeline data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => {
    return {
      name: day,
      Completed: Math.floor(2 + (i % 3) * 3 + Math.random() * 2),
      Failed: i === 3 ? 1 : 0,
      Scheduled: Math.floor(1 + Math.random() * 3)
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            📈 Upload Activity & Performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily breakdown of completed vs failed video upload attempts over the past 7 days
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          96.2% Overall Success Rate
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? '#334155' : '#e2e8f0'}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={isDarkMode ? '#94a3b8' : '#64748b'}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                borderRadius: '0.75rem',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            />
            <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Uploads" />
            <Bar dataKey="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Failed Retries" />
            <Bar dataKey="Scheduled" fill="#6366f1" radius={[4, 4, 0, 0]} name="Scheduled Queue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
