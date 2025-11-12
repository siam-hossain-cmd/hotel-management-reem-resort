import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hotel-login-container">
      <div className="hotel-login-overlay"></div>
      
      <div className="hotel-login-card">
        {/* Logo and Header */}
        <div className="hotel-login-header">
          <div className="hotel-logo">
            <ArrowRight size={32} className="hotel-logo-icon" />
          </div>
          <h1 className="hotel-title">Reem Resort</h1>
          <p className="hotel-subtitle">Hotel Management System</p>
          <p className="hotel-signin-text">Please sign in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="hotel-login-form">
          {error && (
            <div className="hotel-error-message">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="hotel-form-group">
            <label htmlFor="email" className="hotel-form-label">
              Email Address
            </label>
            <div className="hotel-input-wrapper">
              <Mail size={18} className="hotel-input-icon" />
              <input
                type="text"
                name="email"
                id="email"
                className="hotel-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="hotel-form-group">
            <label htmlFor="password" className="hotel-form-label">
              Password
            </label>
            <div className="hotel-input-wrapper">
              <Lock size={18} className="hotel-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                className="hotel-input"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hotel-password-toggle"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="hotel-form-group">
            <button
              type="submit"
              className="hotel-signin-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="hotel-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <ArrowRight size={18} className="hotel-button-icon" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;