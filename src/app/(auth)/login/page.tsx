'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { authApi } from '@/api/auth';
import { tokenUtils } from '@/utils/token';
import { getMydataConnections } from '@/api/mydata';
import { getAccountsWithRoles } from '@/api/bank';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/home';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('이메일을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      tokenUtils.setTokens(res.accessToken, res.refreshToken);
      tokenUtils.setUserId(res.userId);
      tokenUtils.setUserEmail(email.trim());
      tokenUtils.setUserName(res.userName);
      if (res.firebaseUid) tokenUtils.setFirebaseUid(res.firebaseUid);

      if (res.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      // redirectTo가 명시된 경우 그대로 이동 (회원가입 완료 후 온보딩 등)
      if (redirectTo !== '/home') {
        router.push(redirectTo);
        return;
      }

      // 사용자 상태 체크 후 리다이렉트
      try {
        const connections = await getMydataConnections();
        const bankAccounts = connections?.bankAccounts ?? [];

        if (bankAccounts.length === 0) {
          router.push('/signup/onboarding');
          return;
        }

        const accounts = await getAccountsWithRoles();
        const roles = new Set(accounts.map((a) => a.accountRole).filter(Boolean) as string[]);

        const REQUIRED: Array<{ role: string; step: string }> = [
          { role: 'DEPOSIT',   step: 'deposit'   },
          { role: 'SALARY',    step: 'salary'    },
          { role: 'EMERGENCY', step: 'emergency' },
        ];
        const missing = REQUIRED.find((r) => !roles.has(r.role));
        if (missing) {
          router.push(`/signup/onboarding?step=${missing.step}`);
          return;
        }
      } catch {
        // 상태 체크 실패 시 홈으로 이동
      }

      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* 브랜드 로고 */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp className="text-white" size={20} />
          </div>
          <span className="text-gray-900 text-xl font-bold">flon</span>
        </div>

        {/* 폼 카드 */}
        <div className="bg-bg-card shadow-md rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">로그인</h1>
          <p className="text-sm text-gray-400 mb-7">계정에 로그인하세요</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold disabled:opacity-60 transition-opacity"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* 부가 링크 */}
        <div className="flex justify-between px-1 mt-5">
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
