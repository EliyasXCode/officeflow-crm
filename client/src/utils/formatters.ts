export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

export const formatDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

export const getStageColor = (stage: string): { bg: string; text: string; border: string } => {
  switch (stage) {
    case 'Discovery':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Proposal':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Negotiation':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Won':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Lost':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
};

export const getStatusColor = (status: string): { bg: string; text: string; dot: string } => {
  switch (status) {
    case 'New':
      return { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' };
    case 'Contacted':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    case 'Qualified':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'Unqualified':
      return { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
    case 'Converted':
      return { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
  }
};

export const getPriorityColor = (priority: string): { bg: string; text: string } => {
  switch (priority) {
    case 'High':
      return { bg: 'bg-red-50 text-red-700 border border-red-200', text: 'text-red-700' };
    case 'Medium':
      return { bg: 'bg-amber-50 text-amber-700 border border-amber-200', text: 'text-amber-700' };
    case 'Low':
      return { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', text: 'text-emerald-700' };
    default:
      return { bg: 'bg-slate-100 text-slate-700 border border-slate-200', text: 'text-slate-700' };
  }
};
