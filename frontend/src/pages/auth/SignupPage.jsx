import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, ArrowRight, Coffee } from 'lucide-react';
import { authAPI } from '../../api/client';

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null
      });
      
      if (response.success) {
        setRegistered(true);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="size-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Welcome to DEMS, {formData.full_name.split(' ')[0]}!
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-green-600 mb-4">
              Please check your email to verify your account.
            </p>
            <div className="animate-pulse text-gray-500 text-sm">
              Redirecting you to login page...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Ethiopian Tricolor Accent */}
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Coffee className="size-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
              </div>
            </div>
            <div className="h-1 w-24 mx-auto mb-6 flex rounded-full overflow-hidden">
              <div className="flex-1 bg-green-500" />
              <div className="flex-1 bg-yellow-400" />
              <div className="flex-1 bg-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join DEMS to discover amazing events in Ethiopia</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Abebe Kebede"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">We'll send a confirmation email to this address</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="+251 911 234 567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Are you an organizer?{' '}
              <Link to="/organizer/signup" className="text-gray-900 font-semibold hover:text-green-600 hover:underline">
                Create organizer account
              </Link>
            </p>
          </div>

          {/* Ethiopian Pattern Decoration */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 opacity-40">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <div className="w-1 h-1 bg-red-500 rounded-full" />
              <div className="w-8 h-px bg-gray-300" />
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <div className="w-1 h-1 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): add landing page hero section and search bar
// Update for: feat(frontdoor): implement checkout timer display and payment button
// Update for: feat(frontdoor): add POST /api/auth/register and /api/auth/login endpoints
// Update for: feat(frontdoor): implement POST /api/payments/init with reservation and cart lock checks
// Update for: feat(frontdoor): implement JWT-signed QR payload generation for digital tickets
// Update for: feat(frontdoor): finalize users, orders, and order_items schema constraints in Prisma