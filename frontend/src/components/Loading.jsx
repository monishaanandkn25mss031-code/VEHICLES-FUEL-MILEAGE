import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = "Loading records..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="text-sm font-medium tracking-wide">{text}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 rounded-2xl animate-pulse space-y-4">
      <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
      <div className="h-8 bg-slate-700/70 rounded w-2/3"></div>
      <div className="h-3 bg-slate-700/40 rounded w-1/2"></div>
    </div>
  );
}
