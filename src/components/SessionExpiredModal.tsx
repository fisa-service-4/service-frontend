'use client';

import { useState, useEffect } from 'react';
import { tokenUtils } from '@/utils/token';

export default function SessionExpiredModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  if (!show) return null;

  const handleConfirm = () => {
    tokenUtils.clearTokens();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl px-6 py-6 mx-6 shadow-xl w-72">
        <p className="text-base font-semibold text-gray-900 mb-1 text-center">세션 만료</p>
        <p className="text-sm text-gray-500 text-center mb-5">로그아웃 되었습니다.</p>
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl"
        >
          확인
        </button>
      </div>
    </div>
  );
}
