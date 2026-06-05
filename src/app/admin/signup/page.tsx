'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';

export default function AdminSignupPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function validate() {
    if (!userName.trim()) return '이름을 입력해주세요.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    return '';
  }

  async function handleSubmit() {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.adminSignup({ email: email.trim(), password, userName: userName.trim() });
      router.push('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '관리자 계정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">관리자 계정 생성</h1>

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              placeholder="8자 이상 입력하세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        </div>
      </div>

      <div className="px-6 pb-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-50"
        >
          {loading ? '생성 중...' : '관리자 계정 생성'}
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}
