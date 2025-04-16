/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date in Indian format (DD-MMM-YYYY)
 */
export const formatDate = (date: string) => {
  if (!date) return 'N/A';
  const dateObj = new Date(date);
  
  // Format as DD-MMM-YYYY (Indian format)
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format expiry date in MM/YY format
 */
export const formatExpiryDate = (date: string) => {
  if (!date) return 'MM/YY';
  const dateObj = new Date(date);
  
  // Format as MM/YY
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  
  return `${month}/${year}`;
};

/**
 * Calculate utilization percentage
 */
export const calculateUtilization = (balance: number, limit: number) => {
  if (!limit) return 0;
  return (balance / limit) * 100;
};

/**
 * Determine if due date is approaching (within 7 days)
 */
export const isDueDateApproaching = (dueDate: string) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 7;
};
