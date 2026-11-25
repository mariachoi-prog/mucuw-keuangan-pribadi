import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyAppState, INITIAL_CATEGORIES } from '../data/initialData';
import {
  AppSettings,
  AppState,
  BudgetDream,
  Category,
  InvestmentHolding,
  PosOrder,
  PosProduct,
  Transaction,
  Wallet,
  WidgetConfig,
} from '../types/finance';
import { getTodayYMD, playCuteSound } from '../utils/formatters';

export interface ActiveUser {
  email: string;
  displayName: string;
}

export interface SavedAccountSummary {
  name: string;
  email: string;
}

interface LocalAccountRecord {
  name: string;
  email: string;
  passcode: string;
}

const ACCOUNTS_KEY = 'mucuw_accounts_registry_v1';
const ACTIVE_SESSION_KEY = 'mucuw_active_session_v1';
const LOCAL_DATA_PREFIX = 'mucuw_user_data_';

function encodePasscode(raw: string): string {
  try {
    return btoa(unescape(encodeURIComponent(`mucuw:${raw}`)));
  } catch {
    return raw;
  }
}

export function getLocalDataKey(email: string): string {
  return `${LOCAL_DATA_PREFIX}${email.trim().toLowerCase()}`;
}

function loadAccountsRegistry(): Record<string, LocalAccountRecord> {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalAccountRecord>) : {};
  } catch {
    return {};
  }
}

function saveAccountsRegistry(reg: Record<string, LocalAccountRecord>) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(reg));
}

function listSavedAccounts(): SavedAccountSummary[] {
  const reg = loadAccountsRegistry();
  return Object.values(reg).map((acct) => ({ name: acct.name, email: acct.email }));
}

function clampStr(val: string | undefined, maxLen: number): string {
  return (val || '').slice(0, maxLen);
}

function normalizeAppState(parsed: Partial<AppState> | null | undefined, fallbackName: string): AppState {
  const empty = createEmptyAppState(fallbackName);
  if (!parsed || typeof parsed !== 'object') return empty;

  const rawSettings = (parsed.settings || {}) as Partial<AppSettings>;
  const rawWidget = (parsed.widgetConfig || {}) as Partial<WidgetConfig>;

  return {
    wallets: Array.isArray(parsed.wallets)
      ? parsed.wallets.map((w, idx) => ({
          ...w,
          name: clampStr(w.name, 60) || 'Dompet',
          subtitle: clampStr(w.subtitle, 100),
          emoji: clampStr(w.emoji, 16) || '👛',
          balance: Number(w.balance) || 0,
          order: typeof w.order === 'number' ? w.order : idx,
          type: w.type === 'investment' ? 'investment' : 'regular',
        }))
      : [],
    categories:
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : INITIAL_CATEGORIES,
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
        }))
      : [],
    posProducts: Array.isArray(parsed.posProducts) ? parsed.posProducts : [],
    posOrders: Array.isArray(parsed.posOrders) ? parsed.posOrders : [],
    budgetsAndDreams: Array.isArray(parsed.budgetsAndDreams) ? parsed.budgetsAndDreams : [],
    investments: Array.isArray(parsed.investments) ? parsed.investments : [],
    widgetConfig: { ...empty.widgetConfig, ...rawWidget },
    settings: {
      profileName: clampStr(rawSettings.profileName, 60) || fallbackName,
      theme: rawSettings.theme === 'light' || rawSettings.theme === 'pastel' ? rawSettings.theme : 'glossy',
      language: rawSettings.language === 'en' ? 'en' : 'id',
      soundEnabled: typeof rawSettings.soundEnabled === 'boolean' ? rawSettings.soundEnabled : true,
    },
  };
}

function loadLocalUserState(email: string, fallbackName: string): AppState {
  try {
    const raw = window.localStorage.getItem(getLocalDataKey(email));
    if (!raw) return createEmptyAppState(fallbackName);
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return normalizeAppState(parsed, fallbackName);
  } catch {
    return createEmptyAppState(fallbackName);
  }
}

