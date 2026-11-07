import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import { ApiResponse } from '../types/auth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine post-login redirect destination (defaults to /dashboard)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFieldErrors({});
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!validate()) return;

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 700);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const apiError = err.response.data as ApiResponse<unknown>;
        if (apiError.error) {
          setErrorMessage(apiError.error.message);
          return;
        }
      }
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid email or password. Please verify your credentials and try again.'
      );
    }
  };

  return (
    <PageLayout className="min-h-[calc(100vh-144px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F9FC]">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* Left Side: Brand Mission Showcase (visible on lg+) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
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
              Navigate physical spaces with confidence.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Sign in to explore verified accessibility facility audits, contribute community observations, or manage your organization's venues.
            </p>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Multi-tier cryptographic audit verification</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>4-State standardized criteria model</span>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-in Form & Quick Access */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight font-display">
              Welcome back
            </h1>
            <p className="text-xs text-[#486581] mt-1">
              Sign in to your AccessMap account to continue
            </p>
          </div>

          {/* Quick Demo Autofill Bar for frictionless testing */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#E8F5F1] border border-[#0F766E]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Quick Demo Fill
              </span>
              <span className="text-[10px] text-[#486581]">1-click test credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('user@accessmap.local', 'UserPass123!')}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-[#172B3A] hover:text-[#0F766E] border border-slate-200 hover:border-[#0F766E]/40 rounded-xl text-left text-xs font-semibold transition-all shadow-2xs cursor-pointer flex flex-col"
              >
                <span className="text-[10px] text-[#0F766E] font-bold">Auditor Account</span>
                <span className="text-[11px] truncate text-[#486581]">user@accessmap.local</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@accessmap.local', 'AdminPass123!')}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-[#172B3A] hover:text-[#0F766E] border border-slate-200 hover:border-[#0F766E]/40 rounded-xl text-left text-xs font-semibold transition-all shadow-2xs cursor-pointer flex flex-col"
              >
                <span className="text-[10px] text-amber-700 font-bold">Administrator</span>
                <span className="text-[11px] truncate text-[#486581]">admin@accessmap.local</span>
              </button>
            </div>
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
              <span className="font-medium">Signed in successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-email"
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
                  placeholder="name@organization.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] ${
                    fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#172B3A]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLoading || isSuccess}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
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
                <p id="login-password-error" className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0c615a] active:bg-[#094d48] text-white font-semibold text-sm shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#0F766E]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-[#486581]">
            <span>Don't have an account?</span>
            <Link to="/register" className="text-[#0F766E] hover:text-[#0c615a] font-bold">
              Create an account
            </Link>
          </div>

        </div>

      </div>
    </PageLayout>
  );
};

export default LoginPage;
