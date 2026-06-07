'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { adminTokenUtils } from '@/utils/token';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      if (res.role !== 'ADMIN') {
        setError('관리자 계정이 아닙니다.');
        return;
      }
      adminTokenUtils.setTokens(res.accessToken, res.refreshToken);
      adminTokenUtils.setUserId(res.userId);
      adminTokenUtils.setUserEmail(email.trim());
      adminTokenUtils.setUserName(res.userName);
      router.replace('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
        <p className="text-sm text-gray-500 mb-8">관리자 계정으로 로그인해주세요.</p>

        <div className="flex flex-col gap-5">
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
              placeholder="비밀번호를 입력하세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}
