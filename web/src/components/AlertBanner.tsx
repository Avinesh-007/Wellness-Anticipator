import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onDismiss, onClose }) => {
  const handleClose = onDismiss || onClose;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
  };

  return (
    <div className={`flex items-start justify-between p-4 border rounded-xl shadow-sm mb-4 ${styles[type]}`}>
      <div className="flex items-start space-x-3">
        {icons[type]}
        <div className="text-sm font-medium">{message}</div>
      </div>
      {handleClose && (
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 ml-3 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
