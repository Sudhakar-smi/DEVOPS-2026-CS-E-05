// Format Indian Rupee currency (₹)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Format Date
export const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

// Format Time
export const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

// Get Status Badge Color Styles
export const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'published':
    case 'completed':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in-progress':
    case 'in_progress':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'draft':
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled':
    case 'suspended':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'high':
    case 'critical':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

// Export JSON or Table to CSV
export const downloadCSV = (filename, csvData) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
