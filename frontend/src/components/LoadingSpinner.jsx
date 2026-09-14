import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  isAI = false
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center">
      <div className="relative flex items-center justify-center">
        {isAI ? (
          <>
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-70 animate-pulse"></div>
            <div className="relative p-3 bg-white rounded-full shadow-lg border border-indigo-100">
              <Sparkles className="w-7 h-7 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </>
        ) : (
          <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-indigo-600 animate-spin`} />
        )}
      </div>
      {text && (
        <p className={`text-sm font-medium ${isAI ? 'text-indigo-900 animate-pulse' : 'text-slate-600'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-w-sm w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
