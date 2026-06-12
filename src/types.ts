export interface AgentProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  commissionBalance: number;
  todayTransactionsCount: number;
  todayEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  role: 'agent' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

export type TransactionType = 'deposit' | 'withdraw' | 'recharge' | 'bill_pay';

export interface TransactionRecord {
  id: string;
  agentId: string;
  type: TransactionType;
  customerPhone: string;
  amount: number;
  commissionEarned: number;
  status: 'pending' | 'approved' | 'cancelled';
  details: string;
  createdAt: string;
  isAutomatic?: boolean;
  customerTxnId?: string;
  cancelReason?: string;
}

export interface AgentCashRequest {
  id: string;
  agentId: string;
  agentName: string;
  amountBdt: number;
  paymentMethod: 'bKash' | 'Nagad';
  transactionId: string;
  senderPhone?: string;
  autoApproveDelay?: number;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AgentWithdrawRequest {
  id: string;
  agentId: string;
  agentName: string;
  amountBdt: number;
  paymentMethod: 'bKash' | 'Nagad';
  paymentNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  withdrawSource?: 'commission' | 'wallet';
  createdAt: string;
}
