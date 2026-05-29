import { apiRequest } from '@/utils/apiClient';
import type {
  HomeSummary,
  DashboardData,
  VirtualSalarySetting,
  SaveVirtualSalarySettingRequest,
  AiRecommendation,
  Contract,
  CreateContractRequest,
  PaymentMatching,
  ManualMatchRequest,
  ManualMatchResponse,
  MatchingStatus,
} from '@/types/virtualSalary';

export const getHomeSummary = () =>
  apiRequest<HomeSummary>('/virtual-salary/summary');

export const getDashboard = () =>
  apiRequest<DashboardData>('/virtual-salary/dashboard');

export const getVirtualSalarySetting = () =>
  apiRequest<VirtualSalarySetting>('/virtual-salary');

export const saveVirtualSalarySetting = (body: SaveVirtualSalarySettingRequest) =>
  apiRequest<{ saved: boolean }>('/virtual-salary', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateVirtualSalarySetting = (body: Partial<SaveVirtualSalarySettingRequest>) =>
  apiRequest<{ saved: boolean }>('/virtual-salary', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const getAiRecommendation = () =>
  apiRequest<AiRecommendation>('/virtual-salary/recommendation');

export const getContracts = (params?: { date?: string }) => {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  const qs = query.toString();
  return apiRequest<Contract[]>(`/contracts${qs ? `?${qs}` : ''}`);
};

export const getContract = (contractId: number) =>
  apiRequest<Contract>(`/contracts/${contractId}`);

export const createContract = (body: CreateContractRequest) =>
  apiRequest<Contract>('/contracts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getPaymentMatchings = (params?: {
  contractId?: number;
  matchingStatus?: MatchingStatus;
  from?: string;
  to?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.contractId !== undefined) query.set('contractId', String(params.contractId));
  if (params?.matchingStatus) query.set('matchingStatus', params.matchingStatus);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qs = query.toString();
  return apiRequest<PaymentMatching[]>(`/payment-matchings${qs ? `?${qs}` : ''}`);
};

export const manualMatch = (matchingId: number, body: ManualMatchRequest) =>
  apiRequest<ManualMatchResponse>(`/payment-matchings/${matchingId}/manual`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
