import {
  Download,
  FileSpreadsheet,
  Globe,
  HardDrive,
  LogOut,
  Palette,
  RotateCcw,
  Store,
  Tag,
  Target,
  TrendingUp,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { ActiveUser } from '../hooks/useFinanceStore';
import { AppSettings, AppState, AppTheme } from '../types/finance';
import { exportTransactionsToCSV } from '../utils/formatters';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUser: ActiveUser | null;
  storageKey: string;
  state: AppState;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenBusinessPOS: () => void;
  onOpenCategoriesModal: () => void;
  onOpenBudgetsModal: () => void;
  onOpenInvestmentsModal: () => void;
  onExportBackup: () => void;
  onImportBackup: (
    rawJson: string,
    mode?: 'replace' | 'merge',
  ) => { ok: boolean; message: string };
  onResetAccount: () => void;
  onLogout: () => void;
}

export function ProfileDrawer({
  open,
  onClose,
  currentUser,
  storageKey,
  state,
  onUpdateSettings,
  onOpenBusinessPOS,
  onOpenCategoriesModal,
  onOpenBudgetsModal,
  onOpenInvestmentsModal,
  onExportBackup,
  onImportBackup,
  onResetAccount,
  onLogout,
}: ProfileDrawerProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [backupFeedback, setBackupFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const { settings } = state;
  const lang = settings.language;

  if (!open) return null;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const result = onImportBackup(reader.result, importMode);
      setBackupFeedback({ ok: result.ok, text: result.message });
      setTimeout(() => setBackupFeedback(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-[#FFFDF9] shadow-2xl border-l border-purple-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-purple-100">
          <h2 className="font-display text-lg font-extrabold text-slate-900">
            {lang === 'id' ? '⚙️ Profil & Pengaturan' : '⚙️ Profile & Settings'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Profile Card */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-400 p-4 text-white shadow-md space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 rounded-2xl bg-white/25 flex items-center justify-center font-display text-xl font-extrabold shrink-0">
                {settings.profileName.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-purple-100">
                  {lang === 'id' ? 'Nama Panggilan Kamu' : 'Your Display Name'}
                </p>
                <input
                  type="text"
                  value={settings.profileName}
                  onChange={(e) => onUpdateSettings({ profileName: e.target.value })}
                  className="mt-0.5 w-full rounded-xl bg-white/20 border border-white/30 px-2.5 py-1 text-sm font-bold text-white placeholder:text-white/70 focus:outline-none focus:bg-white/30"
                />
              </div>
            </div>

            {currentUser && (
              <div className="rounded-2xl bg-white/15 px-3 py-2 text-[11px] font-semibold space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{currentUser.email}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 shrink-0">
                    <HardDrive className="w-3 h-3" />
                    <span>LocalStorage</span>
                  </span>
                </div>
                <p className="text-[10px] text-purple-100 truncate">
                  Key: {storageKey}
                </p>
              </div>
            )}
          </div>

          {/* Backup & Restore JSON */}
          <div className="mucuw-card rounded-3xl p-4 space-y-3 border border-purple-200/80">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  💾 Backup & Restore Data (JSON)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cadangkan atau pindahkan seluruh data antar perangkat secara manual tanpa server.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-purple-50/70 border border-purple-100 px-3 py-2 text-[11px] font-semibold text-purple-900 flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
              <span>👛 {state.wallets.length} Dompet</span>
              <span>📒 {state.transactions.length} Transaksi</span>
              <span>🛍️ {state.posProducts.length} Produk POS</span>
              <span>🌱 {state.investments.length} Investasi</span>
            </div>

            {/* Import Mode Selector */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-600">Mode saat Import File JSON:</p>
              <div className="grid grid-cols-2 gap-1.5 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`min-h-[32px] rounded-full text-[11px] font-bold transition-all ${
                    importMode === 'replace'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Timpa Data Saat Ini
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`min-h-[32px] rounded-full text-[11px] font-bold transition-all ${
                    importMode === 'merge'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Gabungkan Data
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onExportBackup();
                  setBackupFeedback({ ok: true, text: 'File backup JSON berhasil diunduh!' });
                  setTimeout(() => setBackupFeedback(null), 4000);
                }}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-full bg-purple-600 text-white px-3 py-2 text-xs font-bold hover:bg-purple-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="cursor-pointer min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-full bg-white border border-purple-200 text-purple-800 px-3 py-2 text-xs font-bold hover:bg-purple-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                exportTransactionsToCSV(state, state.transactions);
                setBackupFeedback({ ok: true, text: 'File CSV transaksi berhasil diunduh!' });
                setTimeout(() => setBackupFeedback(null), 3000);
              }}
              className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Transaksi ke CSV / Excel</span>
            </button>

            {backupFeedback && (
              <p
                className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
                  backupFeedback.ok
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {backupFeedback.text}
              </p>
            )}
          </div>

          {/* Menu Fitur */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 px-1">
              {lang === 'id' ? 'Menu Keuangan & Bisnis' : 'Finance & Business Tools'}
            </p>
            <div className="mucuw-card rounded-3xl divide-y divide-slate-100 overflow-hidden">
              {[
                {
                  icon: Store,
                  color: 'text-purple-600 bg-purple-50',
                  label: lang === 'id' ? 'Pencatatan Bisnis & POS' : 'Business Mode & Mini POS',
                  onClick: () => {
                    onClose();
                    onOpenBusinessPOS();
                  },
                },
                {
                  icon: Tag,
                  color: 'text-pink-600 bg-pink-50',
                  label: lang === 'id' ? 'Kelola Kategori & Emoji' : 'Manage Categories & Emoji',
                  onClick: () => {
                    onClose();
                    onOpenCategoriesModal();
                  },
                },
                {
                  icon: Target,
                  color: 'text-amber-600 bg-amber-50',
                  label: lang === 'id' ? 'Budget & Mimpi' : 'Budgets & Dreams',
                  onClick: () => {
                    onClose();
                    onOpenBudgetsModal();
                  },
                },
                {
                  icon: TrendingUp,
                  color: 'text-emerald-600 bg-emerald-50',
                  label: lang === 'id' ? 'Portofolio Investasi' : 'Investment Portfolio',
                  onClick: () => {
                    onClose();
                    onOpenInvestmentsModal();
                  },
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="w-full min-h-[52px] flex items-center justify-between px-4 py-3 text-left hover:bg-purple-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-bold text-slate-800">{item.label}</span>
                    </div>
                    <span className="text-slate-400 text-xs font-bold">→</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tampilan & Tema */}
          <div className="mucuw-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
              <Palette className="w-4 h-4 text-purple-500" />
              <span>{lang === 'id' ? 'Tampilan & Tema' : 'Appearance & Theme'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'light', label: '☀️ Terang' },
                  { id: 'glossy', label: '✨ Glossy' },
                  { id: 'pastel', label: '🧁 Pastel' },
                ] as { id: AppTheme; label: string }[]
              ).map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: th.id })}
                  className={`min-h-[40px] rounded-2xl text-xs font-bold border transition-all ${
                    settings.theme === th.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bahasa & Sound Effect */}
          <div className="mucuw-card rounded-3xl divide-y divide-slate-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-bold text-slate-800">
                  {lang === 'id' ? 'Bahasa Aplikasi' : 'App Language'}
                </span>
              </div>
              <div className="inline-flex rounded-full bg-slate-100 p-1">
                {(['id', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onUpdateSettings({ language: code })}
                    className={`min-h-[32px] rounded-full px-3 text-xs font-extrabold uppercase ${
                      settings.language === code
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-pink-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-bold text-slate-800">Sound Effect</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`min-h-[34px] w-14 rounded-full p-1 transition-colors ${
                  settings.soundEnabled ? 'bg-purple-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Kosongkan Data & Logout */}
          <div className="space-y-2.5 pt-2">
            {confirmReset ? (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-800">Kosongkan seluruh data akun ini?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAccount();
                      setConfirmReset(false);
                    }}
                    className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white"
                  >
                    Ya, Kosongkan
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Data Akun (Rp 0)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-sm hover:bg-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'id' ? 'Keluar Akun (Logout)' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
