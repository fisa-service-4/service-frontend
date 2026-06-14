'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { authApi } from '@/api/auth';
import { tokenUtils } from '@/utils/token';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('아이디를 입력해주세요.');
    if (!password)     return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      tokenUtils.setTokens(res.accessToken, res.refreshToken);
      tokenUtils.setUserId(res.userId);
      tokenUtils.setUserEmail(email.trim());
      tokenUtils.setUserName(res.userName);
      if (res.firebaseUid) tokenUtils.setFirebaseUid(res.firebaseUid);
      router.push(res.role === 'ADMIN' ? '/admin' : '/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 상단 다크바 */}
      <div className="h-14 bg-[#131329] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={16} />
          </div>
          <span className="text-white text-base font-bold tracking-wide">FISA</span>
        </div>
      </div>

      {/* 폼 영역 */}
      <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-center px-6 gap-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="text-sm text-gray-400 mt-1">계정에 로그인하세요</p>
        </div>

        {/* 이메일 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium">이메일</label>
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* 비밀번호 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium">비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-14 bg-[#131329] text-white rounded-xl text-base font-semibold disabled:opacity-60 transition-opacity"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {/* 부가 링크 */}
        <div className="flex justify-between px-1">
          <button type="button" className="text-xs text-gray-400 underline underline-offset-2">
            아이디 / 비밀번호 찾기
          </button>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="text-xs text-primary-500 font-semibold"
          >
            회원가입 →
          </button>
        </div>
      </form>

      {/* 하단 다크바 */}
      <div className="h-10 bg-[#131329]" />
    </div>
  );
}
