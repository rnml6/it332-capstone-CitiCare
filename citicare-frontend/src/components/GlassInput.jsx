import { forwardRef } from 'react';

const GlassInput = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  type = 'text',
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-blue-200">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        )}
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            className={`glass-textarea ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400' : ''} ${className}`}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            className={`glass-input ${Icon ? 'pl-10' : ''} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''} ${className}`}
            {...props}
          />
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;