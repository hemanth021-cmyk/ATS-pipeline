import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Title, Label, Body, Button, TextField, TonalContainer } from '../components/UI';
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
    <div className="min-h-screen flex bg-background selection:bg-primary/20">
      {/* Editorial Hero Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative overflow-hidden bg-surface">
        <div className="z-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary">all_inclusive</span>
            </div>
            <Title className="font-black tracking-tighter text-2xl">FLUX TALENT</Title>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h1 className="text-[4.5rem] font-black leading-[0.9] tracking-tighter text-on-surface">
              CURATE <br />
              YOUR <br />
              <span className="text-primary italic">PIPELINE.</span>
            </h1>
            <p className="text-lg text-on-surface-variant font-medium leading-relaxed opacity-60">
              Transform standard recruitment into an high-fidelity editorial experience. Experience the Digital Curator.
            </p>
          </div>
        </div>

        <div className="z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex gap-12">
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] opacity-30 uppercase mb-2">Automated</div>
              <div className="text-xl font-bold opacity-60">Waitlist Flow</div>
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] opacity-30 uppercase mb-2">Decay</div>
              <div className="text-xl font-bold opacity-60">Smart Purges</div>
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] opacity-30 uppercase mb-2">Audit</div>
              <div className="text-xl font-bold opacity-60">Full Lineage</div>
            </div>
          </div>
        </div>

        {/* Dynamic Background Flair */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Login Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-surface-container-lowest lg:p-24">
        <div className={`w-full max-w-sm transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary">all_inclusive</span>
            </div>
            <Title className="font-black tracking-tighter">FLUX TALENT</Title>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-display-sm font-black tracking-tight text-on-surface mb-2">
              {mode === 'login' ? 'Authentication' : 'Initiation'}
            </h2>
            <p className="text-on-surface-variant font-medium opacity-60 uppercase tracking-[0.1em] text-[10px]">
              {mode === 'login' ? 'Enter the workspace' : 'Create your company instance'}
            </p>
          </div>

          <TonalContainer className="p-8 lg:p-10 rounded-[2.5rem] bg-surface-container-low shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'register' && (
                <TextField
                  label="Company Name"
                  placeholder="The Curation Group"
                  icon="apartment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              
              <TextField
                label="Corporate Access"
                type="email"
                placeholder="curator@fluxtalent.com"
                icon="mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <TextField
                label="Secure Key"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon="lock"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                suffix={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />

              {error && (
                <div className="p-4 bg-error-container/10 border border-error/5 rounded-2xl animate-fade-in">
                  <p className="text-[11px] font-bold text-error uppercase tracking-widest text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full py-4 text-[13px] tracking-widest font-black uppercase"
                disabled={loading}
                loading={loading}
              >
                {mode === 'login' ? 'Sign In' : 'Register'}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-surface-container text-center">
              <button
                type="button"
                className="text-[11px] font-black uppercase tracking-[0.15em] text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? "Establish new account →" : "← Identification recognized"}
              </button>
            </div>
          </TonalContainer>

          <div className="mt-12 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              Executive Hiring Platform • v2.0 Flux
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
