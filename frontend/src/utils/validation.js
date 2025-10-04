export const checkPasswordStrength = (password) => {
  if (!password) return { strength: 0, text: '', color: '#e0e0e0' };

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  let strength, text, color;

  if (score === 0) {
    strength = 0;
    text = 'Enter a password';
    color = '#e0e0e0';
  } else if (score <= 2) {
    strength = 25;
    text = 'Weak password';
    color = '#e74c3c';
  } else if (score <= 3) {
    strength = 50;
    text = 'Fair password';
    color = '#f39c12';
  } else if (score <= 4) {
    strength = 75;
    text = 'Good password';
    color = '#27ae60';
  } else {
    strength = 100;
    text = 'Strong password';
    color = '#27ae60';
  }

  return {
    strength,
    text,
    color,
    feedback: feedback.slice(0, 3), // Show max 3 suggestions
    score
  };
};

export const validateForm = (formData, isSignup = false) => {
  const errors = {};

  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (isSignup && formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (isSignup) {
    // First name validation
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Username validation
    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password confirmation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    // User type validation
    if (!formData.userType) {
      errors.userType = 'Please select your interests';
    }

    // Interests validation
    if (!formData.interests || formData.interests.length === 0) {
      errors.interests = 'Please select at least one interest';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default { checkPasswordStrength, validateForm };