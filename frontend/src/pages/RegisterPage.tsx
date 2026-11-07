import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Compass,
  Check,
  Building2,
  MapPin,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import { ApiResponse } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Full name cannot exceed 100 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (password.length > 72) {
      errors.password = 'Password cannot exceed 72 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!validate()) return;

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const apiError = err.response.data as ApiResponse<unknown>;
        if (apiError.error) {
          setErrorMessage(apiError.error.message);
          if (apiError.error.details && typeof apiError.error.details === 'object') {
            setFieldErrors(apiError.error.details as Record<string, string>);
          }
          return;
        }
      }
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <PageLayout className="min-h-[calc(100vh-144px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* Left Side: Community Mission Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0F766E]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white font-display">AccessMap</span>
                <span className="block text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">
                  Physical Inclusivity
                </span>
              </div>
            </Link>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3 font-display">
              Build an accessible world together.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Join thousands of community auditors, wheelchair users, and venue owners cataloguing ground-truth physical accessibility data.
            </p>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-white/10 space-y-4">
            <div className="flex items-start gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Verified Field Audits</strong>
                <span className="text-slate-300 text-[11px]">Submit observations with photos for administrator review</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Business Venue Claims</strong>
                <span className="text-slate-300 text-[11px]">Claim official ownership of your business facilities</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-medium">Personalized Accessibility</strong>
                <span className="text-slate-300 text-[11px]">Save preferences for elevators, ramps, and restrooms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Account Registration Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight font-display">
              Create your account
            </h1>
            <p className="text-xs text-[#486581] mt-1">
              Join the AccessMap community to discover and review accessible places
            </p>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium">Account created successfully! Redirecting to your dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-bold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  disabled={isLoading || isSuccess}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="e.g. Maya Sharma"
                  aria-invalid={!!fieldErrors.fullName}
                  aria-describedby={fieldErrors.fullName ? 'reg-name-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] ${
                    fieldErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p id="reg-name-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading || isSuccess}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="maya@example.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] ${
                    fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="reg-email-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#172B3A]"
                >
                  Password
                </label>
                <span className="text-[11px] text-[#486581]">min. 8 characters</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading || isSuccess}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] ${
                    fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="reg-password-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading || isSuccess}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'reg-confirm-password-error' : undefined}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] ${
                    fieldErrors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] rounded-md"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="reg-confirm-password-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0c615a] active:bg-[#094d48] text-white font-semibold text-sm shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#0F766E]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-[#486581]">
            <span>Already have an account?</span>
            <Link to="/login" className="text-[#0F766E] hover:text-[#0c615a] font-bold">
              Sign in here
            </Link>
          </div>

        </div>

      </div>
    </PageLayout>
  );
};

export default RegisterPage;
