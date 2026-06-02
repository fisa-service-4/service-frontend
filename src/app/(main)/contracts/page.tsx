import { Suspense } from 'react';
import ContractListView from '@/components/home/ContractListView';

export default function ContractsPage() {
  return (
    <Suspense>
      <ContractListView />
    </Suspense>
  );
}