function saveLocalUserState(email: string, data: AppState) {
  try {
    window.localStorage.setItem(getLocalDataKey(email), JSON.stringify(data));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function applyTxToWallets(wallets: Wallet[], tx: Transaction, direction: 1 | -1): Wallet[] {
  return wallets.map((w) => {
    if (tx.type === 'expense' && w.id === tx.walletId) {
      return { ...w, balance: w.balance - tx.amount * direction };
    }
    if (tx.type === 'income' && w.id === tx.walletId) {
      return { ...w, balance: w.balance + tx.amount * direction };
    }
    if (tx.type === 'transfer') {
      if (w.id === tx.walletId) {
        return { ...w, balance: w.balance - tx.amount * direction };
      }
      if (tx.toWalletId && w.id === tx.toWalletId) {
        return { ...w, balance: w.balance + tx.amount * direction };
      }
    }
    return w;
  });
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  const additions = incoming.filter((item) => item && item.id && !seen.has(item.id));
  return [...existing, ...additions];
}

export function useFinanceStore() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountSummary[]>([]);
  const [state, setState] = useState<AppState>(() => createEmptyAppState('Teman Mucuw'));

  const stateRef = useRef(state);
  stateRef.current = state;
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Restore active LocalStorage session on boot
  useEffect(() => {
    setSavedAccounts(listSavedAccounts());
    try {
      const rawSession = window.localStorage.getItem(ACTIVE_SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as { email?: string };
        const email = parsed.email?.trim().toLowerCase();
        if (email) {
          const reg = loadAccountsRegistry();
          const acct = reg[email];
          if (acct) {
            const loaded = loadLocalUserState(acct.email, acct.name);
            setCurrentUser({ email: acct.email, displayName: acct.name });
            setState(loaded);
            setAuthReady(true);
            return;
          }
        }
      }
    } catch {
      // Ignore malformed session
    }
    setCurrentUser(null);
    setState(createEmptyAppState('Teman Mucuw'));
    setAuthReady(true);
  }, []);

  // Auto-save safety net whenever state or active user changes
  useEffect(() => {
    if (currentUser) {
      saveLocalUserState(currentUser.email, state);
    }
  }, [currentUser, state]);

  // Helper that updates state AND persists synchronously to LocalStorage
  const commitState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      if (userRef.current) {
        saveLocalUserState(userRef.current.email, next);
      }
      return next;
    });
  }, []);

  const sound = useCallback((kind: 'tap' | 'success' | 'cash' = 'tap') => {
    playCuteSound(stateRef.current.settings.soundEnabled, kind);
  }, []);

  // Local Account Auth Actions
  const loginLocal = useCallback((emailInput: string, passwordInput: string) => {
    setAuthError(null);
    const email = emailInput.trim().toLowerCase();
    const reg = loadAccountsRegistry();
    const acct = reg[email];
    if (!acct) {
      setAuthError('Akun dengan email ini belum terdaftar. Silakan daftar terlebih dahulu.');
      return;
    }
    if (acct.passcode !== encodePasscode(passwordInput)) {
      setAuthError('Password tidak sesuai. Periksa kembali password kamu.');
      return;
    }
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ email }));
    const loaded = loadLocalUserState(acct.email, acct.name);
    setCurrentUser({ email: acct.email, displayName: acct.name });
    setState(loaded);
  }, []);

  const registerLocal = useCallback((nameInput: string, emailInput: string, passwordInput: string) => {
    setAuthError(null);
    const email = emailInput.trim().toLowerCase();
    const cleanName = clampStr(nameInput.trim(), 60);
    if (!cleanName || !email || passwordInput.length < 4) {
      setAuthError('Isi nama panggilan, email valid, dan password minimal 4 karakter.');
      return;
    }
    const reg = loadAccountsRegistry();
    if (reg[email]) {
      setAuthError('Email ini sudah terdaftar. Silakan masuk di tab Masuk.');
      return;
    }
    reg[email] = {
      name: cleanName,
      email,
      passcode: encodePasscode(passwordInput),
    };
    saveAccountsRegistry(reg);
    setSavedAccounts(listSavedAccounts());

    // Brand-new account always starts cleanly at Rp 0 empty state
    const emptyState = createEmptyAppState(cleanName);
    saveLocalUserState(email, emptyState);
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ email }));
    setCurrentUser({ email, displayName: cleanName });
    setState(emptyState);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    setCurrentUser(null);
    setState(createEmptyAppState('Teman Mucuw'));
    setAuthError(null);
  }, []);

  // CRUD Operations (100% LocalStorage)
  const addTransaction = useCallback(
    (txInput: Omit<Transaction, 'id'>): Transaction => {
      const newTx: Transaction = {
        ...txInput,
        title: clampStr(txInput.title, 160),
        notes: txInput.notes ? clampStr(txInput.notes, 400) : undefined,
        posItemsSummary: txInput.posItemsSummary ? clampStr(txInput.posItemsSummary, 400) : undefined,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };

      commitState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
        wallets: applyTxToWallets(prev.wallets, newTx, 1),
      }));

      sound(newTx.type === 'income' ? 'cash' : 'success');
      return newTx;
    },
    [commitState, sound],
  );

  const updateTransaction = useCallback(
    (updatedInput: Transaction) => {
      const updated: Transaction = {
        ...updatedInput,
        title: clampStr(updatedInput.title, 160),
        notes: updatedInput.notes ? clampStr(updatedInput.notes, 400) : undefined,
        posItemsSummary: updatedInput.posItemsSummary
          ? clampStr(updatedInput.posItemsSummary, 400)
          : undefined,
      };

      commitState((prev) => {
        const oldTx = prev.transactions.find((t) => t.id === updated.id);
        let nextWallets = prev.wallets;
        if (oldTx) {
          nextWallets = applyTxToWallets(nextWallets, oldTx, -1);
        }
        nextWallets = applyTxToWallets(nextWallets, updated, 1);
        return {
          ...prev,
          wallets: nextWallets,
          transactions: prev.transactions.map((t) => (t.id === updated.id ? updated : t)),
        };
      });

      sound('success');
    },
    [commitState, sound],
  );

  const deleteTransaction = useCallback(
    (txId: string) => {
      commitState((prev) => {
        const target = prev.transactions.find((t) => t.id === txId);
        if (!target) return prev;
        return {
          ...prev,
          wallets: applyTxToWallets(prev.wallets, target, -1),
          transactions: prev.transactions.filter((t) => t.id !== txId),
        };
      });
      sound('tap');
    },
    [commitState, sound],
  );

  const addWallet = useCallback(
    (walletInput: Omit<Wallet, 'id' | 'order'>) => {
      commitState((prev) => {
        const newWallet: Wallet = {
          ...walletInput,
          name: clampStr(walletInput.name, 60),
          subtitle: clampStr(walletInput.subtitle, 100),
          emoji: clampStr(walletInput.emoji, 16) || '👛',
          id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          order: prev.wallets.length,
        };
        return {
          ...prev,
          wallets: [...prev.wallets, newWallet],
        };
      });
      sound('success');
    },
    [commitState, sound],
  );

  const updateWalletAndAdjustBalance = useCallback(
    (walletId: string, updates: Partial<Wallet>, recordAdjustmentTx = true) => {
      commitState((prev) => {
        const existing = prev.wallets.find((w) => w.id === walletId);
        if (!existing) return prev;

        const updatedWallet: Wallet = {
          ...existing,
          ...updates,
          name: clampStr(updates.name ?? existing.name, 60),
          subtitle: clampStr(updates.subtitle ?? existing.subtitle, 100),
        };

        const diff = updatedWallet.balance - existing.balance;
        let adjTx: Transaction | null = null;
        if (recordAdjustmentTx && diff !== 0) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          adjTx = {
            id: `tx_adj_${Date.now()}`,
            type: diff > 0 ? 'income' : 'expense',
            scope: 'personal',
            title: clampStr(`Penyesuaian Saldo · ${updatedWallet.name}`, 160),
            amount: Math.abs(diff),
            date: getTodayYMD(),
            time: `${hh}:${mm}`,
            walletId,
            categoryId: 'cat_adjust',
            notes: 'Penyesuaian saldo dompet manual',
          };
        }

        return {
          ...prev,
          wallets: prev.wallets.map((w) => (w.id === walletId ? updatedWallet : w)),
          transactions: adjTx ? [adjTx, ...prev.transactions] : prev.transactions,
        };
      });
      sound('success');
    },
    [commitState, sound],
  );

  const deleteWallet = useCallback(
    (walletId: string) => {
      commitState((prev) => ({
        ...prev,
        wallets: prev.wallets
          .filter((w) => w.id !== walletId)
          .map((w, idx) => ({ ...w, order: idx })),
      }));
      sound('tap');
    },
    [commitState, sound],
  );

  const reorderWallets = useCallback(
    (walletId: string, direction: 'up' | 'down') => {
      commitState((prev) => {
        const sorted = [...prev.wallets].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((w) => w.id === walletId);
        if (idx === -1) return prev;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
        const temp = sorted[idx];
        sorted[idx] = sorted[swapIdx];
        sorted[swapIdx] = temp;
        return {
          ...prev,
          wallets: sorted.map((w, i) => ({ ...w, order: i })),
        };
      });
      sound('tap');
    },
    [commitState, sound],
  );

  const addCategory = useCallback(
    (catInput: Omit<Category, 'id'>) => {
      const newCat: Category = {
        ...catInput,
        name: clampStr(catInput.name, 50),
        nameEn: clampStr(catInput.nameEn, 50),
        emoji: clampStr(catInput.emoji, 16) || '✨',
        id: `cat_${Date.now()}`,
      };
      commitState((prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
      }));
      sound('success');
      return newCat;
    },
    [commitState, sound],
  );

  const deleteCategory = useCallback(
    (catId: string) => {
      commitState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== catId),
      }));
      sound('tap');
    },
    [commitState, sound],
  );

  const addPosProduct = useCallback(
    (prod: Omit<PosProduct, 'id'>) => {
      const newProd: PosProduct = {
        ...prod,
        name: clampStr(prod.name, 80),
        emoji: clampStr(prod.emoji, 16) || '🧁',
        categoryLabel: clampStr(prod.categoryLabel, 40) || 'Produk',
        id: `pos_${Date.now()}`,
      };
      commitState((prev) => ({
        ...prev,
        posProducts: [...prev.posProducts, newProd],
      }));
      sound('success');
    },
    [commitState, sound],
  );

  const deletePosProduct = useCallback(
    (prodId: string) => {
      commitState((prev) => ({
        ...prev,
        posProducts: prev.posProducts.filter((p) => p.id !== prodId),
      }));
      sound('tap');
    },
    [commitState, sound],
  );

  const checkoutPosOrder = useCallback(
    (orderInput: Omit<PosOrder, 'id' | 'orderNumber'>): PosOrder => {
      const orderNum = `POS #${String(stateRef.current.posOrders.length + 1).padStart(3, '0')}`;
      const order: PosOrder = {
        ...orderInput,
        id: `ord_${Date.now()}`,
        orderNumber: orderNum,
      };
      const itemsSummary = clampStr(
        order.items.map((it) => `${it.qty}x ${it.name}`).join(', '),
        400,
      );
      const tx: Transaction = {
        id: `tx_pos_${Date.now()}`,
        type: 'income',
        scope: 'business',
        businessKind: 'revenue',
        title: clampStr(`${orderNum} · ${itemsSummary}`, 160),
        amount: order.total,
        date: order.date,
        time: order.time,
        walletId: order.walletId,
        categoryId: 'cat_biz_revenue',
        posItemsSummary: itemsSummary,
        notes: `Est. profit usaha Rp ${order.estimatedProfit.toLocaleString('id-ID')}`,
      };

      commitState((prev) => ({
        ...prev,
        posOrders: [order, ...prev.posOrders],
        transactions: [tx, ...prev.transactions],
        wallets: applyTxToWallets(prev.wallets, tx, 1),
      }));

      sound('cash');
      return order;
    },
    [commitState, sound],
  );

  const addBudgetDream = useCallback(
    (item: Omit<BudgetDream, 'id'>) => {
      const newItem: BudgetDream = {
        ...item,
        title: clampStr(item.title, 80),
        emoji: clampStr(item.emoji, 16) || '🌸',
        id: `bd_${Date.now()}`,
      };
      commitState((prev) => ({
        ...prev,
        budgetsAndDreams: [...prev.budgetsAndDreams, newItem],
      }));
      sound('success');
    },
    [commitState, sound],
  );

  const updateBudgetDream = useCallback(
    (updated: BudgetDream) => {
      commitState((prev) => ({
        ...prev,
        budgetsAndDreams: prev.budgetsAndDreams.map((b) => (b.id === updated.id ? updated : b)),
      }));
      sound('success');
    },
    [commitState, sound],
  );

  const deleteBudgetDream = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        budgetsAndDreams: prev.budgetsAndDreams.filter((b) => b.id !== id),
      }));
      sound('tap');
    },
    [commitState, sound],
  );

  const addInvestment = useCallback(
    (inv: Omit<InvestmentHolding, 'id'>) => {
      const newInv: InvestmentHolding = {
        ...inv,
        name: clampStr(inv.name, 80),
        platform: clampStr(inv.platform, 60),
        emoji: clampStr(inv.emoji, 16) || '🌱',
        id: `inv_${Date.now()}`,
      };
      commitState((prev) => ({
        ...prev,
        investments: [...prev.investments, newInv],
      }));
      sound('success');
    },
    [commitState, sound],
  );

  const updateInvestment = useCallback(
    (updated: InvestmentHolding) => {
      commitState((prev) => ({
        ...prev,
        investments: prev.investments.map((i) => (i.id === updated.id ? updated : i)),
      }));
      sound('success');
    },
    [commitState, sound],
  );

  const deleteInvestment = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        investments: prev.investments.filter((i) => i.id !== id),
      }));
      sound('tap');
    },
    [commitState, sound],
  );

  const updateWidgetConfig = useCallback(
    (patch: Partial<WidgetConfig>) => {
      commitState((prev) => ({
        ...prev,
        widgetConfig: { ...prev.widgetConfig, ...patch },
      }));
    },
    [commitState],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      commitState((prev) => {
        const nextName =
          patch.profileName !== undefined
            ? clampStr(patch.profileName, 60) || prev.settings.profileName
            : prev.settings.profileName;

        if (userRef.current && patch.profileName !== undefined && patch.profileName.trim()) {
          const reg = loadAccountsRegistry();
          const acct = reg[userRef.current.email];
          if (acct) {
            acct.name = nextName;
            saveAccountsRegistry(reg);
            setSavedAccounts(listSavedAccounts());
          }
          setCurrentUser((u) => (u ? { ...u, displayName: nextName } : null));
        }

        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...patch,
            profileName: nextName,
          },
        };
      });
    },
    [commitState],
  );

  // Backup & Restore JSON (Full manual export/import across devices)
  const exportBackupJson = useCallback(() => {
    const payload = {
      app: 'Mucuw Finance & Mini POS',
      version: 2,
      accountEmail: userRef.current?.email || '',
      exportedAt: new Date().toISOString(),
      data: stateRef.current,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeSlug = (stateRef.current.settings.profileName || 'mucuw')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.download = `mucuw-backup-${safeSlug}-${getTodayYMD()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sound('success');
  }, [sound]);

  const importBackupJson = useCallback(
    (rawJson: string, mode: 'replace' | 'merge' = 'replace'): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson);
        const rawData = (parsed?.data || parsed) as Partial<AppState>;
        if (!rawData || !Array.isArray(rawData.wallets) || !Array.isArray(rawData.transactions)) {
          return {
            ok: false,
            message: 'Format file JSON tidak dikenali. Pastikan file berasal dari Export Backup Mucuw.',
          };
        }

        const normalized = normalizeAppState(rawData, stateRef.current.settings.profileName);

        if (mode === 'merge') {
          commitState((prev) => ({
            ...prev,
            wallets: mergeById(prev.wallets, normalized.wallets).map((w, idx) => ({
              ...w,
              order: idx,
            })),
            categories: mergeById(prev.categories, normalized.categories),
            transactions: mergeById(prev.transactions, normalized.transactions),
            posProducts: mergeById(prev.posProducts, normalized.posProducts),
            posOrders: mergeById(prev.posOrders, normalized.posOrders),
            budgetsAndDreams: mergeById(prev.budgetsAndDreams, normalized.budgetsAndDreams),
            investments: mergeById(prev.investments, normalized.investments),
          }));
          sound('success');
          return {
            ok: true,
            message: `Berhasil menggabungkan backup (${normalized.wallets.length} dompet, ${normalized.transactions.length} transaksi).`,
          };
        }

        commitState(() => normalized);
        sound('success');
        return {
          ok: true,
          message: `Berhasil memulihkan backup (${normalized.wallets.length} dompet & ${normalized.transactions.length} transaksi)!`,
        };
      } catch {
        return { ok: false, message: 'Gagal membaca file JSON. Pastikan isi file valid dan tidak rusak.' };
      }
    },
    [commitState, sound],
  );

  const resetEmptyAccount = useCallback(() => {
    const empty = createEmptyAppState(stateRef.current.settings.profileName);
    commitState(() => empty);
    sound('tap');
  }, [commitState, sound]);

  return {
    authReady,
    authError,
    clearAuthError,
    currentUser,
    savedAccounts,
    storageKey: currentUser ? getLocalDataKey(currentUser.email) : '',
    state,
    sound,
    loginLocal,
    registerLocal,
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWalletAndAdjustBalance,
    deleteWallet,
    reorderWallets,
    addCategory,
    deleteCategory,
    addPosProduct,
    deletePosProduct,
    checkoutPosOrder,
    addBudgetDream,
    updateBudgetDream,
    deleteBudgetDream,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updateWidgetConfig,
    updateSettings,
    exportBackupJson,
    importBackupJson,
    resetEmptyAccount,
  };
}
