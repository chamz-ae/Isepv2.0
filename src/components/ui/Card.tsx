import React from 'react';

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-stone-200/90 rounded-xl p-5 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-stone-400 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4 border-b border-stone-100 pb-3">
      <div>
        <h3 className="text-base font-bold text-stone-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
