'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const setIsAuthenticated = useAppStore((s) => s.setIsAuthenticated);

  // On mount, call /api/auth/setup to ensure admin user exists
  useEffect(() => {
    const ensureSetup = async () => {
      setSetupStatus('loading');
      try {
        const res = await fetch('/api/auth/setup', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          // Admin was just created
        }
        // If not success (user already exists), that's fine too
      } catch {
        // Silently ignore setup errors
      } finally {
        setSetupStatus('done');
      }
    };
    ensureSetup();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!username.trim() || !password.trim()) {
        setError('Username dan password wajib diisi');
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        const data = await res.json();

        if (data.success && data.data) {
          setIsAuthenticated(true, {
            id: data.data.id,
            username: data.data.username,
            nama: data.data.nama,
            role: data.data.role,
            pegawaiId: data.data.pegawaiId,
          });
        } else {
          setError(data.message || 'Login gagal. Periksa username dan password Anda.');
        }
      } catch {
        setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, setIsAuthenticated]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-slate-200/40 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-lg border-slate-200/80">
        {/* Government-style header band */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-t-xl px-6 py-5 -mt-0 -mx-0">
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-center">
              Sistem Tanda Tangan Elektronik (TTE)
            </h1>
            <p className="text-emerald-100 text-sm">
              Masuk ke Panel Admin
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {setupStatus === 'loading' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mempersiapkan sistem...</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button
              type="submit"
              className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={isLoading || setupStatus === 'loading'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Default: admin / admin123
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
