export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const criteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const isValid = Object.values(criteria).every((criterion) => criterion);

  let strength = 'weak';
  const validCount = Object.values(criteria).filter((c) => c).length;
  if (validCount === 4) strength = 'strong';
  else if (validCount >= 2) strength = 'medium';

  return { isValid, criteria, strength };
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanedPhone = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleanedPhone);
};

export const validateZipCode = (zipCode, country = 'US') => {
  const zipRegexes = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    default: /^[A-Z0-9\s-]{3,10}$/i,
  };

  const regex = zipRegexes[country] || zipRegexes.default;
  return regex.test(zipCode);
};

export const validateBusinessName = (name) => {
  if (!name || name.trim().length < 3) {
    return { isValid: false, message: 'Business name must be at least 3 characters' };
  }
  if (name.trim().length > 100) {
    return { isValid: false, message: 'Business name must not exceed 100 characters' };
  }
  return { isValid: true, message: '' };
};

export const validateFileType = (file, allowedTypes) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

export const validateFileSize = (file, maxSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  const maskedUsername = username[0] + '*'.repeat(username.length - 1);
  return `${maskedUsername}@${domain}`;
};
