import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { formatCurrency, formatDate, getStageColor } from '../utils/formatters';

describe('OfficeFlow CRM - Frontend Unit Tests', () => {
  describe('1. Formatting Utilities', () => {
    it('should format currency correctly in INR (₹)', () => {
      expect(formatCurrency(3500000)).toMatch(/₹\s*35,00,000/);
      expect(formatCurrency(0)).toMatch(/₹\s*0/);
    });

    it('should handle date formatting in IST', () => {
      const dateStr = '2026-10-01T10:00:00.000Z';
      const formatted = formatDate(dateStr);
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Oct');
    });

    it('should provide distinct stage colors for Kanban stages', () => {
      expect(getStageColor('Discovery').text).toBe('text-blue-700');
      expect(getStageColor('Won').text).toBe('text-emerald-700');
      expect(getStageColor('Lost').text).toBe('text-rose-700');
    });
  });

  describe('2. UI Components', () => {
    it('should render StatusBadge with appropriate text and dot', () => {
      render(<StatusBadge status="Qualified" type="lead" />);
      expect(screen.getByText('Qualified')).toBeInTheDocument();
    });

    it('should render Deal Stage Badge', () => {
      render(<StatusBadge status="Won" type="deal" />);
      expect(screen.getByText('Won')).toBeInTheDocument();
    });

    it('should render PriorityBadge with correct priority text', () => {
      render(<PriorityBadge priority="High" />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });
});
