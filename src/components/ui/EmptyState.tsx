import React from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-300">
      {Icon && (
        <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-stone-200/60 text-stone-600">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-stone-800">{title}</h3>
      <p className="text-xs text-stone-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
