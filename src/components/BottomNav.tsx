import { Home, PieChart, Plus, ReceiptText, ScanLine } from 'lucide-react';
import { AppLanguage, NavTab } from '../types/finance';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScan: () => void;
  onOpenCenterSheet: () => void;
  lang: AppLanguage;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  onOpenScan,
  onOpenCenterSheet,
  lang,
}: BottomNavProps) {
  const labels = {
    home: 'Home',
    scan: lang === 'id' ? 'Scan Struk' : 'Scan',
    transactions: lang === 'id' ? 'Transaksi' : 'History',
    report: 'Report',
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-100/90 bg-white/92 backdrop-blur-xl shadow-[0_-8px_30px_rgba(168,85,247,0.08)]"
    >
      <div className="mx-auto max-w-5xl px-2 sm:px-6">
        <div className="grid grid-cols-5 items-center h-16">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'home' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              {labels.home}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenScan}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-2xl text-slate-500 hover:text-pink-500 transition-all active:scale-95"
          >
            <ScanLine className="w-5 h-5" strokeWidth={2} />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              {labels.scan}
            </span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              aria-label="Tambah aksi cepat"
              onClick={onOpenCenterSheet}
              className="glossy-sheen -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-400 text-white shadow-[0_10px_25px_rgba(168,85,247,0.45)] ring-4 ring-white transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-7 h-7" strokeWidth={2.75} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'transactions' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ReceiptText className="w-5 h-5" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              {labels.transactions}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('report')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
              activeTab === 'report' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChart className="w-5 h-5" strokeWidth={activeTab === 'report' ? 2.5 : 2} />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              {labels.report}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
