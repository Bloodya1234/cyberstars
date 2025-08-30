// src/app/admin-login/page.js
'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    // Ничего не делаем на сервере — страница клиентская.
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = '/admin';
    } catch (e) {
      setErr(e?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <input
          className="w-full border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e)=>setPass(e.target.value)}
          required
        />
        {err && <div className="text-red-500 text-sm">{err}</div>}
        <button className="w-full bg-blue-600 text-white p-2 rounded" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
