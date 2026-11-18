import React from 'react';

export default function StatCard({ title, value, unit = '', icon: Icon, badge, color = 'blue', subtitle }) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-600/15 text-blue-400 border-blue-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(37,99,235,0.15)]',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-600/15 text-amber-400 border-amber-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-600/15 text-indigo-400 border-indigo-500/30',
      glow: 'hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]',
    },
  }[color] || {
    border: 'border-slate-700/50 hover:border-slate-600',
    iconBg: 'bg-slate-700/30 text-slate-300 border-slate-600',
    glow: '',
  };

  return (
    <div className={`glass-card p-6 rounded-2xl border transition-all duration-300 ${colorMap.border} ${colorMap.glow}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap.iconBg} shrink-0`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <span>{badge.label}</span>
          <span className="font-semibold text-slate-300">{badge.value}</span>
        </div>
      )}
    </div>
  );
}
