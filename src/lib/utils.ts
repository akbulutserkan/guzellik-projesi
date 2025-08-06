import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Turkish Lira currency.
 * @param amount The number to format.
 * @returns The formatted currency string. e.g., "1.250,50 ₺"
 */
export function formatCurrency(amount: number) {
  if (typeof amount !== 'number') {
    return '0 ₺';
  }
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a 10-digit phone number string into a standard Turkish format.
 * @param phone The raw phone string (e.g., "5xxxxxxxxx").
 * @returns The formatted phone string (e.g., "5xx xxx xx xx").
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone || !/^[5]\d{9}$/.test(phone)) {
    return phone || ""; // Return original string or empty if invalid
  }
  const cleaned = ("" + phone).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return phone;
}

/**
 * Converts a string to Title Case, correctly handling Turkish characters.
 * Example: "bıyık ve dudak" -> "Bıyık Ve Dudak"
 * @param str The string to format.
 * @returns The formatted string in title case.
 */
export const formatTitleCase = (str: string): string => {
    if (!str) return "";
    return str
        .split(' ')
        .map(word => 
            word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR')
        )
        .join(' ');
};

/**
 * Converts a string to UPPERCASE, correctly handling Turkish characters.
 * Example: "bıyık" -> "BIYIK"
 * @param str The string to format.
 * @returns The formatted string in upper case.
 */
export const formatUpperCase = (str: string): string => {
    if (!str) return "";
    return str.toLocaleUpperCase('tr-TR');
};
