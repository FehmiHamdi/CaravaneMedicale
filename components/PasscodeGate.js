'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PasscodeGate({ storageKey, expectedCode, title, children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(storageKey) === '1') setUnlocked(true);
  }, [storageKey]);

  function tryUnlock(e) {
    e.preventDefault();
    if (input === expectedCode) {
      sessionStorage.setItem(storageKey, '1');
      setUnlocked(true);
    } else {
      setError('رمز الدخول غير صحيح');
    }
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={tryUnlock} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold mb-4 text-red-700">{title}</h1>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input mb-3"
            placeholder="رمز الدخول"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button className="w-full bg-red-600 text-white font-bold py-2 rounded-xl">دخول</button>
          <Link href="/" className="block mt-4 text-sm text-gray-400">
            → الرئيسية
          </Link>
        </form>
      </main>
    );
  }

  return children;
}
