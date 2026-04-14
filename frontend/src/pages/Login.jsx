import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import '../design-system.css';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data } = await api.post('/auth/register', {
          email,
          password,
          name: name.trim() || undefined,
        });
        login(data.token);
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.token);
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        }
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Header - Asymmetrical Design (Editorial Feel) */}
      <header className="bg-surface-container-low pt-10 pb-16 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-8">
            {/* Left: Brand - More padding on left */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{fontVariationSettings: "'FILL' 1"}}>
                  work
                </span>
              </div>
              <h1 className="headline-sm text-on-surface tracking-tight leading-tight">
                Executive Workspace
              </h1>
              <p className="body-sm text-on-surface-variant/70 mt-2">
                Hiring Intelligence Platform
              </p>
            </div>
            {/* Right: Help - Minimal */}
            <a href="#help" className="p-3 rounded-full hover:bg-surface-container transition-all text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined text-xl">help_outline</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main - Center with breathing room */}
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Enhanced Paper-on-Glass Layering */}
          <div className="bg-surface-container-low p-1.5 rounded-3xl shadow-lg">
            <div className="bg-surface-container-lowest rounded-2xl p-12 space-y-8">
              {/* Header with Editorial Feel */}
              <div className="space-y-3">
                <h1 className="headline-sm text-on-surface tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="body-md text-on-surface-variant/75 leading-relaxed">
                  {mode === 'login'
                    ? 'Access your hiring pipeline and manage candidates in real-time.'
                    : 'Set up your company to start building your dream team.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company Name (Register Only) */}
                {mode === 'register' && (
                  <div>
                    <label className="label-sm block mb-2.5 text-on-surface font-medium" htmlFor="company-name">
                      Company Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline pointer-events-none">
                        <span className="material-symbols-outlined text-lg">apartment</span>
                      </span>
                      <input
                        id="company-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="organization"
                        placeholder="Acme Inc."
                        className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all duration-200 outline-none hover:border-outline-variant/30"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="label-sm block mb-2.5 text-on-surface font-medium" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline pointer-events-none">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@company.com"
                      className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all duration-200 outline-none hover:border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="label-sm text-on-surface font-medium" htmlFor="password">
                      Password
                    </label>
                    {mode === 'login' && (
                      <a href="#forgot" className="text-xs font-semibold text-primary hover:text-primary-dim transition-colors">
                        Forgot?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline pointer-events-none">
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      className="block w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/15 focus:border-primary/50 transition-all duration-200 outline-none hover:border-outline-variant/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me (Login Only) */}
                {mode === 'login' && (
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-5 w-5 rounded-md text-primary border-outline-variant/30 focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="body-sm text-on-surface-variant cursor-pointer">
                      Remember me for 30 days
                    </label>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="bg-error-container/10 border border-error-container rounded-xl p-4">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-error flex-shrink-0">error</span>
                      <p className="label-sm text-error">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-4 px-5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switch - Editorial Divider */}
              <div className="pt-6 border-t border-outline-variant/15">
                <p className="text-xs text-on-surface-variant leading-relaxed text-center">
                  {mode === 'login' ? (
                    <>
                      Don't have an account? {' '}
                      <button
                        type="button"
                        onClick={() => {setMode('register'); setError('');}}
                        className="text-primary font-semibold hover:text-primary-dim transition-colors"
                      >
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account? {' '}
                      <button
                        type="button"
                        onClick={() => {setMode('login'); setError('');}}
                        className="text-primary font-semibold hover:text-primary-dim transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges - Subtle */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center opacity-50 hover:opacity-75 transition-opacity">
              <span className="material-symbols-outlined text-lg mb-1.5 text-on-surface-variant">security</span>
              <span className="label-xs text-on-surface-variant">Secure SSL</span>
            </div>
            <div className="flex flex-col items-center opacity-50 hover:opacity-75 transition-opacity border-l border-r border-outline-variant/20 px-2">
              <span className="material-symbols-outlined text-lg mb-1.5 text-on-surface-variant">encrypted</span>
              <span className="label-xs text-on-surface-variant">Encrypted</span>
            </div>
            <div className="flex flex-col items-center opacity-50 hover:opacity-75 transition-opacity">
              <span className="material-symbols-outlined text-lg mb-1.5 text-on-surface-variant">verified_user</span>
              <span className="label-xs text-on-surface-variant">Verified</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low/30 backdrop-blur-sm border-t border-outline-variant/10 mt-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <p className="text-label-sm text-on-surface-variant/60">
              © 2026 The Executive Workspace
            </p>
            <div className="flex gap-8">
              <a href="#privacy" className="text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#security" className="text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
