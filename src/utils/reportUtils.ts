import React from 'react';

/**
 * Masks the last 4 digits of a phone number with "____" (four underscores)
 * for patient data protection and privacy when viewing reports online.
 * e.g., "9876543210" -> "987654____"
 * e.g., "+91 9876543210" -> "987654____"
 */
export function maskMobileForOnlineReport(mobile: string | undefined | null): string {
  if (!mobile) return '______';
  
  // Extract all digits
  const digitsOnly = mobile.replace(/\D/g, '');
  
  // If phone has 10 or 12 digits (like Indian mobile numbers)
  if (digitsOnly.length >= 10) {
    // If it starts with 91 country code (12 digits)
    const baseDigits = digitsOnly.length === 12 && digitsOnly.startsWith('91')
      ? digitsOnly.slice(2)
      : digitsOnly;
    
    const visiblePrefix = baseDigits.slice(0, Math.max(0, baseDigits.length - 4));
    return `${visiblePrefix}____`;
  }
  
  if (digitsOnly.length >= 6) {
    const visiblePrefix = digitsOnly.slice(0, digitsOnly.length - 4);
    return `${visiblePrefix}____`;
  }

  return '____';
}

/**
 * Formats a phone number with country prefix and last 4 digits masked with "____"
 * e.g. "+91 987654____"
 */
export function formatOnlineReportMobile(mobile: string | undefined | null): string {
  const masked = maskMobileForOnlineReport(mobile);
  return `+91 ${masked}`;
}
