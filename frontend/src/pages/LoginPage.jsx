import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Wallet className="text-primary-foreground" size={24} />
          </div>
          <h1 className="text-2xl font-bold">ExTrack</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lacak pengeluaranmu dengan mudah
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
