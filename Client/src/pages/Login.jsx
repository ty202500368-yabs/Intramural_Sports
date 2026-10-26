import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/api';
import { firstName } from '../lib/format';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter the email address linked to your account.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setBusy(true);
    try {
      const signedIn = await login(email.trim(), password);
      notify(`Welcome back, ${firstName(signedIn.full_name)}.`);
      const from = location.state?.from;
      navigate(from || (signedIn.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-heading">
        <p className="eyebrow">Student &amp; admin access</p>
        <h2>Welcome back.</h2>
        <p>Sign in to follow your teams and the season.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Email address</span>
          <span className="input-with-icon">
            <Mail size={17} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@wmsu.edu.ph"
              autoComplete="email"
              required
              autoFocus
            />
          </span>
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <span className="input-with-icon">
            <Lock size={17} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="input-with-icon__button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        <button type="submit" className="btn btn--primary btn--block auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="auth-switch">
        New to the season? <Link to="/register">Create an account</Link>
      </p>

      <div className="auth-hint">
        <span>Use the email address you registered with.</span>
        <span>Students must use an @wmsu.edu.ph email.</span>
      </div>
    </AuthLayout>
  );
}
