import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/api';
import { firstName } from '../lib/format';
import AuthLayout from './AuthLayout';

export default function Register() {
  const { user, register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!email.toLowerCase().endsWith('@wmsu.edu.ph')) {
      setError('Please use your @wmsu.edu.ph email address.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Your passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const created = await register(fullName.trim(), email.trim(), password);
      notify(`You're in, ${firstName(created.full_name)}. Welcome to intramurals.`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-heading">
        <p className="eyebrow">Join the season</p>
        <h2>Create your account.</h2>
        <p>One account to register teams and keep up with every fixture.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Full name</span>
          <span className="input-with-icon">
            <UserRound size={17} />
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              autoFocus
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field__label">School email</span>
          <span className="input-with-icon">
            <Mail size={17} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@wmsu.edu.ph"
              autoComplete="email"
              required
            />
          </span>
          <span className="field__hint">Must end in @wmsu.edu.ph.</span>
        </label>

        <div className="form-grid">
          <label className="field">
            <span className="field__label">Password</span>
            <span className="input-with-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8+ characters"
                autoComplete="new-password"
                minLength={8}
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

          <label className="field">
            <span className="field__label">Confirm password</span>
            <span className="input-with-icon">
              <Lock size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn--primary btn--block auth-submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
          {!busy && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>

      <div className="auth-hint">
        <span>Captains register teams after signing in.</span>
        <span>Admins are seeded by the intramurals office.</span>
      </div>
    </AuthLayout>
  );
}
