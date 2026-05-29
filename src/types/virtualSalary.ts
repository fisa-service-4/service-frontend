export type ContractStatus = 'PENDING' | 'PAID' | 'DELAYED' | 'CANCELLED';
export type MatchingStatus = 'TBC' | 'MATCHED' | 'MANUAL_MATCHED' | 'FAILED';
export type TaxType = 'BUSINESS' | 'ETC' | 'ARTIST';
export type PriorityItem = 'SALARY' | 'EMERGENCY' | 'INVESTMENT';

export interface ContractSettlement {
  deductedAmount: number;
  actualIncome: number;
}

export interface Contract {
  contractId: number;
  clientName: string;
  contractAmount: number;
  taxType: TaxType;
  expectedPaymentDate: string;
  contractStatus: ContractStatus;
  settlement: ContractSettlement;
  createdAt: string;
}

export interface PaymentMatching {
  matchingId: number;
  contractId: number;
  bankTransactionId: number | null;
  matchingStatus: MatchingStatus;
  matchedBy: 'SYSTEM' | 'USER';
  matchedAt: string | null;
}

export interface VirtualSalarySetting {
  targetSalary: number;
  payday: number;
  emergencyTargetAmount: number | null;
  emergencyRatio: number | null;
  investmentRatio: number | null;
  priorityOrder: PriorityItem[];
  updatedAt: string;
}

export interface DashboardData {
  targetSalary: number;
  currentBalance: number;
  progressRate: number;
  dday: number;
}

export interface CalendarEntry {
  date: string;
  amount: number;
}

export interface HomeSummary {
  dashboard: DashboardData;
  monthlyExpectedIncome: number;
  contracts: Contract[];
  calendarData: CalendarEntry[];
}

export interface AiRecommendation {
  recommendedEmergencyRatio: number;
  recommendedInvestmentRatio: number;
  summary: string;
}

export interface CreateContractRequest {
  clientName: string;
  contractAmount: number;
  taxType: TaxType;
  expectedPaymentDate: string;
}

export interface SaveVirtualSalarySettingRequest {
  targetSalary: number;
  payday: number;
  emergencyTargetAmount?: number;
  emergencyRatio?: number;
  investmentRatio?: number;
  priorityOrder?: PriorityItem[];
}

export interface ManualMatchRequest {
  bankTransactionId: number;
  matchedBy: 'USER';
}

export interface ManualMatchResponse {
  matchingId: number;
  matchingStatus: MatchingStatus;
  matchedBy: string;
  matchedAt: string;
}
