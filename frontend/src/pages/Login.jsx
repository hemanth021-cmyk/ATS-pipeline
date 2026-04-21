import { useState, useEffect } from 'react';
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

  // Animation states
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

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
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 max-w-full bg-[#f5f7fa]/70 backdrop-blur-md dark:bg-slate-900/70 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-12">
          <span className="text-xl font-bold tracking-tighter text-[#006575] dark:text-[#54e0fd] font-headline">BioSynth Precision</span>
          <div className="hidden md:flex gap-8">
            <a className="font-headline font-bold tracking-tight text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-[#0055c4] transition-colors duration-300" href="#">Platform</a>
            <a className="font-headline font-bold tracking-tight text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-[#0055c4] transition-colors duration-300" href="#">Research</a>
            <a className="font-headline font-bold tracking-tight text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-[#0055c4] transition-colors duration-300" href="#">Compliance</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-headline font-bold tracking-tight text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer hover:text-[#0055c4]">Support</span>
          <div className="h-4 w-[1px] bg-outline-variant opacity-20"></div>
          <span className="font-headline font-bold tracking-tight text-sm text-[#006575] dark:text-[#54e0fd] cursor-pointer">System Status</span>
        </div>
      </nav>

      {/* Separation Logic */}
      <div className="fixed top-[68px] w-full bg-[#eef1f4] dark:bg-slate-800 h-[1px] z-40"></div>

      <main className={`min-h-screen pt-32 pb-20 px-8 lg:px-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative overflow-hidden transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Abstract Background Element */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Left Content: Bold Headline & Metrics */}
        <div className="w-full lg:w-1/2 z-10">
          <div className="inline-block px-3 py-1 mb-8 rounded-full bg-surface-container-low border border-outline-variant/10">
            <span className="label-sm font-label uppercase text-[0.625rem] tracking-[0.2em] text-on-surface-variant font-bold">Advanced Clinical Infrastructure</span>
          </div>
          <h1 className="font-headline text-5xl lg:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1] mb-6">
            CURATE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">PIPELINE</span>
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-md mb-12 leading-relaxed">
            Seamlessly orchestrate complex biomedical workflows with the BioSynth Precision engine. Experience near-zero latency in clinical data synthesis.
          </p>
        </div>

        {/* Right Content: Refined Auth Card */}
        <div className="w-full lg:w-[460px] z-10">
          <div className="glass-panel p-10 rounded-xl border border-outline-variant/15 shadow-2xl shadow-on-surface/[0.04]">
            <div className="mb-10">
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2 border-b-2 border-transparent">
                {mode === 'login' ? 'Access Portal' : 'Initialize Instance'}
              </h2>
              <p className="font-body text-sm text-on-surface-variant">
                {mode === 'login' 
                  ? 'Enter your credentials to initiate clinical session.' 
                  : 'Register secure company infrastructure.'}
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              
              {/* Name Field (Register Mode Only) */}
              {mode === 'register' && (
                 <div className="space-y-2 group fade-in">
                 <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-semibold">Instance Designator</label>
                 <div className="relative">
                   <input 
                     className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 focus:ring-0 focus:border-primary focus:outline-none transition-all duration-500 placeholder:text-outline-variant/50 font-body text-on-surface" 
                     placeholder="The Curation Group" 
                     type="text" 
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     required 
                   />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-500"></div>
                 </div>
               </div>
              )}

              {/* Email Field */}
              <div className="space-y-2 group">
                <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-semibold">Scientific ID</label>
                <div className="relative">
                  <input 
                    className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 focus:ring-0 focus:border-primary focus:outline-none transition-all duration-500 placeholder:text-outline-variant/50 font-body text-on-surface" 
                    placeholder="name@biosynth.com" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-500"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-semibold">Access Key</label>
                  {mode === 'login' && (
                    <a className="font-label text-[0.625rem] text-secondary hover:opacity-80 transition-opacity uppercase tracking-widest font-bold" href="#">Key Recovery</a>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input 
                    className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 focus:ring-0 focus:border-primary focus:outline-none transition-all duration-500 placeholder:text-outline-variant/50 font-body text-on-surface pr-10" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 opacity-40 hover:opacity-100 transition-opacity pb-1">
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary group-focus-within:w-[calc(100%-40px)] transition-all duration-500"></div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-error-container/10 border border-error/5 rounded-lg animate-fade-in">
                  <p className="text-[0.6875rem] font-bold text-error uppercase tracking-widest text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  className="w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-full font-headline font-bold text-on-primary-container shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none" 
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? 'PROCESSING...' : (mode === 'login' ? 'AUTHORIZE SESSION' : 'ESTABLISH INSTANCE')}</span>
                  {!loading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>
              </div>

              {/* Toggle Mode */}
              <div className="relative flex items-center justify-center py-4">
                <div className="absolute w-full h-[1px] bg-outline-variant/10"></div>
                <span className="relative px-4 bg-surface-container-lowest/50 backdrop-blur-sm font-label text-[0.625rem] text-outline-variant uppercase tracking-[0.2em]">OR EXPLORE OPTIONS</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  className="flex items-center justify-center gap-2 py-3 rounded-lg border border-outline-variant/20 font-body text-xs text-on-surface hover:bg-surface-container-low transition-colors uppercase tracking-widest font-bold" 
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' ? 'Create New Account' : 'Return to Authorization'}
                </button>
              </div>
            </form>
          </div>
          
          <p className="mt-8 text-center font-label text-[0.6875rem] text-on-surface-variant tracking-wider">
            System Infrastructure managed by <span className="text-primary font-semibold">BioSynth Precision Ops</span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#eef1f4] dark:bg-slate-950">
        <div className="flex flex-wrap justify-center gap-8 order-2 md:order-1">
          <a className="font-['Inter'] text-[0.6875rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#006575] transition-opacity duration-200" href="#">Terms of Service</a>
          <a className="font-['Inter'] text-[0.6875rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#006575] transition-opacity duration-200" href="#">Privacy Policy</a>
          <a className="font-['Inter'] text-[0.6875rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#006575] transition-opacity duration-200" href="#">System Status</a>
        </div>
        <p className="font-['Inter'] text-[0.6875rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 order-1 md:order-2 text-center md:text-right">
            © 2024 Clinical Transcendence Technologies. Technical Infrastructure v4.2.0
        </p>
      </footer>
    </div>
  );
}
