'use client';

interface Props {
  userName: string;
}

export default function LoadingStep({ userName }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-bg items-center justify-center px-6 gap-0">
      {/* 로딩 스피너 */}
      <div className="relative w-28 h-28 mb-10">
        {/* 배경 링 */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        {/* 스피닝 링 */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        {/* 중앙 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl select-none">💳</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 text-center leading-snug mb-3">
        {userName ? `${userName}님의` : '내'}
        <br />자산을 연결할게요
      </h2>
      <p className="text-sm text-gray-400">최대 1분 걸릴 수 있어요</p>

      {/* 점 애니메이션 */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary-300 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
