import { validationResult } from 'express-validator';

const validate = (schemas) => {
  return async (req, res, next) => {
    await Promise.all(schemas.map((schema) => schema.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  };
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const validateStep2 = (req, res, next) => {
  const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
  const errors = [];

  if (!firstName || firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
  }

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (!phone || !phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
    errors.push({ field: 'phone', message: 'Valid phone number is required' });
  }

  if (!password || !passwordRegex.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters with one uppercase letter, one number, and one special character',
    });
  }

  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateStep3 = (req, res, next) => {
  const { street, city, state, country, zipCode } = req.body;
  const errors = [];

  if (!street || street.trim().length < 5) {
    errors.push({ field: 'street', message: 'Street address is required (minimum 5 characters)' });
  }

  if (!city || city.trim().length < 2) {
    errors.push({ field: 'city', message: 'City is required' });
  }

  if (!state || state.trim().length < 2) {
    errors.push({ field: 'state', message: 'State/Province is required' });
  }

  if (!country || country.trim().length < 2) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  if (!zipCode || zipCode.trim().length < 3) {
    errors.push({ field: 'zipCode', message: 'Postal/Zip code is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateStep4 = (req, res, next) => {
  const { businessName, businessType, registrationNumber, taxId, businessCategory, description } = req.body;
  const errors = [];

  if (!businessName || businessName.trim().length < 3) {
    errors.push({ field: 'businessName', message: 'Business name must be at least 3 characters' });
  }

  if (!businessType || !['individual', 'company', 'partnership'].includes(businessType)) {
    errors.push({ field: 'businessType', message: 'Valid business type is required' });
  }

  if (!registrationNumber || registrationNumber.trim().length < 3) {
    errors.push({ field: 'registrationNumber', message: 'Business registration number is required' });
  }

  if (!taxId || taxId.trim().length < 3) {
    errors.push({ field: 'taxId', message: 'Tax ID/VAT number is required' });
  }

  if (!businessCategory || businessCategory.trim().length < 2) {
    errors.push({ field: 'businessCategory', message: 'Business category is required' });
  }

  if (!description || description.trim().length < 50 || description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description must be between 50 and 500 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateVerificationCode = (req, res, next) => {
  const { code } = req.body;
  const errors = [];

  if (!code || !/^\d{6}$/.test(code)) {
    errors.push({ field: 'code', message: 'Valid 6-digit code is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export { validate, validateStep2, validateStep3, validateStep4, validateVerificationCode };
