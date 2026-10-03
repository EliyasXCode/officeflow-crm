import React from 'react';
import { getStatusColor, getStageColor } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  type?: 'lead' | 'deal' | 'task' | 'user';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'lead', className = '' }) => {
  if (type === 'deal') {
    const { bg, text, border } = getStageColor(status);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${text} ${border} ${className}`}
      >
        {status}
      </span>
    );
  }

  const { bg, text, dot } = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};
