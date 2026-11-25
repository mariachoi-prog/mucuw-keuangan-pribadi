import { ArrowDown, ArrowLeftRight, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { AppState, Wallet, WalletTheme } from '../types/finance';
import { formatIDR, WALLET_THEME_STYLES } from '../utils/formatters';

interface AssetSheetModalProps {
  open: boolean;
  onClose: () => void;
  state: AppState;
  onOpenTransfer: () => void;
  onAddWallet: (w: Omit<Wallet, 'id' | 'order'>) => void;
  onUpdateWallet: (walletId: string, updates: Partial<Wallet>, recordAdjustmentTx?: boolean) => void;
  onDeleteWallet: (walletId: string) => void;
  onReorderWallet: (walletId: string, direction: 'up' | 'down') => void;
  onSelectWalletQuickTx: (walletId: string, type: 'expense' | 'income') => void;
}

const PRESET_WALLETS: {
  name: string;
  subtitle: string;
  emoji: string;
  theme: WalletTheme;
}[] = [
  { name: "Livin' by Mandiri", subtitle: 'Rekening Utama', emoji: '🏦', theme: 'mandiri' },
  { name: 'Blu BCA Digital', subtitle: 'Tabungan Digital', emoji: '💎', theme: 'blubca' },
  { name: 'Seabank', subtitle: 'Tabungan & Usaha', emoji: '🧡', theme: 'seabank' },
  { name: 'GoPay', subtitle: 'E-Wallet Harian', emoji: '🛵', theme: 'gopay' },
  { name: 'DANA', subtitle: 'Dompet Digital', emoji: '💙', theme: 'lavender' },
  { name: 'Cash / Tunai', subtitle: 'Uang Tunai', emoji: '💵', theme: 'mint' },
];

const THEME_OPTIONS: { id: WalletTheme; label: string }[] = [
  { id: 'mandiri', label: 'Mandiri Splash' },
  { id: 'blubca', label: 'Blu Toska' },
  { id: 'seabank', label: 'Seabank Oranye' },
  { id: 'gopay', label: 'GoPay Biru' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'pink', label: 'Pastel Pink' },
  { id: 'mint', label: 'Mint Segar' },
  { id: 'gold', label: 'Emas' },
];

const EMOJI_CHOICES = ['🏦', '💎', '🧡', '🛵', '💙', '💵', '👛', '🌸'];

export function AssetSheetModal({
  open,
  onClose,
  state,
  onOpenTransfer,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onReorderWallet,
  onSelectWalletQuickTx,
}: AssetSheetModalProps) {
  const lang = state.settings.language;
  const [reorderMode, setReorderMode] = useState(false);
  const [formMode, setFormMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [emoji, setEmoji] = useState('👛');
  const [balanceStr, setBalanceStr] = useState('0');
  const [theme, setTheme] = useState<WalletTheme>('lavender');

  if (!open) return null;

  const sortedWallets = [...state.wallets].sort((a, b) => a.order - b.order);
  const totalWalletBalance = sortedWallets.reduce((s, w) => s + w.balance, 0);

  const startAdd = () => {
    setFormMode('add');
    setEditingWallet(null);
    setName('');
    setSubtitle('Dompet Reguler');
    setEmoji('👛');
    setBalanceStr('0');
    setTheme('lavender');
  };

  const applyPreset = (preset: (typeof PRESET_WALLETS)[number]) => {
    setFormMode('add');
    setEditingWallet(null);
    setName(preset.name);
    setSubtitle(preset.subtitle);
    setEmoji(preset.emoji);
    setTheme(preset.theme);
  };

  const startEdit = (w: Wallet) => {
    setFormMode('edit');
    setEditingWallet(w);
    setName(w.name);
    setSubtitle(w.subtitle);
    setEmoji(w.emoji);
    setBalanceStr(String(w.balance));
    setTheme(w.theme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numericBalance = Number(balanceStr.replace(/[^\d-]/g, '')) || 0;
    if (!name.trim()) return;

    if (formMode === 'add') {
      onAddWallet({
        name: name.trim(),
        subtitle: subtitle.trim() || 'Rekening / E-Wallet',
        emoji,
        balance: numericBalance,
        theme,
        type: 'regular',
      });
    } else if (formMode === 'edit' && editingWallet) {
      onUpdateWallet(
        editingWallet.id,
        {
          name: name.trim(),
          subtitle: subtitle.trim() || 'Rekening / E-Wallet',
          emoji,
          balance: numericBalance,
          theme,
        },
        true,
      );
    }
    setFormMode('none');
    setEditingWallet(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-purple-100/80 bg-white">
          <div>
            <h2 className="font-display text-lg font-extrabold text-slate-900">
              {lang === 'id' ? '👛 Pilih Aset & Dompet' : '👛 Select Wallet & Assets'}
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {lang === 'id' ? 'Total Saldo Dompet: ' : 'Total Wallet Balance: '}
              <span className="font-extrabold text-purple-700">{formatIDR(totalWalletBalance)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pilih Aset"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startAdd}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-purple-600 text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'id' ? '+ Tambah Aset' : '+ Add Wallet'}</span>
            </button>

            {sortedWallets.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransfer();
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{lang === 'id' ? 'Pindah Saldo' : 'Transfer'}</span>
              </button>
            )}

            {sortedWallets.length >= 2 && (
              <button
                type="button"
                onClick={() => setReorderMode((v) => !v)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition-colors ${
                  reorderMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{reorderMode ? 'Selesai Urutkan' : 'Atur Urutan'}</span>
              </button>
            )}
          </div>

          {/* Add / Edit Wallet Inline Form */}
          {formMode !== 'none' && (
            <form
              onSubmit={handleSave}
              className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-extrabold text-slate-900">
                  {formMode === 'add'
                    ? 'Tambah Dompet / Rekening Baru'
                    : `Penyesuaian & Edit: ${editingWallet?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setFormMode('none')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  Batal
                </button>
              </div>

              {formMode === 'add' && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                    Pilih Cepat Bank / E-Wallet:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_WALLETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold border transition-colors ${
                          name === preset.name
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {preset.emoji} {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Dompet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth: BCA, Jago, OVO, Cash"
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Keterangan</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="cth: Rekening Tabungan"
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {formMode === 'edit' ? 'Saldo Saat Ini (Penyesuaian Otomatis)' : 'Saldo Awal (Rp)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={balanceStr}
                    onChange={(e) => setBalanceStr(e.target.value)}
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm tabular-nums font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tema Kartu</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as WalletTheme)}
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm"
                  >
                    {THEME_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Ikon Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_CHOICES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center border ${
                        emoji === em
                          ? 'bg-purple-100 border-purple-400 scale-105'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {formMode === 'edit' && editingWallet && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteWallet(editingWallet.id);
                      setFormMode('none');
                    }}
                    className="mr-auto min-h-[40px] inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 px-3.5 py-1.5 text-xs font-bold hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Dompet
                  </button>
                )}
                <button
                  type="submit"
                  className="min-h-[40px] rounded-full bg-purple-600 text-white px-5 py-2 text-xs font-bold hover:bg-purple-700"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          )}

          {/* Empty State or 2-Column Wallet Grid */}
          {sortedWallets.length === 0 ? (
            <div className="rounded-3xl bg-white border-2 border-dashed border-purple-200 p-8 text-center space-y-3">
              <p className="text-3xl">👛</p>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                Belum ada dompet atau rekening
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pilih salah satu bank/e-wallet favoritmu atau buat dompet kustom dengan saldo awalmu.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {PRESET_WALLETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-full bg-purple-50 border border-purple-200 px-3.5 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                  >
                    {preset.emoji} {preset.name}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startAdd}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2 text-xs font-extrabold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Dompet Pertamamu</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {sortedWallets.map((w, idx) => {
                const style = WALLET_THEME_STYLES[w.theme] || WALLET_THEME_STYLES.lavender;
                return (
                  <div
                    key={w.id}
                    className={`glossy-sheen rounded-3xl p-4 shadow-md ${style.cardBg} ${style.text} flex flex-col justify-between gap-3`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/25 text-lg">
                          {w.emoji}
                        </span>
                        <h4 className="mt-2 font-display text-base font-extrabold truncate">{w.name}</h4>
                        <p className="text-xs opacity-85 truncate">{w.subtitle}</p>
                      </div>

                      {reorderMode ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onReorderWallet(w.id, 'up')}
                            className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedWallets.length - 1}
                            onClick={() => onReorderWallet(w.id, 'down')}
                            className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(w)}
                          aria-label={`Edit saldo ${w.name}`}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-1">
                      <p className="font-display text-lg font-extrabold tabular-nums">
                        {formatIDR(w.balance)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectWalletQuickTx(w.id, 'expense');
                          }}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.accentPill}`}
                        >
                          ↘ Keluar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectWalletQuickTx(w.id, 'income');
                          }}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.accentPill}`}
                        >
                          ↗ Masuk
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
