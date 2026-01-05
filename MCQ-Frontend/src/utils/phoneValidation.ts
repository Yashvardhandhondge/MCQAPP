/**
 * Normalize phone number by removing spaces, dashes, and other non-digit characters
 * @param phone - Phone number string
 * @returns Normalized phone number (digits only)
 */
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Format phone number to Indian format: +91XXXXXXXXXX
 * @param phone - Phone number string (can be in various formats)
 * @returns Formatted phone number in +91XXXXXXXXXX format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = normalizePhoneNumber(phone);

  // If already starts with 91, remove it and add +91
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91${digits.slice(2)}`;
  }

  // If starts with 0, remove it
  if (digits.startsWith('0') && digits.length === 11) {
    return `+91${digits.slice(1)}`;
  }

  // If 10 digits, assume it's Indian number and add +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // If already has +91, return as is (after normalizing)
  if (phone.startsWith('+91') && digits.length === 12) {
    return `+91${digits.slice(2)}`;
  }

  // Return normalized with +91 prefix if valid length
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Return as is if can't determine format
  return phone;
};

/**
 * Validate Indian phone number format
 * Must be: +91 followed by 10 digits, where first digit is 6-9
 * @param phone - Phone number string
 * @returns True if valid Indian phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Format: +91 followed by 10 digits, first digit must be 6-9
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Extract the 10-digit number from formatted phone number
 * @param phone - Phone number in +91XXXXXXXXXX format
 * @returns 10-digit number or empty string if invalid
 */
export const extractPhoneDigits = (phone: string): string => {
  if (validatePhoneNumber(phone)) {
    return phone.slice(3); // Remove +91 prefix
  }
  return '';
};

