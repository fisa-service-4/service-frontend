'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/api/user';
import { tokenUtils } from '@/utils/token';

export default function WithdrawPage() {
  const router = useRouter();
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent]           = useState<boolean | null>(null);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  function validate() {
    if (!password)                      return '비밀번호를 입력해주세요.';
    if (!confirmPassword)               return '비밀번호를 재입력해주세요.';
    if (password !== confirmPassword)   return '비밀번호가 일치하지 않습니다.';
    if (!consent)                       return '탈퇴 동의를 선택해주세요.';
    return '';
  }

  async function handleWithdraw() {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');

    setLoading(true);
    try {
      await userApi.deleteAccount();
      tokenUtils.clearTokens();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원탈퇴에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-8">회원탈퇴</h1>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <input
            type="password"
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
          />

          <div className="mt-2 mb-1">
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              회원탈퇴 시 기존 정보는 전부 삭제됩니다.
              <br />
              탈퇴 동의 여부
            </p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="withdraw-consent"
                  checked={consent === false}
                  onChange={() => setConsent(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">동의하지 않음</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="withdraw-consent"
                  checked={consent === true}
                  onChange={() => setConsent(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">동의</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        </div>
      </div>

      <div className="px-6 pb-4 flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={loading}
          className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-60"
        >
          {loading ? '처리 중...' : '완료'}
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}
