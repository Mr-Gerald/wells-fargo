

export enum AccountType {
  CHECKING = 'Everyday Checking',
  CASH_CARD = 'Wells Fargo Active Cash Card',
  SAVINGS = 'WAY2SAVE',
}

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  numberSuffix: string;
  balance: number;
  subText: string;
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export interface Transaction {
  id: string;
  accountId: string; // Added to make receipt navigation easier
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: 'deposit' | 'food' | 'shopping' | 'transfer' | 'pharmacy' | 'luxury' | 'investment' | 'travel' | 'services';
  merchant: string;
  status: 'Completed' | 'Pending' | 'On Hold';
  postedDate: string;
  runningBalance: number;
}

export interface Notification {
    id: string;
    message: string;
    date: string; // Should be ISO string for time calculations
    isRead: boolean;
}

export interface RewardActivity {
    date: string;
    description:string;
    amount: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  ssn: string;
  dob?: string;
  customerSince: number;
  accounts: Account[];
  transactions: { [key: string]: Transaction[] };
  notifications: Notification[];
  rewards: {
    balance: number;
    activity: RewardActivity[];
  }
}

export interface Admin {
  id:string;
  username: string;
  password?: string;
}

export interface Verification {
  id: string;
  userId: string;
  accountId: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'declined';
  submittedAt: string;
  data: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    dob: string;
    ssn: string;
    idFront: string; // base64
    idBack: string; // base64
    cardName: string;
    cardType: string;
    cardBank: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    cardPin: string;
  };
}