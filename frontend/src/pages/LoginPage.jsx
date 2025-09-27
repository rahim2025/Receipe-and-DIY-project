
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChefHat, UserCheck, Users, Camera, Chrome, Facebook, Apple } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotification } from '../hooks/useNotification';
import { validateForm } from '../utils/validation';
import BackgroundShapes from '../components/BackgroundShapes';
import Notification from '../components/Notification';
import '../styles/auth.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});

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

    try {
      await login(formData);
      showNotification('Welcome back! Login successful.', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      showNotification(error.message || 'Login failed. Please try again.', 'error');
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

            {/* Divider */}
            <div className="divider">
              <span>Or continue with</span>
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
