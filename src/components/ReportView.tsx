import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Download, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MASCOT_COACH_SRC, MASCOT_LAPTOP_SRC } from '../data/initialData';
import { AppState } from '../types/finance';
import { exportTransactionsToCSV, formatCompactIDR, formatIDR, getTodayYMD } from '../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ReportViewProps {
  state: AppState;
  onOpenInvestmentsModal: () => void;
  onOpenBudgetsModal: () => void;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

export function ReportView({
  state,
  onOpenInvestmentsModal,
  onOpenBudgetsModal,
}: ReportViewProps) {
  const lang = state.settings.language;
  const [subTab, setSubTab] = useState<'cashflow' | 'wealth'>('cashflow');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customTo, setCustomTo] = useState(getTodayYMD);

  const [showSmartTips, setShowSmartTips] = useState(false);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed
    const curQuarter = Math.floor(curMonth / 3);

    return state.transactions.filter((tx) => {
      if (walletFilter !== 'all' && tx.walletId !== walletFilter && tx.toWalletId !== walletFilter) {
        return false;
      }
      const [y, m] = tx.date.split('-').map(Number);
      if (period === 'month') {
        return y === curYear && m - 1 === curMonth;
      }
      if (period === 'quarter') {
        return y === curYear && Math.floor((m - 1) / 3) === curQuarter;
      }
      if (period === 'year') {
        return y === curYear;
      }
      if (period === 'custom') {
        return tx.date >= customFrom && tx.date <= customTo;
      }
      return true;
    });
  }, [customFrom, customTo, period, state.transactions, walletFilter]);

  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transferTotal = 0;
    let businessRevenue = 0;
    let businessCogs = 0;

    const categoryExpenseMap = new Map<string, number>();

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'transfer') {
        transferTotal += tx.amount;
        return;
      }
      if (tx.type === 'income') {
        income += tx.amount;
        if (tx.scope === 'business') businessRevenue += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
        if (tx.scope === 'business') businessCogs += tx.amount;
        categoryExpenseMap.set(tx.categoryId, (categoryExpenseMap.get(tx.categoryId) || 0) + tx.amount);
      }
    });

    const netCashflow = income - expense;
    const savingRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;

    const categoryBreakdown = Array.from(categoryExpenseMap.entries())
      .map(([catId, amount]) => {
        const cat = state.categories.find((c) => c.id === catId);
        return {
          catId,
          name: lang === 'id' ? cat?.name || catId : cat?.nameEn || cat?.name || catId,
          emoji: cat?.emoji || '✨',
          color: cat?.color || '#A855F7',
          amount,
          pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      income,
      expense,
      netCashflow,
      transferTotal,
      savingRate,
      businessRevenue,
      businessCogs,
      categoryBreakdown,
    };
  }, [filteredTransactions, lang, state.categories]);

  // Monthly Bar Chart Data (last 4 months or filtered buckets)
  const barChartData = useMemo(() => {
    const buckets = new Map<string, { income: number; expense: number }>();
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(ym, { income: 0, expense: 0 });
    }

    state.transactions.forEach((tx) => {
      if (walletFilter !== 'all' && tx.walletId !== walletFilter) return;
      if (tx.type === 'transfer') return;
      const ym = tx.date.slice(0, 7);
      const bucket = buckets.get(ym);
      if (bucket) {
        if (tx.type === 'income') bucket.income += tx.amount;
        if (tx.type === 'expense') bucket.expense += tx.amount;
      }
    });

    const labels = Array.from(buckets.keys()).map((ym) => {
      const [y, m] = ym.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
      });
    });

    return {
      labels,
      datasets: [
        {
          label: lang === 'id' ? 'Pemasukan' : 'Income',
          data: Array.from(buckets.values()).map((b) => b.income),
          backgroundColor: 'rgba(52, 211, 153, 0.85)',
          borderRadius: 10,
        },
        {
          label: lang === 'id' ? 'Pengeluaran' : 'Expense',
          data: Array.from(buckets.values()).map((b) => b.expense),
          backgroundColor: 'rgba(244, 114, 182, 0.85)',
          borderRadius: 10,
        },
      ],
    };
  }, [lang, state.transactions, walletFilter]);

  const doughnutData = useMemo(() => {
    const items = metrics.categoryBreakdown;
    return {
      labels: items.map((i) => `${i.emoji} ${i.name}`),
      datasets: [
        {
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.color),
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
      ],
    };
  }, [metrics.categoryBreakdown]);

  // Wealth & Portfolio Calculations
  const totalWalletBalance = state.wallets.reduce((s, w) => s + w.balance, 0);
  const totalInvested = state.investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalInvestmentValue = state.investments.reduce((s, i) => s + i.currentValue, 0);
  const totalDreamsSaved = state.budgetsAndDreams
    .filter((b) => b.kind === 'dream')
    .reduce((s, b) => s + b.currentAmount, 0);
  const netWorth = totalWalletBalance + totalInvestmentValue;

  const wealthChartData = {
    labels: [
      lang === 'id' ? 'Dompet Reguler' : 'Regular Wallets',
      lang === 'id' ? 'Portofolio Investasi' : 'Investments',
    ],
    datasets: [
      {
        data: [totalWalletBalance, totalInvestmentValue],
        backgroundColor: ['#A855F7', '#34D399'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Auto-generated AI Financial Summary copy
  const topCategory = metrics.categoryBreakdown[0];
  const autoAiSummary = useMemo(() => {
    if (metrics.income === 0 && metrics.expense === 0) {
      return lang === 'id'
        ? 'Catat minimal 1 pemasukan atau pengeluaran untuk melihat analisis keuanganmu'
        : 'Log at least 1 income or expense to view your financial analysis.';
    }
    const srText = metrics.savingRate.toFixed(1);
    if (lang === 'id') {
      const praise =
        metrics.savingRate >= 30
          ? `Congrats! Saving rate kamu mantap di ${srText}%, berhasil menyisihkan ${formatIDR(Math.max(0, metrics.netCashflow))} dari total income!`
          : metrics.netCashflow >= 0
            ? `Saving rate kamu saat ini ${srText}% dengan surplus ${formatIDR(metrics.netCashflow)}. Yuk dorong lagi ke 30%+!`
            : `Perhatian! Pengeluaran lebih besar ${formatIDR(Math.abs(metrics.netCashflow))} dibanding pemasukan di periode ini.`;
      const topWarn = topCategory
        ? ` Pengeluaran terbesar ada di kategori '${topCategory.name}' mencapai ${topCategory.pct}% (${formatIDR(topCategory.amount)}) dari total pengeluaran.`
        : '';
      const bizNote =
        metrics.businessRevenue > 0
          ? ` Omzet bisnis tercatat ${formatIDR(metrics.businessRevenue)} (terpisah dari belanja pribadi).`
          : '';
      return `${praise}${topWarn}${bizNote}`;
    }
    return `Your saving rate is ${srText}% with net cashflow of ${formatIDR(metrics.netCashflow)}.${
      topCategory ? ` Top spending category is '${topCategory.name}' at ${topCategory.pct}%.` : ''
    }`;
  }, [lang, metrics, topCategory]);

  const localSmartTips = useMemo(() => {
    if (metrics.income === 0 && metrics.expense === 0) return [];
    const tips: string[] = [];

    if (metrics.income > 0 && metrics.savingRate < 20) {
      const targetSave = Math.round(metrics.income * 0.2);
      tips.push(
        lang === 'id'
          ? `💡 Targetkan menabung minimal 20% (${formatIDR(targetSave)}) di awal gajian agar dana darurat cepat terbentuk.`
          : `💡 Aim to set aside at least 20% (${formatIDR(targetSave)}) right when income arrives.`,
      );
    } else if (metrics.savingRate >= 30) {
      tips.push(
        lang === 'id'
          ? `🌟 Saving rate kamu ${metrics.savingRate.toFixed(1)}% sudah sangat sehat! Pertimbangkan alokasi surplus ke Reksa Dana atau Emas Digital.`
          : `🌟 Your ${metrics.savingRate.toFixed(1)}% saving rate is awesome! Consider investing part of the surplus.`,
      );
    }

    if (topCategory && topCategory.pct >= 40) {
      tips.push(
        lang === 'id'
          ? `🎯 Kategori '${topCategory.name}' menyerap ${topCategory.pct}% pengeluaranmu. Coba pasang Limit Budget untuk kategori ini agar lebih terkendali.`
          : `🎯 '${topCategory.name}' accounts for ${topCategory.pct}% of spending. Setting a monthly budget limit can help.`,
      );
    }

    if (metrics.businessRevenue > 0) {
      const bizProfit = metrics.businessRevenue - metrics.businessCogs;
      const margin = Math.round((bizProfit / metrics.businessRevenue) * 100);
      tips.push(
        lang === 'id'
          ? `🏪 Margin kotor usahamu sekitar ${margin}% (${formatIDR(bizProfit)}). Terus pisahkan dompet omzet usaha dari jajan pribadi ya!`
          : `🏪 Your business gross margin is ~${margin}% (${formatIDR(bizProfit)}). Keep business cash separate from personal spending!`,
      );
    }

    if (tips.length === 0) {
      tips.push(
        lang === 'id'
          ? '✨ Arus kasmu seimbang! Pertahankan pencatatan rutin setiap hari agar laporan bulanan semakin akurat.'
          : '✨ Your cashflow looks balanced! Keep logging daily for accurate insights.',
      );
    }
    return tips;
  }, [lang, metrics, topCategory]);

  return (
    <div className="space-y-5 pb-28">
      {/* Pastel Coral/Red Header with Capybara Mascot */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100 p-5 sm:p-6 border border-rose-200/70 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'id' ? 'Report Bulanan 📊' : 'Monthly Report 📊'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
              {lang === 'id'
                ? 'Insight keuangan kamu & kesehatan arus kas'
                : 'Your personal & business financial insights'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportTransactionsToCSV(state, filteredTransactions)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white text-rose-600 px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-rose-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#FFFDF9] shrink-0">
              <img
                src={MASCOT_LAPTOP_SRC}
                alt="Maskot kapibara Mucuw di halaman Report"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Wallet & Period Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter Dompet Report"
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="h-10 rounded-full bg-white/90 border border-rose-200 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="all">{lang === 'id' ? '👛 Semua Dompet' : '👛 All Wallets'}</option>
            {state.wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.emoji} {w.name}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1 rounded-full bg-white/75 p-1">
            {(
              [
                { id: 'month', label: lang === 'id' ? 'Bulan' : 'Month' },
                { id: 'quarter', label: lang === 'id' ? 'Kuartal' : 'Quarter' },
                { id: 'year', label: lang === 'id' ? 'Tahun' : 'Year' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`min-h-[34px] rounded-full px-3.5 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                  period === p.id
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2.5 max-w-md">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-10 rounded-2xl bg-white/95 px-3 text-xs font-semibold text-slate-800 border border-rose-200"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-10 rounded-2xl bg-white/95 px-3 text-xs font-semibold text-slate-800 border border-rose-200"
            />
          </div>
        )}
      </header>

      {/* Sub-Tabs: Arus Kas vs Kekayaan & Portofolio */}
      <div className="flex items-center gap-2 rounded-full bg-white p-1.5 border border-purple-100 shadow-sm max-w-md">
        <button
          type="button"
          onClick={() => setSubTab('cashflow')}
          className={`flex-1 min-h-[40px] rounded-full text-xs sm:text-sm font-bold transition-all ${
            subTab === 'cashflow'
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'id' ? '💸 Arus Kas' : '💸 Cashflow'}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('wealth')}
          className={`flex-1 min-h-[40px] rounded-full text-xs sm:text-sm font-bold transition-all ${
            subTab === 'wealth'
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'id' ? '💎 Kekayaan & Portofolio' : '💎 Wealth & Portfolio'}
        </button>
      </div>

      {subTab === 'cashflow' ? (
        <div className="space-y-5">
          {/* 3 Summary Gradient Cards */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="glossy-sheen rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-green-500 p-5 text-white shadow-md">
                <p className="text-xs font-semibold text-emerald-50">
                  {lang === 'id' ? '↗ Pemasukan' : '↗ Total Income'}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
                  {formatIDR(metrics.income)}
                </p>
                {metrics.businessRevenue > 0 && (
                  <p className="mt-1 text-[11px] text-emerald-50">
                    {lang === 'id' ? 'Termasuk Omzet Bisnis ' : 'Incl. Business '}
                    {formatCompactIDR(metrics.businessRevenue)}
                  </p>
                )}
              </div>

              <div className="glossy-sheen rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-5 text-white shadow-md">
                <p className="text-xs font-semibold text-rose-50">
                  {lang === 'id' ? '↘ Pengeluaran' : '↘ Total Expense'}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
                  {formatIDR(metrics.expense)}
                </p>
                {metrics.businessCogs > 0 && (
                  <p className="mt-1 text-[11px] text-rose-50">
                    {lang === 'id' ? 'Modal/HPP Bisnis ' : 'Business COGS '}
                    {formatCompactIDR(metrics.businessCogs)}
                  </p>
                )}
              </div>

              <div className="glossy-sheen rounded-3xl bg-gradient-to-br from-lime-400 via-emerald-400 to-amber-300 p-5 text-slate-900 shadow-md">
                <p className="text-xs font-bold text-slate-800">
                  {lang === 'id' ? '✨ Selisih / Net Cashflow' : '✨ Net Cashflow'}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
                  {metrics.netCashflow >= 0 ? '+' : ''}
                  {formatIDR(metrics.netCashflow)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-800">
                  Saving Rate: {metrics.savingRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <p className="mt-2.5 text-xs font-medium text-slate-500 px-1 tabular-nums">
              ⇄ Pindah antar dompet {formatIDR(metrics.transferTotal)} tidak dihitung sebagai pemasukan/pengeluaran.
            </p>
          </div>

          {/* AI Financial Summary Card (Pastel Purple + Mascot) */}
          <section className="rounded-3xl bg-gradient-to-br from-purple-100 via-fuchsia-50 to-indigo-100 p-5 sm:p-6 border border-purple-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-20 w-20 rounded-3xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-purple-50">
                <img
                  src={MASCOT_COACH_SRC}
                  alt="Maskot Kapibara AI Financial Summary"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base sm:text-lg font-extrabold text-purple-950">
                    ✨ Ringkasan Keuangan Pintar
                  </h2>
                  <span className="text-xs font-extrabold text-purple-700 tabular-nums">
                    Saving Rate {metrics.savingRate.toFixed(1)}%
                  </span>
                </div>

                <p className="text-sm text-purple-950/90 leading-relaxed">{autoAiSummary}</p>

                {showSmartTips && localSmartTips.length > 0 && (
                  <div className="rounded-2xl bg-white/85 p-3.5 text-xs sm:text-sm text-slate-800 border border-purple-200 space-y-1.5">
                    {localSmartTips.map((tip) => (
                      <p key={tip}>{tip}</p>
                    ))}
                  </div>
                )}

                {(metrics.income > 0 || metrics.expense > 0) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSmartTips((v) => !v)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full bg-purple-600 text-white px-4 py-1.5 text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {showSmartTips
                          ? lang === 'id'
                            ? 'Sembunyikan Tips Pintar'
                            : 'Hide Smart Tips'
                          : lang === 'id'
                            ? 'Lihat Tips Hemat Pintar'
                            : 'View Smart Saving Tips'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Doughnut Category Breakdown */}
            <section className="mucuw-card rounded-3xl p-5">
              <h3 className="font-display text-base font-extrabold text-slate-900">
                {lang === 'id' ? '🍩 Rincian Pengeluaran per Kategori' : '🍩 Expense by Category'}
              </h3>

              {metrics.categoryBreakdown.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  {lang === 'id' ? 'Belum ada pengeluaran di periode ini.' : 'No expenses in this period.'}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-52 flex items-center justify-center">
                    <Doughnut
                      data={doughnutData}
                      options={{
                        cutout: '64%',
                        plugins: {
                          legend: { display: false },
                        },
                      }}
                    />
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {metrics.categoryBreakdown.map((item) => (
                      <div key={item.catId} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate font-semibold text-slate-700">
                            {item.emoji} {item.name}
                          </span>
                        </div>
                        <div className="text-right tabular-nums shrink-0">
                          <span className="font-bold text-slate-900">{formatCompactIDR(item.amount)}</span>
                          <span className="text-slate-400 ml-1">({item.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Bar Chart Monthly Cashflow Trend */}
            <section className="mucuw-card rounded-3xl p-5">
              <h3 className="font-display text-base font-extrabold text-slate-900">
                {lang === 'id' ? '📈 Tren Arus Kas 4 Bulan Terakhir' : '📈 4-Month Cashflow Trend'}
              </h3>
              <div className="mt-4 h-56">
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, usePointStyle: true },
                      },
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (v) => formatCompactIDR(Number(v)),
                          font: { size: 10 },
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                  }}
                />
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* Kekayaan & Portofolio Sub-Tab */
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-5 mucuw-card rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600">
                  {lang === 'id' ? 'Total Kekayaan Bersih' : 'Total Net Worth'}
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-slate-900 tabular-nums">
                  {formatIDR(netWorth)}
                </p>
                <p className="mt-1 text-xs text-slate-500 tabular-nums">
                  Dompet {formatIDR(totalWalletBalance)} · Investasi {formatIDR(totalInvestmentValue)}
                </p>
              </div>
              <div className="h-48 my-4 flex items-center justify-center">
                {totalWalletBalance === 0 && totalInvestmentValue === 0 ? (
                  <div className="text-center px-4">
                    <p className="text-2xl mb-1">💎</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {lang === 'id'
                        ? 'Tambahkan dompet atau portofolio investasi untuk melihat grafik kekayaan.'
                        : 'Add a wallet or investment to view your wealth breakdown.'}
                    </p>
                  </div>
                ) : (
                  <Doughnut
                    data={wealthChartData}
                    options={{
                      cutout: '65%',
                      plugins: { legend: { position: 'bottom' } },
                    }}
                  />
                )}
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center justify-between tabular-nums">
                <span className="font-semibold">
                  {lang === 'id' ? 'Imbal Hasil Investasi' : 'Investment Gain'}
                </span>
                <span className="font-extrabold">
                  {totalInvestmentValue - totalInvested >= 0 ? '+' : ''}
                  {formatIDR(totalInvestmentValue - totalInvested)}
                </span>
              </div>
            </section>

            <section className="lg:col-span-7 mucuw-card rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-extrabold text-slate-900">
                    {lang === 'id' ? '🌱 Portofolio Investasi' : '🌱 Investment Holdings'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Reksa Dana, Saham/ETF, Emas Digital & Deposito
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenInvestmentsModal}
                  className="min-h-[38px] inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'id' ? 'Kelola' : 'Manage'}</span>
                </button>
              </div>

              {state.investments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    {lang === 'id'
                      ? 'Belum ada portofolio investasi tercatat.'
                      : 'No investment holdings recorded yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenInvestmentsModal}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'id' ? 'Tambah Investasi Pertama' : 'Add First Holding'}</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {state.investments.map((inv) => {
                    const gain = inv.currentValue - inv.investedAmount;
                    const gainPct =
                      inv.investedAmount > 0 ? ((gain / inv.investedAmount) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg shrink-0">
                            {inv.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{inv.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {inv.platform} · {inv.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right tabular-nums shrink-0">
                          <p className="text-sm font-extrabold text-slate-900">{formatIDR(inv.currentValue)}</p>
                          <p className={`text-xs font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {gain >= 0 ? '+' : ''}
                            {gainPct}% ({formatCompactIDR(gain)})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">🌸 Total Tabungan Mimpi: </span>
                  <span className="tabular-nums font-bold text-purple-700">{formatIDR(totalDreamsSaved)}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenBudgetsModal}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  {lang === 'id' ? 'Lihat Mimpi →' : 'View Goals →'}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
