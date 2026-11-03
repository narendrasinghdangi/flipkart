import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function Login() {
  const { user, login, register } = useAuth();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const next = sp.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  const dest = safeNext ?? (user?.role === 'admin' ? '/admin' : '/');
  if (user) return <Navigate to={dest} replace />;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (mode === 'register' && d.password.length < 8) return setErr('Password must be at least 8 characters');
    setBusy(true); setErr('');
    try { mode === 'login' ? await login(d.email, d.password) : await register(d.name, d.email, d.password); nav(safeNext ?? '/', { replace: true }); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="co-sec" style={{ maxWidth: 420, margin: '24px auto' }}>
      <div className="co-head on"><b>{mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}</b></div>
      <form className="co-body form" onSubmit={submit}>
        {mode === 'register' && <label>Full name<input name="name" autoComplete="name" required minLength={2} /></label>}
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn buy lg" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'login' ? 'LOGIN' : 'SIGN UP'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>{mode === 'login' ? 'New to StyleWagon? Create an account' : 'Existing user? Log in'}</button>
        <p className="muted small">Your name, email and delivery details are used only to fulfil your orders.</p>
      </form>
    </div>
  );
}
