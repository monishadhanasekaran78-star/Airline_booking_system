/**
 * Utilities for Indian currency formatting (₹ INR only) and IST date/time
 */

// Formats amounts in Indian Rupees (e.g. ₹5,400 or ₹1,25,000)
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

// Formats date into Indian style: "05 Oct 2026"
export function formatISTDate(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

// Formats time into 12-hour IST format: "06:30 AM"
export function formatISTTime(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(d);
  } catch {
    return '';
  }
}

// Calculates flight duration string: "2h 45m"
export function calculateDuration(depTime: string | Date, arrTime: string | Date): string {
  try {
    const start = new Date(depTime).getTime();
    const end = new Date(arrTime).getTime();
    const diffMinutes = Math.max(0, Math.floor((end - start) / (1000 * 60)));

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  } catch {
    return '--';
  }
}

// Standard Indian Airport destinations
export const INDIAN_AIRPORTS = [
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport' },
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport' },
  { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore International Airport' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport' },
];
