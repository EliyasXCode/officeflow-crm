import React from 'react';
import { getPriorityColor } from '../../utils/formatters';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const { bg } = getPriorityColor(priority);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg} ${className}`}
    >
      {priority}
    </span>
  );
};
