import React from 'react';
import { getStatusBadge } from '../utils/formatters';

export default function Badge({ children, variant, className = '' }) {
  const badgeStyle = variant ? getStatusBadge(variant) : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {children}
    </span>
  );
}
