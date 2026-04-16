import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

export const STATUS_COLORS: Record<string, string> = {
  // Shipment
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-blue-100 text-blue-700',
  BIDDING: 'bg-yellow-100 text-yellow-700',
  BOOKED: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
  // Bid
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
  // Booking
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DRIVER_EN_ROUTE: 'bg-indigo-100 text-indigo-700',
  // Verification
  NOT_SUBMITTED: 'bg-gray-100 text-gray-500',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  // User
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
};

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRIVER_EN_ROUTE: 'Driver En Route',
    IN_TRANSIT: 'In Transit',
    NOT_SUBMITTED: 'Not Submitted',
    UNDER_REVIEW: 'Under Review',
    PENDING_VERIFICATION: 'Pending Verification',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}
