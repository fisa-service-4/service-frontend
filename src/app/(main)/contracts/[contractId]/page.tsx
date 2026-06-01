import ContractDetailView from '@/components/home/ContractDetailView';

// Next.js 15+ 에서 동적 라우트 params는 Promise
export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  return <ContractDetailView contractId={Number(contractId)} />;
}
