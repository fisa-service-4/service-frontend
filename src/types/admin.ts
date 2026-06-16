import type { ReactNode } from 'react';

export interface StatCard {
  title: string;
  value: string;
  icon: ReactNode;
  gradient: string;
}

export interface ErrorLog {
  id: number;
  errorLevel: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  errorMessage: string;
  createdAt: string;
}

export interface ApiStatus {
  id: number;
  endpoint: string;
  status: 'online' | 'offline';
  error?: string;
}

export interface ServiceHealth {
  serviceName: string;
  status: 'UP' | 'DOWN';
  error?: string;
}

export interface AdminActivity {
  id: number;
  admin: string;
  action: string;
  time: string;
}

export type NavItem = 'dashboard' | 'users' | 'logs' | 'settings';
