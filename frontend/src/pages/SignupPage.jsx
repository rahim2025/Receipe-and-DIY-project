import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AtSign, ChefHat, Heart, UserPlus, Share, Brain, TrendingUp, Chrome, Facebook, Apple, Camera, Upload, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotification } from '../hooks/useNotification';
import { validateForm, checkPasswordStrength } from '../utils/validation';
import BackgroundShapes from '../components/BackgroundShapes';
import Notification from '../components/Notification';
import '../styles/auth.css';

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    interests: [],
    userType: '',
    agreeToTerms: false,
    newsletter: false,
    profilePic: '',
  });
  const [errors, setErrors] = useState({});

  const { signup, isSigningUp } = useAuthStore();
  const { notification, showNotification, hideNotification } = useNotification();
  const navigate = useNavigate();

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));

    // Clear interests error when user selects an interest
    if (errors.interests) {
      setErrors(prev => ({
        ...prev,
        interests: ''
      }));
    }
  };

  const handleUserTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      userType: type
    }));

    // Clear userType error when user selects a type
    if (errors.userType) {
      setErrors(prev => ({
        ...prev,
        userType: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, true);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        interests: formData.interests,
        userType: formData.userType,
        profilePic: formData.profilePic
      };
      
      await signup(signupData);
      showNotification(
        formData.profilePic 
          ? 'Account created successfully with profile photo! Welcome to Recipe & DIY Hub!' 
          : 'Account created successfully! Welcome to Recipe & DIY Hub!', 
        'success'
      );
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      showNotification(error.message || 'Registration failed. Please try again.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size should be less than 5MB', 'error');
      return;
    }

    setImageUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setFormData(prev => ({ ...prev, profilePic: base64 }));
        setImagePreview(base64);
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      showNotification('Error processing image', 'error');
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profilePic: '' }));
    setImagePreview(null);
  };

  const interestOptions = [
    { value: 'cooking', label: 'Cooking', icon: '🍳' },
    { value: 'baking', label: 'Baking', icon: '🧁' },
    { value: 'diy', label: 'DIY Crafts', icon: '🎨' },
    { value: 'home-decor', label: 'Home Decor', icon: '🏠' },
    { value: 'gardening', label: 'Gardening', icon: '🌱' },
    { value: 'healthy', label: 'Healthy Living', icon: '🥗' }
  ];

  const userTypeOptions = [
    { value: 'foodie', label: 'Foodie', description: 'I love cooking and recipes' },
    { value: 'crafter', label: 'Crafter', description: 'I enjoy DIY projects and crafts' },
    { value: 'both', label: 'Both', description: 'I love both cooking and crafting' }
  ];

  return (
    <div className="auth-container">
      <BackgroundShapes />
      <Notification notification={notification} onClose={hideNotification} />

      {/* Navigation */}
      <nav className="auth-nav">
        <div className="auth-nav-content">
          <Link to="/" className="nav-brand">
            <ChefHat />
            CraftyCook
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="auth-main">
        {/* Signup Form */}
        <div className="auth-card signup-card">
          {/* Header */}
          <div className="auth-header">
            <h1>Join CraftyCook!</h1>
            <p>Create your account and start sharing amazing recipes & DIY projects</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <User />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your first name"
                  required
                />
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  <User />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your last name"
                  required
                />
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div className="form-group">
              <label className="form-label">
                <Camera />
                Profile Photo (Optional)
              </label>
              <div className="profile-photo-upload">
                {imagePreview ? (
                  <div className="profile-preview">
                    <img src={imagePreview} alt="Profile preview" className="preview-image" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={removeImage}
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">
                      {imageUploading ? (
                        <div className="upload-spinner"></div>
                      ) : (
                        <Upload size={24} />
                      )}
                    </div>
                    <p>Click to upload your profile photo</p>
                    <small>JPG, PNG or GIF • Max 5MB</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                  disabled={imageUploading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label">
                <AtSign />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a username"
                required
              />
              <small className="input-help">This will be your unique identifier on CraftyCook</small>
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock />
                Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${passwordStrength.strength}%`, 
                        background: passwordStrength.color 
                      }}
                    ></div>
                  </div>
                  <div className="strength-text">{passwordStrength.text}</div>
                </div>
              )}
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock />
                Confirm Password
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            {/* User Type Selection */}
            <div className="form-group">
              <label className="form-label">
                <Heart />
                What describes you best?
              </label>
              <div className="interest-tags">
                {userTypeOptions.map((type) => (
                  <label key={type.value} className={`interest-tag ${formData.userType === type.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => handleUserTypeChange(e.target.value)}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
              {errors.userType && <div className="error-message">{errors.userType}</div>}
            </div>

            {/* Interests */}
            <div className="form-group">
              <label className="form-label">
                <Heart />
                What interests you most?
              </label>
              <div className="interest-tags">
                {interestOptions.map((interest) => (
                  <label key={interest.value} className={`interest-tag ${formData.interests.includes(interest.value) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      value={interest.value}
                      checked={formData.interests.includes(interest.value)}
                      onChange={() => handleInterestToggle(interest.value)}
                    />
                    <span>{interest.icon} {interest.label}</span>
                  </label>
                ))}
              </div>
              {errors.interests && <div className="error-message">{errors.interests}</div>}
            </div>

            {/* Terms and Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </label>
              {errors.agreeToTerms && <div className="error-message">{errors.agreeToTerms}</div>}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Send me recipes, tips, and craft inspiration via email
              </label>
            </div>

            <button
              type="submit"
              disabled={isSigningUp}
              className="auth-btn primary"
            >
              {isSigningUp ? 'Creating Account...' : (
                <>
                  <UserPlus />
                  Create Account
                </>
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <span>Or sign up with</span>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <button type="button" className="social-btn google">
                <Chrome />
              </button>
              <button type="button" className="social-btn facebook">
                <Facebook />
              </button>
              <button type="button" className="social-btn apple">
                <Apple />
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>

        {/* Benefits Preview */}
        <div className="benefits-preview">
          <h3>Why join CraftyCook?</h3>
          <div className="benefit-list">
            <div className="benefit-item">
              <div className="benefit-icon">
                <Share />
              </div>
              <div className="benefit-content">
                <h4>Share & Discover</h4>
                <p>Share your creations and discover amazing recipes and DIY projects from our community</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <Brain />
              </div>
              <div className="benefit-content">
                <h4>AI-Powered Suggestions</h4>
                <p>Get personalized recipe recommendations based on your available ingredients</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <TrendingUp />
              </div>
              <div className="benefit-content">
                <h4>Track Your Progress</h4>
                <p>Keep track of your cooking journey and DIY projects with detailed analytics</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;