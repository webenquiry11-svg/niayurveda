'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

function SetupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If the URL is missing the secure tokens, block the user
  if (!email || !token) {
    return <div className="text-center text-red-500 mt-10 font-bold">Invalid setup link. Missing email or token.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Setting up account...');

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account setup complete! You can now log in.', { id: loadingToast });
        router.push('/Admin'); // Redirect to login page
      } else {
        toast.error(data.message || 'Failed to setup account.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 text-center">Admin Setup</h1>
        <p className="text-sm text-slate-500 text-center mt-2">Set your username and password for <br/><span className="font-bold text-blue-600">{email}</span></p>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Create Username</label>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. admin_user" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Create Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : 'Complete Setup'}
      </button>
    </form>
  );
}

export default function AdminSetup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
      <Suspense fallback={<div className="text-slate-500 font-bold">Loading setup...</div>}>
        <SetupForm />
      </Suspense>
    </div>
  );
}
