import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-200/70 rounded-lg w-full" />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  );
};
