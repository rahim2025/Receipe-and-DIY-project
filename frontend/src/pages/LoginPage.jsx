
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChefHat, UserCheck, Users, Camera, Chrome, Facebook, Apple, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotification } from '../hooks/useNotification';
import { validateForm } from '../utils/validation';
import BackgroundShapes from '../components/BackgroundShapes';
import Notification from '../components/Notification';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import '../styles/auth.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { login, isLoggingIn } = useAuthStore();
  const { notification, showNotification, hideNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, false);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setNeedsVerification(false);

    try {
      await login(formData);
      showNotification('Welcome back! Login successful.', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      const errorData = error.response?.data;
      
      // Check if email verification is required
      if (errorData?.requiresVerification) {
        setNeedsVerification(true);
        showNotification(errorData.message || 'Please verify your email to login.', 'error');
      } else {
        showNotification(error.response?.data?.message || 'Login failed. Please try again.', 'error');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await axiosInstance.post('api/auth/resend-verification', { 
        email: formData.email 
      });
      
      if (response.data.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setNeedsVerification(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
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
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="auth-main">
        {/* Login Form */}
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1>Welcome Back!</h1>
            <p>Sign in to continue your culinary journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
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
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="auth-btn primary"
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Email Verification Alert */}
            {needsVerification && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'start',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#92400E', fontWeight: '600' }}>
                    Email Verification Required
                  </p>
                  <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '13px', color: '#78350F' }}>
                    Please verify your email before logging in.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: isResending ? 'not-allowed' : 'pointer',
                      opacity: isResending ? 0.6 : 1
                    }}
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
        

            
            
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="features-preview">
          <h3>Join Our Community</h3>
          <div className="feature-list">
            <div className="feature-item">
              <ChefHat />
              Discover thousands of delicious recipes
            </div>
            <div className="feature-item">
              <Camera />
              Share your cooking adventures with photos
            </div>
            <div className="feature-item">
              <Users />
              Connect with food enthusiasts worldwide
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
