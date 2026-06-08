import SessionExpiredModal from '@/components/SessionExpiredModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-[393px] min-h-screen bg-white relative overflow-hidden shadow-xl">
        {children}
        <SessionExpiredModal />
      </div>
    </div>
  );
}
