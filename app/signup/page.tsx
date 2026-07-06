'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signup } from '../login/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';

function SignupFormContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(errorParam);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await signup(null, formData);
      if (res) {
        if (res.success) {
          setMessage(res.message || 'Registration successful! Check your email.');
          // Reset form fields
          setFullName('');
          setEmail('');
          setPassword('');
        } else {
          setError(res.error || 'Failed to create account');
        }
      }
    });
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    setIsGooglePending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGooglePending(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during Google signup.');
      setIsGooglePending(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-border-custom bg-surface/50 backdrop-blur-xl shadow-2xl shadow-accent/5 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white mb-4 shadow-lg shadow-accent/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
        <p className="text-xs text-muted-custom mt-2">
          Get started with Silex by setting up your own workspace.
        </p>
      </div>

      {/* Message and Error alerts */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-success-custom/10 border border-success-custom/20 text-xs font-semibold text-success-custom flex items-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-muted-custom mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={isPending || isGooglePending}
            className="w-full rounded-xl border border-border-custom bg-background/50 px-4 py-3 text-xs text-foreground placeholder-muted-custom transition-all focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-custom mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            disabled={isPending || isGooglePending}
            className="w-full rounded-xl border border-border-custom bg-background/50 px-4 py-3 text-xs text-foreground placeholder-muted-custom transition-all focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-custom mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isPending || isGooglePending}
            className="w-full rounded-xl border border-border-custom bg-background/50 px-4 py-3 text-xs text-foreground placeholder-muted-custom transition-all focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isGooglePending}
          className="w-full py-3 px-4 rounded-xl bg-accent text-xs font-bold text-white shadow-lg shadow-accent/10 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 z-10">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-custom" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#121214] px-2 text-muted-custom font-semibold">Or continue with</span>
        </div>
      </div>

      {/* Google Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isPending || isGooglePending}
        className="w-full py-3 px-4 rounded-xl border border-border-custom bg-surface/30 backdrop-blur-md text-xs font-bold text-foreground hover:bg-surface/50 hover:border-accent/30 active:scale-[0.98] hover:scale-[1.01] focus:ring-1 focus:ring-accent focus:outline-none transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative z-10 cursor-pointer"
        type="button"
      >
        {isGooglePending ? (
          <svg className="animate-spin h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Footer */}
      <div className="text-center mt-8 relative z-10 border-t border-border-custom pt-6">
        <p className="text-xs text-muted-custom">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-accent hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Decorative colored blobs */}
      <div className="absolute top-[20%] left-[10%] w-[35rem] h-[35rem] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-2xl border border-border-custom bg-surface/50 backdrop-blur-xl shadow-2xl h-[400px] flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      }>
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
