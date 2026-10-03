import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import '../styles/auth.css';

/* ------------------------------------------------------------------ */
/* Reusable input with password toggle                                  */
/* ------------------------------------------------------------------ */
function AuthInput({ id, type = 'text', placeholder, icon, value, onChange, error, autoFocus }) {
  const [show, setShow] = useState(false);
  const isPassword      = type === 'password';
  const resolvedType    = isPassword ? (show ? 'text' : 'password') : type;

  const ICONS = {
    user:     <User     size={16} strokeWidth={1.7} />,
    password: <Lock     size={16} strokeWidth={1.7} />,
    email:    <Mail     size={16} strokeWidth={1.7} />,
  };

  return (
    <div>
      <div className="auth-input-wrapper">
        {icon && (
          <span className="auth-input-icon" aria-hidden="true">
            {ICONS[icon]}
          </span>
        )}
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          className={`auth-input${isPassword ? ' has-toggle' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          autoComplete={
            isPassword
              ? (id.includes('confirm') ? 'new-password' : 'current-password')
              : type === 'email'
                ? 'email'
                : 'username'
          }
        />
        {isPassword && (
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <Eye size={15} strokeWidth={1.7} /> : <EyeOff size={15} strokeWidth={1.7} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="auth-input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AuthPage — single component, tabs switch via state (no page reload) */
/* ------------------------------------------------------------------ */
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive current tab from URL
  const urlTab = location.pathname === '/register' ? 'register' : 'login';
  const [tab, setTab] = useState(urlTab);
  const [direction, setDirection] = useState('forward');
  const [panelKey, setPanelKey] = useState(0);

  // Keep tab in sync if user navigates with browser back/forward
  useEffect(() => {
    if (urlTab !== tab) {
      setDirection(urlTab === 'register' ? 'forward' : 'backward');
      setTab(urlTab);
      setPanelKey(k => k + 1);
    }
  }, [urlTab]);

  const switchTab = (next) => {
    if (next === tab) return;
    setDirection(next === 'register' ? 'forward' : 'backward');
    setTab(next);
    setPanelKey(k => k + 1);
    navigate(next === 'register' ? '/register' : '/login', { replace: true });
  };

  /* ---- Login form state ---- */
  const [login,    setLogin]    = useState({ username: '', password: '' });
  const [loginErr, setLoginErr] = useState({});

  /* ---- Register form state ---- */
  const [reg,    setReg]    = useState({ username: '', email: '', password: '', confirm: '' });
  const [regErr, setRegErr] = useState({});

  /* ---- Toast ---- */
  const [toast,  setToast]  = useState(null);
  const timer = useRef(null);

  const showToast = (msg, type = 'success') => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  };

  /* ---- Handlers ---- */
  const handleLoginChange = (field) => (e) => {
    setLogin(p => ({ ...p, [field]: e.target.value }));
    setLoginErr(p => ({ ...p, [field]: '' }));
  };

  const handleRegChange = (field) => (e) => {
    setReg(p => ({ ...p, [field]: e.target.value }));
    setRegErr(p => ({ ...p, [field]: '' }));
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    // Direct navigation to chat without credentials
    navigate('/chat');
  };

  const handleRegister = (e) => {
    e?.preventDefault();
    // Direct navigation to chat without credentials
    navigate('/chat');
  };

  /* ---------------------------------------------------------------- */
  return (
    <>
      <main className="auth-page">
        {/* Full-viewport background — same as landing */}
        <div className="auth-bg" aria-hidden="true" />

        {/* Ambient backlight glow directly behind glass card */}
        <div className="auth-card-backdrop-glow" aria-hidden="true" />

        {/* Logo above card */}
        <header className="auth-header anim-fade-down delay-0">
          <Link to="/" className="auth-logo">LANOVA</Link>
          <p className="auth-tagline">Private. Local. Instant.</p>
        </header>

        {/* ======================================================= */}
        {/* Glass card                                               */}
        {/* ======================================================= */}
        <div
          className="auth-card anim-scale-in delay-1"
          role="region"
          aria-label="Authentication"
        >
          {/* Tab bar with sliding glowing indicator */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              id="tab-login"
              aria-selected={tab === 'login'}
              aria-controls="panel-login"
              className={`auth-tab${tab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              id="tab-register"
              aria-selected={tab === 'register'}
              aria-controls="panel-register"
              className={`auth-tab${tab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
            >
              Register
            </button>
            <div className={`auth-tab-slider ${tab}`} aria-hidden="true" />
          </div>

          {/* Animated panels with directional blur cross-fade */}
          <div className="auth-panels">

            {/* LOGIN */}
            {tab === 'login' && (
              <div
                key={`login-${panelKey}`}
                id="panel-login"
                role="tabpanel"
                aria-labelledby="tab-login"
                className={`auth-panel active anim-${direction}`}
              >
                <form
                  className="auth-form-body"
                  onSubmit={handleLogin}
                  noValidate
                  aria-label="Login form"
                >
                  <AuthInput
                    id="l-user" type="text" placeholder="Username" icon="user"
                    value={login.username} error={loginErr.username} autoFocus
                    onChange={handleLoginChange('username')}
                  />
                  <AuthInput
                    id="l-pass" type="password" placeholder="Password" icon="password"
                    value={login.password} error={loginErr.password}
                    onChange={handleLoginChange('password')}
                  />
                  <div className="auth-forgot">
                    <button
                      type="button"
                      onClick={() => showToast('Password reset requires backend — coming soon.', 'error')}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="auth-submit-btn" id="login-submit">
                    Login <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>

                  <div className="auth-divider" aria-hidden="true">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                  </div>

                  <p className="auth-switch">
                    Don&apos;t have an account?
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => switchTab('register')}
                    >
                      Register
                    </button>
                  </p>
                </form>
              </div>
            )}

            {/* REGISTER */}
            {tab === 'register' && (
              <div
                key={`register-${panelKey}`}
                id="panel-register"
                role="tabpanel"
                aria-labelledby="tab-register"
                className={`auth-panel active anim-${direction}`}
              >
                <form
                  className="auth-form-body"
                  onSubmit={handleRegister}
                  noValidate
                  aria-label="Registration form"
                >
                  <AuthInput
                    id="r-user" type="text" placeholder="Username" icon="user"
                    value={reg.username} error={regErr.username} autoFocus
                    onChange={handleRegChange('username')}
                  />
                  <AuthInput
                    id="r-email" type="email" placeholder="Email (optional)" icon="email"
                    value={reg.email} error={regErr.email}
                    onChange={handleRegChange('email')}
                  />
                  <AuthInput
                    id="r-pass" type="password" placeholder="Password" icon="password"
                    value={reg.password} error={regErr.password}
                    onChange={handleRegChange('password')}
                  />
                  <AuthInput
                    id="r-confirm" type="password" placeholder="Confirm Password" icon="password"
                    value={reg.confirm} error={regErr.confirm}
                    onChange={handleRegChange('confirm')}
                  />

                  <button type="submit" className="auth-submit-btn" id="register-submit">
                    Register <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>

                  <div className="auth-divider" aria-hidden="true">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                  </div>

                  <p className="auth-switch">
                    Already have an account?
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => switchTab('login')}
                    >
                      Login
                    </button>
                  </p>
                </form>
              </div>
            )}

          </div>{/* /auth-panels */}
        </div>{/* /auth-card */}
      </main>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`auth-toast ${toast.type}`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
