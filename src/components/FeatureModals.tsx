import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  AppState,
  BudgetDream,
  Category,
  InvestmentHolding,
} from '../types/finance';
import { formatIDR } from '../utils/formatters';

interface FeatureModalsProps {
  activeModal: 'categories' | 'budgets' | 'investments' | null;
  onClose: () => void;
  state: AppState;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onAddBudgetDream: (item: Omit<BudgetDream, 'id'>) => void;
  onUpdateBudgetDream: (item: BudgetDream) => void;
  onDeleteBudgetDream: (id: string) => void;
  onAddInvestment: (inv: Omit<InvestmentHolding, 'id'>) => void;
  onUpdateInvestment: (inv: InvestmentHolding) => void;
  onDeleteInvestment: (id: string) => void;
}

const CUSTOM_EMOJIS = ['🧁', '🎮', '🐾', '✈️', '📚', '💄', '🏋️', '🎁', '🧋', '🚗'];
const COLOR_PRESETS = [
  { color: '#9333EA', bgColor: '#F3E8FF', label: 'Lavender' },
  { color: '#DB2777', bgColor: '#FCE7F3', label: 'Pink' },
  { color: '#059669', bgColor: '#D1FAE5', label: 'Mint' },
  { color: '#0284C7', bgColor: '#E0F2FE', label: 'Sky' },
  { color: '#EA580C', bgColor: '#FFEDD5', label: 'Peach' },
];

