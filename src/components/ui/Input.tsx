import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all disabled:bg-stone-50 disabled:text-stone-400 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-stone-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
