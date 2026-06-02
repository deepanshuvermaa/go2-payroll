// Input validation utilities for Indian payroll data

export const validatePAN = (pan) => {
  if (!pan) return true; // Optional field
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const validateAadhar = (aadhar) => {
  if (!aadhar) return true; // Optional field
  const cleaned = aadhar.replace(/[-\s]/g, '');
  return /^\d{12}$/.test(cleaned);
};

export const validateIFSC = (ifsc) => {
  if (!ifsc) return true; // Optional field
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
};

export const validatePhone = (phone) => {
  if (!phone) return false; // Required field
  const cleaned = phone.replace(/[-\s+()]/g, '');
  return /^\d{10,13}$/.test(cleaned);
};

export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Format Aadhar with dashes: XXXX-XXXX-XXXX
export const formatAadhar = (aadhar) => {
  const cleaned = aadhar.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join('-');
};

// Format PAN to uppercase
export const formatPAN = (pan) => {
  return pan.toUpperCase().slice(0, 10);
};

// Format IFSC to uppercase
export const formatIFSC = (ifsc) => {
  return ifsc.toUpperCase().slice(0, 11);
};

export default {
  validatePAN,
  validateAadhar,
  validateIFSC,
  validatePhone,
  validateEmail,
  formatAadhar,
  formatPAN,
  formatIFSC
};
