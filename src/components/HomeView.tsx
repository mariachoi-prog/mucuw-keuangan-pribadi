import { ArrowLeftRight, Eye, EyeOff, Plus, Store, Target, TrendingUp, User, Wallet } from 'lucide-react';
import { useState } from 'react';
import { AppState, Transaction } from '../types/finance';
import { formatCompactIDR, formatDateGroupLabel, formatIDR, WALLET_THEME_STYLES } from '../utils/formatters';

interface HomeViewProps {
  state: AppState;
  onOpenAssetSheet: () => void;
  onOpenTransfer: () => void;
  onOpenBusinessTab: () => void;
  onOpenProfile: () => void;
  onOpenNewTx: (type: 'expense' | 'income', walletId?: string) => void;
  onEditTx: (tx: Transaction) => void;
  onGoToTransactions: () => void;
  onGoToReport: () => void;
  onOpenBudgetsModal: () => void;
  onOpenInvestmentsModal: () => void;
}

export function HomeView({
  state,
  onOpenAssetSheet,
  onOpenTransfer,
  onOpenBusinessTab,
  onOpenProfile,
  onOpenNewTx,
  onEditTx,
  onGoToTransactions,
  onGoToReport,
  onOpenBudgetsModal,
  onOpenInvestmentsModal,
}: HomeViewProps) {
  const [hideBalance, setHideBalance] = useState(false);
  const lang = state.settings.language;

  const sortedWallets = [...state.wallets].sort((a, b) => a.order - b.order);
  const totalWalletBalance = sortedWallets.reduce((sum, w) => sum + w.balance, 0);
  const totalInvestments = state.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalAssets = totalWalletBalance + totalInvestments;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthTxs = state.transactions.filter((tx) => tx.date.startsWith(currentMonthPrefix));
  const monthIncome = monthTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthExpense = monthTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const recentTransactions = [...state.transactions]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 5);

  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));
  const walletMap = new Map(state.wallets.map((w) => [w.id, w]));

  const computeBudgetProgress = (categoryId?: string, fallbackCurrent = 0) => {
    if (!categoryId) return fallbackCurrent;
    return monthTxs
      .filter((tx) => tx.type === 'expense' && tx.categoryId === categoryId)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Personal Greeting Header */}
      <header className="flex items-center justify-between gap-4 pt-2">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {lang === 'id'
              ? `Halo, ${state.settings.profileName}! 👋`
              : `Hi, ${state.settings.profileName}! 👋`}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === 'id'
              ? 'Yuk cek uang & omzet kamu hari ini'
              : 'Let’s check your cashflow & business today'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="Profil dan pengaturan"
          className="min-h-[44px] min-w-[44px] flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 border border-purple-100 shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-bold text-sm">
            {state.settings.profileName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline text-xs font-semibold text-slate-700 pr-1">
            {lang === 'id' ? 'Profil & Menu' : 'Profile'}
          </span>
          <User className="w-4 h-4 text-purple-500 sm:hidden" />
        </button>
      </header>

      {/* Main Responsive Top Grid: Total Aset Hero + Shortcut / Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Total Aset Glossy Card */}
        <section className="lg:col-span-7 glossy-sheen rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-6 text-white shadow-[0_16px_40px_-12px_rgba(168,85,247,0.45)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-purple-100 tracking-wide">
                {lang === 'id' ? 'Total Aset Keseluruhan' : 'Total Net Assets'}
              </span>
              <button
                type="button"
                onClick={() => setHideBalance((v) => !v)}
                aria-label={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <p className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
                {hideBalance ? 'Rp ••••••••' : formatIDR(totalAssets)}
              </p>
              <span className="text-xs font-medium text-white/85">
                {lang === 'id'
                  ? `Dompet ${formatCompactIDR(totalWalletBalance)} · Investasi ${formatCompactIDR(totalInvestments)}`
                  : `Wallets ${formatCompactIDR(totalWalletBalance)} · Invest ${formatCompactIDR(totalInvestments)}`}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-white/16 p-3.5 backdrop-blur-md border border-white/20">
            <div>
              <p className="text-xs text-purple-100 font-medium">
                {lang === 'id' ? '↗ Pemasukan Bulan Ini' : '↗ Monthly Income'}
              </p>
              <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums">
                {hideBalance ? 'Rp ••••••' : formatIDR(monthIncome)}
              </p>
            </div>
            <div className="border-l border-white/20 pl-3">
              <p className="text-xs text-pink-100 font-medium">
                {lang === 'id' ? '↘ Pengeluaran Bulan Ini' : '↘ Monthly Expense'}
              </p>
              <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums">
                {hideBalance ? 'Rp ••••••' : formatIDR(monthExpense)}
              </p>
            </div>
          </div>

          {/* Pill-Shaped Shortcut Buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenAssetSheet}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white text-purple-700 px-4 py-2 text-xs font-bold shadow-sm hover:bg-purple-50 transition-all active:scale-95 whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5" />
              {lang === 'id' ? '👛 Pilih Aset' : '👛 Wallets'}
            </button>
            <button
              type="button"
              onClick={onOpenTransfer}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white border border-white/30 px-4 py-2 text-xs font-bold hover:bg-white/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {lang === 'id' ? '⇄ Pindah Saldo' : '⇄ Transfer'}
            </button>
            <button
              type="button"
              onClick={onOpenBusinessTab}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white border border-white/30 px-4 py-2 text-xs font-bold hover:bg-white/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5" />
              {lang === 'id' ? '🏪 Kasir POS' : '🏪 Mini POS'}
            </button>
            <button
              type="button"
              onClick={onGoToReport}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white border border-white/30 px-4 py-2 text-xs font-bold hover:bg-white/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {lang === 'id' ? '📊 Report' : '📊 Report'}
            </button>
          </div>
        </section>

        {/* Quick Budget & Mimpi + Investasi Snapshot */}
        <section className="lg:col-span-5 mucuw-card rounded-3xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900">
                {lang === 'id' ? '🎯 Budget & Mimpi' : '🎯 Budgets & Goals'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'id' ? 'Pantau batas jajan & target nabungmu' : 'Track limits & savings dreams'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBudgetsModal}
              className="min-h-[36px] rounded-full bg-purple-50 text-purple-700 px-3.5 py-1.5 text-xs font-bold hover:bg-purple-100 transition-colors whitespace-nowrap"
            >
              {state.budgetsAndDreams.length === 0
                ? lang === 'id'
                  ? '+ Tambah'
                  : '+ Add'
                : lang === 'id'
                  ? 'Kelola'
                  : 'Manage'}
            </button>
          </div>

          {state.budgetsAndDreams.length === 0 ? (
            <button
              type="button"
              onClick={onOpenBudgetsModal}
              className="rounded-2xl bg-[#FFFDF9] border border-dashed border-purple-200 p-5 text-center space-y-1.5 hover:border-purple-300 transition-colors"
            >
              <p className="text-2xl">🌸</p>
              <p className="text-xs font-bold text-slate-800">
                {lang === 'id'
                  ? 'Belum ada target budget atau mimpi'
                  : 'No budgets or goals yet'}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'id'
                  ? 'Tap di sini untuk atur limit jajan atau tabungan impianmu'
                  : 'Tap here to create your first spending limit or goal'}
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              {state.budgetsAndDreams.slice(0, 3).map((item) => {
                const current =
                  item.kind === 'budget'
                    ? computeBudgetProgress(item.categoryId, item.currentAmount)
                    : item.currentAmount;
                const pct = Math.min(100, Math.round((current / Math.max(1, item.targetAmount)) * 100));
                const isOverBudget = item.kind === 'budget' && current > item.targetAmount;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={onOpenBudgetsModal}
                    className="w-full text-left rounded-2xl bg-[#FFFDF9] border border-slate-100 p-3 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                      <span className="truncate">
                        {item.emoji} {item.title}
                      </span>
                      <span className={`tabular-nums shrink-0 ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isOverBudget ? '#E11D48' : item.color,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                      <span>{formatCompactIDR(current)}</span>
                      <span>
                        {item.kind === 'budget' ? 'Limit ' : 'Target '}
                        {formatCompactIDR(item.targetAmount)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenInvestmentsModal}
            className="min-h-[44px] w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-2.5 text-left hover:border-emerald-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-base">
                🌱
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  {lang === 'id' ? 'Portofolio Investasi' : 'Investment Portfolio'}
                </p>
                <p className="text-[11px] text-emerald-700">
                  {state.investments.length === 0
                    ? lang === 'id'
                      ? 'Belum ada instrumen tercatat'
                      : 'No holdings yet'
                    : `${state.investments.length} ${lang === 'id' ? 'instrumen aktif' : 'active holdings'}`}
                </p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
              {hideBalance ? '••••' : formatIDR(totalInvestments)}
            </span>
          </button>
        </section>
      </div>

      {/* Dompet Reguler Grid or Empty State */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold text-slate-900">
              {lang === 'id' ? '💳 Dompet & Rekening' : '💳 Wallets & Accounts'}
            </h2>
            <p className="text-xs text-slate-500">
              {sortedWallets.length === 0
                ? lang === 'id'
                  ? 'Tambahkan rekening bank, e-wallet, atau uang tunai pertamamu'
                  : 'Add your first bank account, e-wallet, or cash wallet'
                : lang === 'id'
                  ? 'Tap dompet untuk catat cepat atau atur saldo'
                  : 'Tap a wallet to quick-log or manage'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAssetSheet}
            className="min-h-[40px] rounded-full bg-purple-100/80 text-purple-700 px-4 py-1.5 text-xs font-bold hover:bg-purple-200/70 transition-colors whitespace-nowrap"
          >
            {sortedWallets.length === 0
              ? lang === 'id'
                ? '+ Tambah Dompet'
                : '+ Add Wallet'
              : lang === 'id'
                ? 'Atur Semua'
                : 'Manage All'}
          </button>
        </div>

        {sortedWallets.length === 0 ? (
          <div className="mucuw-card rounded-3xl p-7 text-center border-2 border-dashed border-purple-200 space-y-3">
            <p className="text-4xl">👛</p>
            <h3 className="font-display text-base font-extrabold text-slate-900">
              {lang === 'id'
                ? 'Daftar dompet kamu masih kosong'
                : 'Your wallet list is empty'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'id'
                ? 'Mulai dengan menambahkan rekening atau e-wallet pertamamu seperti Livin’ by Mandiri, Blu BCA, Seabank, GoPay, DANA, atau Cash.'
                : 'Start by adding your first bank account, e-wallet, or cash wallet.'}
            </p>
            <button
              type="button"
              onClick={onOpenAssetSheet}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2.5 text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'id' ? '+ Tambah Dompet Pertamamu' : '+ Add Your First Wallet'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {sortedWallets.map((wallet) => {
              const style = WALLET_THEME_STYLES[wallet.theme] || WALLET_THEME_STYLES.lavender;
              return (
                <div
                  key={wallet.id}
                  className={`glossy-sheen rounded-3xl p-4 shadow-md transition-transform hover:-translate-y-0.5 ${style.cardBg} ${style.text} flex flex-col justify-between min-h-[144px]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={onOpenAssetSheet}
                      className="text-left min-w-0 flex-1"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm text-lg">
                        {wallet.emoji}
                      </span>
                      <p className="mt-2 font-display text-sm font-extrabold truncate">{wallet.name}</p>
                      <p className="text-[11px] opacity-85 truncate">{wallet.subtitle}</p>
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="font-display text-base sm:text-lg font-extrabold tabular-nums truncate">
                      {hideBalance ? 'Rp •••••' : formatIDR(wallet.balance)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Catat pengeluaran ${wallet.name}`}
                      onClick={() => onOpenNewTx('expense', wallet.id)}
                      className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-full ${style.accentPill} hover:scale-105 transition-transform shrink-0`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="mucuw-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <h2 className="font-display text-base sm:text-lg font-extrabold text-slate-900">
              {lang === 'id' ? 'Transaksi Terbaru' : 'Recent Transactions'}
            </h2>
          </div>
          {state.transactions.length > 0 && (
            <button
              type="button"
              onClick={onGoToTransactions}
              className="min-h-[36px] rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors whitespace-nowrap"
            >
              {lang === 'id' ? 'Lihat Semua →' : 'See All →'}
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-3xl">🧁</p>
            <p className="text-sm font-bold text-slate-700">
              {lang === 'id'
                ? 'Belum ada catatan transaksi. Yuk mulai catat keuanganmu!'
                : 'No transactions yet. Start logging your finances!'}
            </p>
            <button
              type="button"
              onClick={
                sortedWallets.length === 0
                  ? onOpenAssetSheet
                  : () => onOpenNewTx('expense', sortedWallets[0]?.id)
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 text-xs font-bold hover:bg-purple-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {sortedWallets.length === 0
                  ? lang === 'id'
                    ? 'Tambah Dompet Dulu'
                    : 'Create Wallet First'
                  : lang === 'id'
                    ? 'Catat Transaksi Pertama'
                    : 'Log First Transaction'}
              </span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const wallet = walletMap.get(tx.walletId);
              const toWallet = tx.toWalletId ? walletMap.get(tx.toWalletId) : undefined;
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => onEditTx(tx)}
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-purple-50/40 rounded-2xl px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                      style={{ backgroundColor: cat?.bgColor || '#F3E8FF' }}
                    >
                      {cat?.emoji || '✨'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{tx.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {isTransfer && toWallet
                          ? `${wallet?.name || ''} → ${toWallet.name}`
                          : wallet?.name || ''}
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">
                          {formatDateGroupLabel(tx.date, lang)} {tx.time}
                        </span>
                        {tx.scope === 'business' && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-semibold text-purple-600">Bisnis</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-extrabold tabular-nums shrink-0 ${
                      isTransfer
                        ? 'text-indigo-600'
                        : isIncome
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                    {formatIDR(tx.amount)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
