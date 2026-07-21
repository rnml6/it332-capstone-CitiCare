import { Loader2 } from 'lucide-react';

const GlassButton = ({ 
  children, 
  variant = 'primary', 
  loading = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'glass-btn-primary',
    secondary: 'glass-btn-secondary',
    danger: 'glass-btn-danger',
    success: 'glass-btn-success',
  };

  return (
    <button
      className={`${variants[variant]} flex items-center justify-center space-x-2 ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default GlassButton;