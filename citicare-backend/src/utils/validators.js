export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+63|0)[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (fields, body) => {
  const missing = [];
  for (const field of fields) {
    if (!body[field] && body[field] !== 0) {
      missing.push(field);
    }
  }
  return missing;
};