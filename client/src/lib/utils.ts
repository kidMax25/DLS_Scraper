import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind's merge functionality
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats currency values (coins or dollars)
 */
export function formatCurrency(amount: number, currency: 'coins' | 'usd' = 'coins'): string {
  if (currency === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US').format(amount) + ' Coins';
}

/**
 * Formats date objects to readable strings
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Calculates win rate percentage
 */
export function calculateWinRate(won: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((won / total) * 100);
}

/**
 * Generates a random match code
 */
export function generateMatchCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Calculates the percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Makes API calls to the backend Flask server
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Always include credentials
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json'
    }
  };

  try {
    console.log(`Calling API endpoint: ${endpoint}`);
    const response = await fetch(endpoint, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}