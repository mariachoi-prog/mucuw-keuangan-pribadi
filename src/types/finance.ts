export type NavTab = 'home' | 'transactions' | 'report';

export type WalletTheme =
  | 'mandiri'
  | 'blubca'
  | 'seabank'
  | 'gopay'
  | 'lavender'
  | 'pink'
  | 'mint'
  | 'gold';

export interface Wallet {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  balance: number;
  theme: WalletTheme;
  type: 'regular' | 'investment';
  order: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionScope = 'personal' | 'business';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  bgColor: string;
  type: 'expense' | 'income' | 'both';
  isBusiness?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  scope: TransactionScope;
  businessKind?: 'revenue' | 'cogs';
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  walletId: string;
  toWalletId?: string;
  categoryId: string;
  notes?: string;
  posItemsSummary?: string;
}

export interface PosProduct {
  id: string;
  name: string;
  emoji: string;
  price: number;
  cogs: number;
  categoryLabel: string;
}

export interface PosOrder {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  walletId: string;
  items: { productId: string; name: string; qty: number; price: number; cogs: number }[];
  subtotal: number;
  discount: number;
  total: number;
  estimatedProfit: number;
}

export interface BudgetDream {
  id: string;
  kind: 'budget' | 'dream';
  title: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  categoryId?: string;
  color: string;
}

export interface InvestmentHolding {
  id: string;
  name: string;
  platform: string;
  emoji: string;
  category: 'Reksa Dana' | 'Saham / ETF' | 'Emas Digital' | 'Deposito';
  investedAmount: number;
  currentValue: number;
}

export type WidgetGradientKey = 'classic' | 'ocean' | 'sunset' | 'forest' | 'midnight' | 'berry';

export interface WidgetConfig {
  mode: 'expense' | 'budget';
  backgroundType: 'gradient' | 'preset_photo' | 'custom_photo';
  gradient: WidgetGradientKey;
  customPhotoDataUrl: string | null;
  period: 'today' | 'week' | 'month';
  categoryId: string; // 'all' or specific id
  walletId: string; // 'all' or specific id
  budgetLimit: number;
}

export type AppTheme = 'light' | 'glossy' | 'pastel';
export type AppLanguage = 'id' | 'en';

export interface AppSettings {
  profileName: string;
  theme: AppTheme;
  language: AppLanguage;
  soundEnabled: boolean;
}

export interface AppState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  posProducts: PosProduct[];
  posOrders: PosOrder[];
  budgetsAndDreams: BudgetDream[];
  investments: InvestmentHolding[];
  widgetConfig: WidgetConfig;
  settings: AppSettings;
}
