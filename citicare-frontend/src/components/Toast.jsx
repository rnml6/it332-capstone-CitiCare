import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-green-400/30 bg-green-500/20',
  error: 'border-red-400/30 bg-red-500/20',
  warning: 'border-yellow-400/30 bg-yellow-500/20',
  info: 'border-blue-400/30 bg-blue-500/20',
};

const Toast = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`glass border rounded-xl p-4 flex items-center space-x-3 min-w-[300px] 
      animate-slide-up ${isExiting ? 'opacity-0 translate-x-full transition-all duration-300' : ''} 
      ${colors[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm text-white flex-1">{message}</p>
      <button onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }} 
        className="text-white/50 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};