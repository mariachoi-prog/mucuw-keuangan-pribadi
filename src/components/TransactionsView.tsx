import { ArrowDownUp, Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MASCOT_LAPTOP_SRC } from '../data/initialData';
import { AppState, Transaction } from '../types/finance';
import {
  exportTransactionsToCSV,
  formatDateGroupLabel,
  formatIDR,
  getMonthLabel,
} from '../utils/formatters';

interface TransactionsViewProps {
  state: AppState;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onAddNewTx: () => void;
}

export function TransactionsView({
  state,
  onEditTx,
  onDeleteTx,
  onAddNewTx,
}: TransactionsViewProps) {
  const lang = state.settings.language;
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.transactions.forEach((tx) => {
      if (tx.date.length >= 7) months.add(tx.date.slice(0, 7));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [state.transactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.transactions
      .filter((tx) => {
        if (selectedWalletId !== 'all' && tx.walletId !== selectedWalletId && tx.toWalletId !== selectedWalletId) {
          return false;
        }
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (scopeFilter !== 'all' && tx.scope !== scopeFilter) return false;
        if (monthFilter !== 'all' && !tx.date.startsWith(monthFilter)) return false;
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        if (q) {
          const cat = state.categories.find((c) => c.id === tx.categoryId);
          const wallet = state.wallets.find((w) => w.id === tx.walletId);
          const haystack = `${tx.title} ${tx.notes || ''} ${cat?.name || ''} ${wallet?.name || ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const keyA = `${a.date}T${a.time}`;
        const keyB = `${b.date}T${b.time}`;
        return sortOrder === 'newest' ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
      });
  }, [
    categoryFilter,
    monthFilter,
    scopeFilter,
    searchQuery,
    selectedWalletId,
    sortOrder,
    state.categories,
    state.transactions,
    state.wallets,
    typeFilter,
  ]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dailyExpense: number }[] = [];
    const map = new Map<string, { date: string; items: Transaction[]; dailyExpense: number }>();

    filteredTransactions.forEach((tx) => {
      let grp = map.get(tx.date);
      if (!grp) {
        grp = { date: tx.date, items: [], dailyExpense: 0 };
        map.set(tx.date, grp);
        groups.push(grp);
      }
      grp.items.push(tx);
      if (tx.type === 'expense') {
        grp.dailyExpense += tx.amount;
      }
    });
    return groups;
  }, [filteredTransactions]);

  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));
  const walletMap = new Map(state.wallets.map((w) => [w.id, w]));

  return (
    <div className="space-y-5 pb-28">
      {/* Pastel Blue Header with Capybara Mascot */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 p-5 sm:p-6 border border-sky-200/70 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'id' ? 'Riwayat Transaksi 📒' : 'Transaction History 📒'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {lang === 'id'
                ? 'Pantau semua pemasukan, pengeluaran & omzet bisnis'
                : 'Track all personal & business cashflow entries'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportTransactionsToCSV(state, filteredTransactions)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white text-sky-700 px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-sky-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#FFFDF9] shrink-0">
              <img
                src={MASCOT_LAPTOP_SRC}
                alt="Maskot kapibara Mucuw sedang mengetik laptop"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Quick Wallet Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedWalletId('all')}
            className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedWalletId === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
          >
            {lang === 'id' ? 'Semua Dompet' : 'All Wallets'}
          </button>
          {state.wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setSelectedWalletId(w.id)}
              className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedWalletId === w.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              {w.emoji} {w.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'id'
                ? 'Cari transaksi, merchant, atau catatan...'
                : 'Search transactions, merchants, or notes...'
            }
            className="w-full h-11 rounded-2xl bg-white/95 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 border border-sky-200/80 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </header>

      {/* Filter Panel */}
      <section className="mucuw-card rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Type Tabs */}
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {(
              [
                { id: 'all', label: lang === 'id' ? 'Semua' : 'All' },
                { id: 'income', label: lang === 'id' ? '↗ Pemasukan' : '↗ Income' },
                { id: 'expense', label: lang === 'id' ? '↘ Pengeluaran' : '↘ Expense' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scope Tabs */}
          <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 p-1">
            {(
              [
                { id: 'all', label: lang === 'id' ? 'Pribadi + Bisnis' : 'All Modes' },
                { id: 'personal', label: lang === 'id' ? 'Pribadi' : 'Personal' },
                { id: 'business', label: lang === 'id' ? '🏪 Bisnis' : '🏪 Business' },
              ] as const
            ).map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScopeFilter(sc.id)}
                className={`min-h-[34px] rounded-full px-3 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                  scopeFilter === sc.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-700 hover:bg-purple-100/70'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Time Filter */}
          <select
            aria-label="Filter Waktu"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="all">{lang === 'id' ? '📅 Semua Bulan' : '📅 All Months'}</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {getMonthLabel(ym, lang)}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            aria-label="Filter Kategori"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="all">{lang === 'id' ? '🏷️ Semua Kategori' : '🏷️ All Categories'}</option>
            {state.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {lang === 'id' ? cat.name : cat.nameEn}
              </option>
            ))}
          </select>

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-purple-500" />
            <span>
              {sortOrder === 'newest'
                ? lang === 'id'
                  ? 'Urut: Terbaru'
                  : 'Sort: Newest'
                : lang === 'id'
                  ? 'Urut: Terlama'
                  : 'Sort: Oldest'}
            </span>
          </button>
        </div>
      </section>

      {/* Date-Grouped Transaction List */}
      {groupedByDate.length === 0 ? (
        <div className="mucuw-card rounded-3xl p-10 text-center space-y-3">
          <p className="text-3xl">🧁</p>
          <h2 className="font-display text-base font-extrabold text-slate-900">
            {state.transactions.length === 0
              ? lang === 'id'
                ? 'Belum ada catatan transaksi. Yuk mulai catat keuanganmu!'
                : 'No transactions yet. Start logging your finances!'
              : lang === 'id'
                ? 'Tidak ada transaksi yang cocok'
                : 'No matching transactions'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {state.transactions.length === 0
              ? lang === 'id'
                ? 'Semua pemasukan, pengeluaran, maupun omzet usahamu akan tercatat rapi per tanggal di sini.'
                : 'All your income, expenses, and business sales will appear neatly grouped here.'
              : lang === 'id'
                ? 'Coba ubah filter dompet atau kata kunci pencarianmu.'
                : 'Try clearing some filters or search keywords.'}
          </p>
          <button
            type="button"
            onClick={onAddNewTx}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-purple-600 text-white px-5 py-2 text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {lang === 'id' ? 'Catat Transaksi' : 'Log Transaction'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <section key={group.date} className="mucuw-card rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 bg-[#FFFDF9] px-5 py-3 border-b border-slate-100">
                <h2 className="font-display text-xs sm:text-sm font-extrabold text-slate-800">
                  {formatDateGroupLabel(group.date, lang)}
                </h2>
                {group.dailyExpense > 0 && (
                  <span className="text-xs font-bold text-rose-600 tabular-nums">
                    {lang === 'id' ? 'Keluar ' : 'Spent '}
                    {formatIDR(group.dailyExpense)}
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 px-3 sm:px-5">
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const wallet = walletMap.get(tx.walletId);
                  const toWallet = tx.toWalletId ? walletMap.get(tx.toWalletId) : undefined;
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                          style={{ backgroundColor: cat?.bgColor || '#F3E8FF' }}
                        >
                          {cat?.emoji || '✨'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{tx.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            <span>{lang === 'id' ? cat?.name : cat?.nameEn || cat?.name}</span>
                            <span aria-hidden="true"> · </span>
                            <span>
                              {isTransfer && toWallet
                                ? `${wallet?.name || ''} → ${toWallet.name}`
                                : wallet?.name || ''}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span className="tabular-nums">{tx.time}</span>
                            {tx.scope === 'business' && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="font-semibold text-purple-600">Bisnis</span>
                              </>
                            )}
                          </p>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{tx.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <p
                          className={`text-sm font-extrabold tabular-nums mr-1 ${
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

                        <button
                          type="button"
                          onClick={() => onEditTx(tx)}
                          aria-label={`Edit ${tx.title}`}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === tx.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTx(tx.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[38px] rounded-xl bg-rose-600 text-white px-2.5 text-[11px] font-bold hover:bg-rose-700 transition-colors"
                          >
                            {lang === 'id' ? 'Hapus?' : 'Delete?'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            aria-label={`Hapus ${tx.title}`}
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
