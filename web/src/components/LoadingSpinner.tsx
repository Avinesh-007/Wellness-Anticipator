import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading health data...' }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-sm text-slate-500 font-medium">{message}</p>
  </div>
);
