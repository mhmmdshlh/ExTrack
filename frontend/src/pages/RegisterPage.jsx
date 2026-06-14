import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { Wallet } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setPasswordError('');

    if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return;
    }

    if (password !== confirm) {
      setLocalError('Password tidak cocok');
      return;
    }

    const success = await register(email, password);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Wallet className="text-primary-foreground" size={24} />
          </div>
          <h1 className="text-2xl font-bold">Buat Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar untuk mulai mencatat
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="Min. 6 karakter"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Konfirmasi Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="Ulangi password"
              required
            />
          </div>

          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          {(localError || error) && (
            <p className="text-sm text-destructive">{localError || error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
