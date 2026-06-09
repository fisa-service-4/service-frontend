import type { ReactNode } from 'react';

export interface StatCard {
  title: string;
  value: string;
  icon: ReactNode;
  gradient: string;
}

export interface ErrorLog {
  id: number;
  message: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
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
