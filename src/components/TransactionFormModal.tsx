import { Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppState, Transaction, TransactionScope, TransactionType } from '../types/finance';
import { formatIDR, getTodayYMD } from '../utils/formatters';

export interface ReceiptExtractedItem {
  name: string;
  qty: number;
  price: number;
}

export interface TxPrefill {
  type?: TransactionType;
  scope?: TransactionScope;
  walletId?: string;
  toWalletId?: string;
  categoryId?: string;
  title?: string;
  amount?: number;
  date?: string;
  time?: string;
  notes?: string;
  extractedItems?: ReceiptExtractedItem[];
  extractedByAi?: boolean;
}

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  state: AppState;
  editingTx: Transaction | null;
  prefill: TxPrefill | null;
  onSaveNew: (tx: Omit<Transaction, 'id'>) => unknown;
  onSaveEdit: (tx: Transaction) => unknown;
  onOpenCreateWallet?: () => void;
}

export function TransactionFormModal({
  open,
  onClose,
  state,
  editingTx,
  prefill,
  onSaveNew,
  onSaveEdit,
  onOpenCreateWallet,
}: TransactionFormModalProps) {
  const lang = state.settings.language;

  const [type, setType] = useState<TransactionType>('expense');
  const [scope, setScope] = useState<TransactionScope>('personal');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(state.wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(state.wallets[1]?.id || state.wallets[0]?.id || '');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [date, setDate] = useState(getTodayYMD);
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingTx) {
      setType(editingTx.type);
      setScope(editingTx.scope);
      setTitle(editingTx.title);
      setAmount(String(editingTx.amount));
      setWalletId(editingTx.walletId);
      setToWalletId(editingTx.toWalletId || state.wallets[1]?.id || state.wallets[0]?.id || '');
      setCategoryId(editingTx.categoryId);
      setDate(editingTx.date);
      setTime(editingTx.time);
      setNotes(editingTx.notes || '');
      return;
    }

    const nextType = prefill?.type || 'expense';
    const fallbackWalletId = prefill?.walletId || state.wallets[0]?.id || '';
    setType(nextType);
    setScope(prefill?.scope || 'personal');
    setTitle(prefill?.title || '');
    setAmount(prefill?.amount ? String(prefill.amount) : '');
    setWalletId(fallbackWalletId);
    setToWalletId(
      prefill?.toWalletId ||
        state.wallets.find((w) => w.id !== fallbackWalletId)?.id ||
        state.wallets[0]?.id ||
        '',
    );
    setCategoryId(
      prefill?.categoryId ||
        (nextType === 'income' ? 'cat_salary' : nextType === 'transfer' ? 'cat_transfer' : 'cat_food'),
    );
    setDate(prefill?.date || getTodayYMD());
    setTime(prefill?.time && prefill.time.length === 5 ? prefill.time : defaultTime);
    setNotes(prefill?.notes || '');
  }, [editingTx, open, prefill, state.wallets]);

  if (!open) return null;

  const hasWallets = state.wallets.length > 0;

  const visibleCategories = state.categories.filter((c) => {
    if (type === 'transfer') return c.id === 'cat_transfer';
    return c.type === 'both' || c.type === type;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWallets || !walletId) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    if (type === 'transfer' && walletId === toWalletId) return;

    const normalizedTime = time.trim().slice(0, 5).padEnd(5, '0');
    const finalTitle =
      title.trim() ||
      (type === 'transfer'
        ? 'Pindah Saldo Antar Dompet'
        : state.categories.find((c) => c.id === categoryId)?.name || 'Transaksi');

    const payload: Omit<Transaction, 'id'> = {
      type,
      scope,
      businessKind: scope === 'business' ? (type === 'income' ? 'revenue' : 'cogs') : undefined,
      title: finalTitle,
      amount: numericAmount,
      date,
      time: normalizedTime,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      categoryId: type === 'transfer' ? 'cat_transfer' : categoryId,
      notes: notes.trim() || undefined,
    };

    if (editingTx) {
      await onSaveEdit({ ...payload, id: editingTx.id });
    } else {
      await onSaveNew(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-purple-100">
          <h2 className="font-display text-lg font-extrabold text-slate-900">
            {editingTx
              ? lang === 'id'
                ? '✏️ Edit Transaksi'
                : '✏️ Edit Transaction'
              : lang === 'id'
                ? '✨ Catat Transaksi'
                : '✨ New Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form transaksi"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasWallets && (
            <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 space-y-2.5">
              <p className="text-xs font-extrabold text-amber-900">
                👛 Kamu belum punya dompet / rekening
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Buat dompet pertamamu terlebih dahulu sebelum mencatat pemasukan atau pengeluaran.
              </p>
              {onOpenCreateWallet && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateWallet();
                  }}
                  className="min-h-[36px] rounded-full bg-amber-600 text-white px-4 py-1.5 text-xs font-bold hover:bg-amber-700"
                >
                  + Tambah Dompet Pertamamu
                </button>
              )}
            </div>
          )}

          {/* AI Receipt Extraction Summary Card */}
          {!editingTx && prefill?.extractedByAi && (
            <div className="rounded-3xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 border border-purple-200 p-3.5 space-y-2">
              <p className="text-xs font-extrabold text-purple-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Hasil Scan Struk Belanja
              </p>
              {prefill.extractedItems && prefill.extractedItems.length > 0 && (
                <div className="rounded-2xl bg-white/80 border border-purple-100 p-2.5 space-y-1">
                  {prefill.extractedItems.map((it, idx) => (
                    <div key={`${it.name}-${idx}`} className="flex items-center justify-between text-[11px] text-slate-700 tabular-nums">
                      <span className="truncate pr-2">
                        {it.qty}x {it.name}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">{formatIDR(it.price)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-purple-700">
                Periksa nama toko, total, dan kategori di bawah lalu klik Simpan.
              </p>
            </div>
          )}

          {/* Type Switch */}
          <div className="grid grid-cols-3 gap-1.5 rounded-full bg-slate-100 p-1">
            {(
              [
                { id: 'expense', label: '↘ Pengeluaran' },
                { id: 'income', label: '↗ Pemasukan' },
                { id: 'transfer', label: '⇄ Pindah Saldo' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setType(item.id);
                  if (item.id === 'income') setCategoryId('cat_salary');
                  else if (item.id === 'expense') setCategoryId('cat_food');
                  else setCategoryId('cat_transfer');
                }}
                className={`min-h-[38px] rounded-full text-xs font-bold transition-all ${
                  type === item.id
                    ? item.id === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : item.id === 'income'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Scope Switch (Pribadi vs Bisnis) */}
          {type !== 'transfer' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScope('personal')}
                className={`flex-1 min-h-[38px] rounded-2xl text-xs font-bold border ${
                  scope === 'personal'
                    ? 'bg-purple-50 border-purple-400 text-purple-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                👤 Keuangan Pribadi
              </button>
              <button
                type="button"
                onClick={() => setScope('business')}
                className={`flex-1 min-h-[38px] rounded-2xl text-xs font-bold border ${
                  scope === 'business'
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                🏪 Pencatatan Bisnis
              </button>
            </div>
          )}

          {/* Amount */}
          <div className="rounded-3xl bg-white border border-purple-200 p-4">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Nominal (Rupiah)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold text-purple-600">Rp</span>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full font-display text-2xl font-extrabold text-slate-900 tabular-nums focus:outline-none"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[25000, 50000, 100000, 250000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String((Number(amount) || 0) + preset))}
                  className="rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1 text-[11px] font-bold tabular-nums"
                >
                  +{(preset / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Judul / Merchant
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'transfer'
                  ? 'cth: Top Up GoPay dari Mandiri'
                  : 'cth: Kopi Susu, Belanja Indomaret, Omzet Klien'
              }
              className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-3.5 text-sm"
            />
          </div>

          {/* Wallet Selection */}
          <div className={`grid gap-3 ${type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-3 text-sm font-semibold"
              >
                {state.wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.emoji} {w.name}
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ke Dompet
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-white border border-slate-200 px-3 text-sm font-semibold"
                >
                  {state.wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.emoji} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {type === 'transfer' && walletId === toWalletId && (
            <p className="text-xs text-rose-600 font-semibold">
              Pilih dompet tujuan yang berbeda untuk Pindah Saldo.
            </p>
          )}

          {/* Category Picker */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Kategori
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`min-h-[42px] flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold border transition-all text-left ${
                      categoryId === cat.id
                        ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{lang === 'id' ? cat.name : cat.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 rounded-2xl bg-white border border-slate-200 px-3 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 rounded-2xl bg-white border border-slate-200 px-3 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail item atau memo..."
              className="w-full h-10 rounded-2xl bg-white border border-slate-200 px-3 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={!hasWallets}
            className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white text-sm font-extrabold shadow-lg hover:opacity-95 disabled:opacity-45 transition-opacity"
          >
            {!hasWallets
              ? 'Tambahkan Dompet Dulu'
              : editingTx
                ? 'Simpan Perubahan'
                : 'Simpan Transaksi ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}