export function FeatureModals({
  activeModal,
  onClose,
  state,
  onAddCategory,
  onDeleteCategory,
  onAddBudgetDream,
  onUpdateBudgetDream,
  onDeleteBudgetDream,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}: FeatureModalsProps) {
  // Categories state
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🧁');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catPaletteIdx, setCatPaletteIdx] = useState(0);

  // Budgets & Dreams state
  const [bdKind, setBdKind] = useState<'budget' | 'dream'>('dream');
  const [bdTitle, setBdTitle] = useState('');
  const [bdEmoji, setBdEmoji] = useState('🌸');
  const [bdTarget, setBdTarget] = useState('');
  const [bdCurrent, setBdCurrent] = useState('');
  const [bdCatId, setBdCatId] = useState('cat_food');

  // Investment state
  const [invName, setInvName] = useState('');
  const [invPlatform, setInvPlatform] = useState('');
  const [invCat, setInvCat] = useState<InvestmentHolding['category']>('Reksa Dana');
  const [invInvested, setInvInvested] = useState('');
  const [invCurrent, setInvCurrent] = useState('');

  if (!activeModal) return null;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthExpenses = state.transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonthPrefix),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-purple-100">
          <h2 className="font-display text-lg font-extrabold text-slate-900">
            {activeModal === 'categories' && '🏷️ Kelola Kategori & Emoji'}
            {activeModal === 'budgets' && '🎯 Budget & Mimpi'}
            {activeModal === 'investments' && '🌱 Portofolio Investasi'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. KELOLA KATEGORI */}
          {activeModal === 'categories' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!catName.trim()) return;
                  const pal = COLOR_PRESETS[catPaletteIdx] || COLOR_PRESETS[0];
                  onAddCategory({
                    name: catName.trim(),
                    nameEn: catName.trim(),
                    emoji: catEmoji,
                    color: pal.color,
                    bgColor: pal.bgColor,
                    type: catType,
                  });
                  setCatName('');
                }}
                className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3"
              >
                <p className="text-xs font-extrabold text-slate-900">+ Tambah Kategori Kustom</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Nama kategori (cth: Skincare, Anabul)"
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs"
                  />
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as 'expense' | 'income')}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold"
                  >
                    <option value="expense">↘ Pengeluaran</option>
                    <option value="income">↗ Pemasukan</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCatEmoji(em)}
                      className={`h-8 w-8 rounded-xl text-base flex items-center justify-center border ${
                        catEmoji === em ? 'bg-purple-100 border-purple-400' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map((p, i) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setCatPaletteIdx(i)}
                        style={{ backgroundColor: p.bgColor, borderColor: p.color }}
                        className={`h-7 w-7 rounded-full border-2 ${
                          catPaletteIdx === i ? 'scale-110 ring-2 ring-purple-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="min-h-[38px] rounded-full bg-purple-600 text-white px-4 text-xs font-bold"
                  >
                    Tambah Kategori
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {state.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: cat.bgColor }}
                      >
                        {cat.emoji}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {cat.type === 'income' ? 'Pemasukan' : cat.type === 'expense' ? 'Pengeluaran' : 'Umum'}
                        </p>
                      </div>
                    </div>
                    {!['cat_adjust', 'cat_transfer'].includes(cat.id) && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-2 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 2. BUDGET & MIMPI */}
          {activeModal === 'budgets' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bdTitle.trim() || !Number(bdTarget)) return;
                  onAddBudgetDream({
                    kind: bdKind,
                    title: bdTitle.trim(),
                    emoji: bdEmoji || '🌸',
                    targetAmount: Number(bdTarget),
                    currentAmount: Number(bdCurrent) || 0,
                    categoryId: bdKind === 'budget' ? bdCatId : undefined,
                    color: bdKind === 'budget' ? '#F472B6' : '#34D399',
                  });
                  setBdTitle('');
                  setBdTarget('');
                  setBdCurrent('');
                }}
                className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBdKind('dream')}
                    className={`min-h-[38px] rounded-2xl text-xs font-bold border ${
                      bdKind === 'dream'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🌸 Target Mimpi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBdKind('budget')}
                    className={`min-h-[38px] rounded-2xl text-xs font-bold border ${
                      bdKind === 'budget'
                        ? 'bg-pink-50 border-pink-400 text-pink-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    💸 Limit Budget
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={bdEmoji}
                    onChange={(e) => setBdEmoji(e.target.value)}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 text-center text-base"
                  />
                  <input
                    type="text"
                    required
                    value={bdTitle}
                    onChange={(e) => setBdTitle(e.target.value)}
                    placeholder={bdKind === 'dream' ? 'cth: Beli iPad, Dana Darurat' : 'cth: Budget Nongkrong'}
                    className="col-span-3 h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    value={bdTarget}
                    onChange={(e) => setBdTarget(e.target.value)}
                    placeholder={bdKind === 'dream' ? 'Target (Rp)' : 'Limit Bulanan (Rp)'}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold tabular-nums"
                  />
                  {bdKind === 'dream' ? (
                    <input
                      type="number"
                      value={bdCurrent}
                      onChange={(e) => setBdCurrent(e.target.value)}
                      placeholder="Terkumpul Awal (Rp)"
                      className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold tabular-nums"
                    />
                  ) : (
                    <select
                      value={bdCatId}
                      onChange={(e) => setBdCatId(e.target.value)}
                      className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs"
                    >
                      {state.categories
                        .filter((c) => c.type === 'expense')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[40px] rounded-full bg-purple-600 text-white text-xs font-bold"
                >
                  Simpan {bdKind === 'dream' ? 'Mimpi' : 'Budget'}
                </button>
              </form>

              <div className="space-y-3">
                {state.budgetsAndDreams.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-5 text-center text-xs text-slate-500">
                    Belum ada target mimpi atau limit budget. Tambahkan yang pertama di atas! ✨
                  </div>
                ) : (
                  state.budgetsAndDreams.map((item) => {
                    const current =
                      item.kind === 'budget' && item.categoryId
                        ? monthExpenses
                            .filter((t) => t.categoryId === item.categoryId)
                            .reduce((s, t) => s + t.amount, 0)
                        : item.currentAmount;
                    const pct = Math.min(100, Math.round((current / Math.max(1, item.targetAmount)) * 100));
                    return (
                      <div key={item.id} className="rounded-3xl bg-white border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-slate-900">
                            {item.emoji} {item.title}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {item.kind === 'dream' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateBudgetDream({
                                    ...item,
                                    currentAmount: item.currentAmount + 100000,
                                  })
                                }
                                className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-bold"
                              >
                                +100rb
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteBudgetDream(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                          <span>{formatIDR(current)}</span>
                          <span>
                            {pct}% dari {formatIDR(item.targetAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* 3. INVESTASI */}
          {activeModal === 'investments' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!invName.trim() || !Number(invCurrent)) return;
                  onAddInvestment({
                    name: invName.trim(),
                    platform: invPlatform.trim() || 'Bibit',
                    emoji: invCat === 'Emas Digital' ? '🪙' : invCat === 'Saham / ETF' ? '📈' : '🌱',
                    category: invCat,
                    investedAmount: Number(invInvested) || Number(invCurrent),
                    currentValue: Number(invCurrent),
                  });
                  setInvName('');
                  setInvPlatform('');
                  setInvInvested('');
                  setInvCurrent('');
                }}
                className="rounded-3xl bg-white border border-emerald-200 p-4 space-y-3"
              >
                <p className="text-xs font-extrabold text-emerald-950">+ Tambah Instrumen Investasi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    placeholder="Nama Produk (cth: RDPU Sucor)"
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs"
                  />
                  <input
                    type="text"
                    value={invPlatform}
                    onChange={(e) => setInvPlatform(e.target.value)}
                    placeholder="Platform (cth: Bibit, Stockbit)"
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs"
                  />
                  <select
                    value={invCat}
                    onChange={(e) => setInvCat(e.target.value as InvestmentHolding['category'])}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold"
                  >
                    <option value="Reksa Dana">🌱 Reksa Dana</option>
                    <option value="Saham / ETF">📈 Saham / ETF</option>
                    <option value="Emas Digital">🪙 Emas Digital</option>
                    <option value="Deposito">🏦 Deposito</option>
                  </select>
                  <input
                    type="number"
                    value={invInvested}
                    onChange={(e) => setInvInvested(e.target.value)}
                    placeholder="Modal Awal (Rp)"
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold tabular-nums"
                  />
                </div>
                <input
                  type="number"
                  required
                  value={invCurrent}
                  onChange={(e) => setInvCurrent(e.target.value)}
                  placeholder="Nilai Pasar Saat Ini (Rp)"
                  className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold tabular-nums"
                />
                <button
                  type="submit"
                  className="w-full min-h-[40px] rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Investasi
                </button>
              </form>

              <div className="space-y-2.5">
                {state.investments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center text-xs text-slate-500">
                    Belum ada instrumen investasi. Yuk catat portofolio pertamamu di atas! 🌱
                  </div>
                ) : (
                  state.investments.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-3xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {inv.emoji} {inv.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {inv.platform} · {inv.category}
                        </p>
                        <p className="text-xs font-bold text-emerald-700 mt-1 tabular-nums">
                          {formatIDR(inv.currentValue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateInvestment({
                              ...inv,
                              investedAmount: inv.investedAmount + 250000,
                              currentValue: inv.currentValue + 250000,
                            })
                          }
                          className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-[11px] font-bold"
                        >
                          +250rb
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvestment(inv.id)}
                          className="p-2 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
