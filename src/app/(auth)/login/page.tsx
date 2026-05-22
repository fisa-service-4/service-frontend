'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { tokenUtils } from '@/utils/token';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('아이디를 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      tokenUtils.setTokens(res.accessToken, res.refreshToken);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-center px-6 gap-3">
        <input
          type="email"
          placeholder="아이디"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
        />

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}

        <div className="flex justify-between mt-1 px-1">
          <button type="button" className="text-xs text-gray-500 underline">
            아이디 / 비밀번호찾기
          </button>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="text-xs text-gray-500 underline"
          >
            회원가입
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="h-12 bg-[#131329]" />
    </div>
  );
}
