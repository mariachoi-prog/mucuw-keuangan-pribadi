import {
  ArrowDownLeft,
  ArrowUpRight,
  ImagePlus,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { WIDGET_AESTHETIC_BG_SRC } from '../data/initialData';
import {
  AppState,
  PosOrder,
  PosProduct,
  Transaction,
  WidgetConfig,
  WidgetGradientKey,
} from '../types/finance';
import {
  formatCompactIDR,
  formatIDR,
  getTodayYMD,
  WALLET_THEME_STYLES,
  WIDGET_GRADIENTS,
} from '../utils/formatters';

interface CenterActionSheetProps {
  open: boolean;
  initialTab: 'quick' | 'business' | 'widget';
  onClose: () => void;
  state: AppState;
  onOpenAssetSheet: () => void;
  onOpenTransfer: () => void;
  onOpenCategoriesModal: () => void;
  onOpenBudgetsModal: () => void;
  onOpenInvestmentsModal: () => void;
  onQuickTxFromWallet: (walletId: string, type: 'expense' | 'income', presetCatId?: string) => void;
  onAddBusinessTx: (tx: Omit<Transaction, 'id'>) => unknown;
  onAddPosProduct: (prod: Omit<PosProduct, 'id'>) => unknown;
  onDeletePosProduct: (id: string) => unknown;
  onCheckoutPos: (order: Omit<PosOrder, 'id' | 'orderNumber'>) => Promise<PosOrder> | PosOrder;
  onUpdateWidgetConfig: (patch: Partial<WidgetConfig>) => unknown;
}

export function CenterActionSheet({
  open,
  initialTab,
  onClose,
  state,
  onOpenAssetSheet,
  onOpenTransfer,
  onOpenCategoriesModal,
  onOpenBudgetsModal,
  onOpenInvestmentsModal,
  onQuickTxFromWallet,
  onAddBusinessTx,
  onAddPosProduct,
  onDeletePosProduct,
  onCheckoutPos,
  onUpdateWidgetConfig,
}: CenterActionSheetProps) {
  const [tab, setTab] = useState<'quick' | 'business' | 'widget'>(initialTab);
  const lang = state.settings.language;

  // Business POS state
  const [bizSubMode, setBizSubMode] = useState<'pos' | 'form'>('pos');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posWalletId, setPosWalletId] = useState(state.wallets[0]?.id || '');
  const [posDiscount, setPosDiscount] = useState('0');
  const [lastPosReceipt, setLastPosReceipt] = useState<PosOrder | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdEmoji, setNewProdEmoji] = useState('🧁');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCogs, setNewProdCogs] = useState('');

  // Business manual form state
  const [bizKind, setBizKind] = useState<'revenue' | 'cogs'>('revenue');
  const [bizTitle, setBizTitle] = useState('');
  const [bizAmount, setBizAmount] = useState('');
  const [bizWalletId, setBizWalletId] = useState(state.wallets[0]?.id || '');
  const [bizSavedMsg, setBizSavedMsg] = useState<string | null>(null);

  const sortedWallets = [...state.wallets].sort((a, b) => a.order - b.order);

  // Keep synced with initialTab and available wallets when opening
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (sortedWallets.length === 0) {
      setPosWalletId('');
      setBizWalletId('');
      return;
    }
    if (!sortedWallets.some((w) => w.id === posWalletId)) {
      setPosWalletId(sortedWallets[0].id);
    }
    if (!sortedWallets.some((w) => w.id === bizWalletId)) {
      setBizWalletId(sortedWallets[0].id);
    }
  }, [bizWalletId, posWalletId, sortedWallets]);

  // Business Metrics (separated from personal)
  const bizMetrics = useMemo(() => {
    const curMonth = getTodayYMD().slice(0, 7);
    let revenue = 0;
    let cogs = 0;
    let personalExpense = 0;
    state.transactions.forEach((tx) => {
      if (!tx.date.startsWith(curMonth)) return;
      if (tx.scope === 'business') {
        if (tx.type === 'income') revenue += tx.amount;
        if (tx.type === 'expense') cogs += tx.amount;
      } else if (tx.scope === 'personal' && tx.type === 'expense') {
        personalExpense += tx.amount;
      }
    });
    return { revenue, cogs, profit: revenue - cogs, personalExpense };
  }, [state.transactions]);

  // POS Cart Totals
  const cartItems = state.posProducts
    .filter((p) => (cart[p.id] || 0) > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      emoji: p.emoji,
      qty: cart[p.id] || 0,
      price: p.price,
      cogs: p.cogs,
    }));

  const posSubtotal = cartItems.reduce((s, item) => s + item.price * item.qty, 0);
  const posCogsTotal = cartItems.reduce((s, item) => s + item.cogs * item.qty, 0);
  const posDiscountNum = Math.max(0, Number(posDiscount) || 0);
  const posTotal = Math.max(0, posSubtotal - posDiscountNum);
  const posProfit = posTotal - posCogsTotal;

  // Widget Live Preview calculation
  const widgetData = useMemo(() => {
    const cfg = state.widgetConfig;
    const today = getTodayYMD();
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoYMD = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(
      weekAgo.getDate(),
    ).padStart(2, '0')}`;
    const monthPrefix = today.slice(0, 7);

    const matchingExpenses = state.transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (cfg.walletId !== 'all' && tx.walletId !== cfg.walletId) return false;
      if (cfg.categoryId !== 'all' && tx.categoryId !== cfg.categoryId) return false;
      if (cfg.period === 'today') return tx.date === today;
      if (cfg.period === 'week') return tx.date >= weekAgoYMD && tx.date <= today;
      return tx.date.startsWith(monthPrefix);
    });

    const totalSpent = matchingExpenses.reduce((s, tx) => s + tx.amount, 0);
    const remainingBudget = cfg.budgetLimit - totalSpent;
    const usedPct = Math.min(100, Math.round((totalSpent / Math.max(1, cfg.budgetLimit)) * 100));

    const periodLabel =
      cfg.period === 'today' ? 'Hari ini' : cfg.period === 'week' ? 'Minggu ini' : 'Bulan ini';
    const catName =
      cfg.categoryId === 'all'
        ? 'Semua Kategori'
        : state.categories.find((c) => c.id === cfg.categoryId)?.name || 'Kategori';
    const walletName =
      cfg.walletId === 'all'
        ? 'Semua Dompet'
        : state.wallets.find((w) => w.id === cfg.walletId)?.name || 'Dompet';

    return { totalSpent, remainingBudget, usedPct, periodLabel, catName, walletName };
  }, [state.categories, state.transactions, state.wallets, state.widgetConfig]);

  if (!open) return null;

  const handleCheckoutPos = async () => {
    if (cartItems.length === 0 || !posWalletId) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const order = await onCheckoutPos({
      date: getTodayYMD(),
      time,
      walletId: posWalletId,
      items: cartItems.map(({ productId, name, qty, price, cogs }) => ({
        productId,
        name,
        qty,
        price,
        cogs,
      })),
      subtotal: posSubtotal,
      discount: posDiscountNum,
      total: posTotal,
      estimatedProfit: posProfit,
    });
    setLastPosReceipt(order);
    setCart({});
    setPosDiscount('0');
  };

  const handleSaveBizForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(bizAmount);
    if (!bizTitle.trim() || !amountNum || !bizWalletId) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await onAddBusinessTx({
      type: bizKind === 'revenue' ? 'income' : 'expense',
      scope: 'business',
      businessKind: bizKind,
      title: bizTitle.trim(),
      amount: amountNum,
      date: getTodayYMD(),
      time,
      walletId: bizWalletId,
      categoryId: bizKind === 'revenue' ? 'cat_biz_revenue' : 'cat_biz_cogs',
      notes: bizKind === 'revenue' ? 'Pendapatan Jasa / Produk' : 'Modal / HPP Usaha',
    });
    setBizTitle('');
    setBizAmount('');
    setBizSavedMsg(
      bizKind === 'revenue'
        ? 'Omzet usaha berhasil dicatat terpisah!'
        : 'Modal / HPP berhasil dicatat!',
    );
    setTimeout(() => setBizSavedMsg(null), 2600);
  };

  const handleUploadWidgetPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const maxSide = 360;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          onUpdateWidgetConfig({
            backgroundType: 'custom_photo',
            customPhotoDataUrl: compressed,
          });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const widgetCfg = state.widgetConfig;
  const widgetBgStyle =
    widgetCfg.backgroundType === 'custom_photo' && widgetCfg.customPhotoDataUrl
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.28) 0%, rgba(15,23,42,0.68) 100%), url(${widgetCfg.customPhotoDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : widgetCfg.backgroundType === 'preset_photo'
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(30,27,75,0.18) 0%, rgba(30,27,75,0.62) 100%), url(${WIDGET_AESTHETIC_BG_SRC})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-purple-100/70">
          <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 p-1">
            {(
              [
                { id: 'quick', label: '⚡ Quick Actions' },
                { id: 'business', label: '🏪 Bisnis' },
                { id: 'widget', label: '📱 Widget' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm'
                    : 'text-purple-800 hover:bg-purple-100/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'quick' && (
            <div className="space-y-5">
              {/* Top Quick Pills */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2.5">
                  {lang === 'id' ? 'Pintasan Cepat' : 'Quick Shortcuts'}
                </p>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                    {
                      label: '👛 Lihat Aset',
                      onClick: () => {
                        onClose();
                        onOpenAssetSheet();
                      },
                    },
                    {
                      label: '⇄ Pindah Saldo',
                      onClick: () => {
                        onClose();
                        onOpenTransfer();
                      },
                    },
                    {
                      label: '🏷️ Kelola Kategori',
                      onClick: () => {
                        onClose();
                        onOpenCategoriesModal();
                      },
                    },
                    {
                      label: '🎯 Budget & Mimpi',
                      onClick: () => {
                        onClose();
                        onOpenBudgetsModal();
                      },
                    },
                    {
                      label: '🌱 Investasi',
                      onClick: () => {
                        onClose();
                        onOpenInvestmentsModal();
                      },
                    },
                  ].map((pill) => (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={pill.onClick}
                      className="min-h-[40px] rounded-full bg-white border border-purple-200/80 px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-purple-50 hover:border-purple-300 transition-all whitespace-nowrap shrink-0"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Swipeable Wallet Card Carousel */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-slate-500">
                    {lang === 'id'
                      ? 'Geser Kartu Dompet · Catat Langsung'
                      : 'Swipe Wallet Cards · Log Instantly'}
                  </p>
                  {sortedWallets.length > 0 && (
                    <span className="text-[11px] font-semibold text-purple-600">← Geser →</span>
                  )}
                </div>

                {sortedWallets.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/50 p-6 text-center space-y-3">
                    <p className="text-3xl">👛</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {lang === 'id'
                        ? 'Kamu belum memiliki dompet. Buat dompet pertamamu untuk mencatat pemasukan & pengeluaran.'
                        : 'You have no wallets yet. Create your first wallet to log transactions.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAssetSheet();
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2 text-xs font-extrabold shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Dompet Pertamamu</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
                    {sortedWallets.map((w) => {
                      const style = WALLET_THEME_STYLES[w.theme] || WALLET_THEME_STYLES.lavender;
                      return (
                        <div
                          key={w.id}
                          className={`snap-center shrink-0 w-[82%] sm:w-[320px] glossy-sheen rounded-3xl p-5 shadow-lg ${style.cardBg} ${style.text} flex flex-col justify-between min-h-[196px]`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25 text-xl">
                                {w.emoji}
                              </span>
                              <h3 className="mt-2.5 font-display text-lg font-extrabold">{w.name}</h3>
                              <p className="text-xs opacity-85">{w.subtitle}</p>
                            </div>
                            <p className="font-display text-base font-extrabold tabular-nums">
                              {formatCompactIDR(w.balance)}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onQuickTxFromWallet(w.id, 'expense');
                              }}
                              className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-rose-600 px-3 py-2 text-xs font-extrabold shadow-sm hover:scale-[1.02] transition-transform"
                            >
                              <ArrowDownLeft className="w-4 h-4" />
                              <span>Pengeluaran</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onQuickTxFromWallet(w.id, 'income');
                              }}
                              className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-full bg-white/25 text-white border border-white/40 px-3 py-2 text-xs font-extrabold hover:bg-white/35 transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              <span>Pemasukan</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'business' && (
            <div className="space-y-4">
              {/* Auto Separation Banner */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3">
                  <p className="text-[11px] font-semibold text-purple-700">🏪 Omzet Usaha</p>
                  <p className="mt-1 text-sm font-extrabold text-purple-950 tabular-nums">
                    {formatCompactIDR(bizMetrics.revenue)}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3">
                  <p className="text-[11px] font-semibold text-rose-700">📦 Modal / HPP</p>
                  <p className="mt-1 text-sm font-extrabold text-rose-950 tabular-nums">
                    {formatCompactIDR(bizMetrics.cogs)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[11px] font-semibold text-emerald-700">✨ Laba Usaha</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-950 tabular-nums">
                    {formatCompactIDR(bizMetrics.profit)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Terpisah otomatis dari Pengeluaran Pribadi bulan ini ({formatIDR(bizMetrics.personalExpense)}).
              </p>

              {/* POS vs Manual Business Entry Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBizSubMode('pos')}
                  className={`flex-1 min-h-[40px] rounded-full text-xs font-bold border transition-colors ${
                    bizSubMode === 'pos'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" />
                  Kasir POS Cepat
                </button>
                <button
                  type="button"
                  onClick={() => setBizSubMode('form')}
                  className={`flex-1 min-h-[40px] rounded-full text-xs font-bold border transition-colors ${
                    bizSubMode === 'form'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 inline mr-1.5" />
                  Catat Modal / Jasa
                </button>
              </div>

              {bizSubMode === 'pos' ? (
                <div className="space-y-4">
                  {/* Product Catalog Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-extrabold text-slate-900">
                      Katalog Produk / Layanan POS
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct((v) => !v)}
                      className="text-xs font-bold text-purple-600 hover:underline"
                    >
                      {showAddProduct ? 'Tutup' : '+ Tambah Produk'}
                    </button>
                  </div>

                  {showAddProduct && (
                    <div className="rounded-2xl bg-purple-50/60 border border-purple-200 p-3.5 space-y-2.5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={newProdEmoji}
                          onChange={(e) => setNewProdEmoji(e.target.value)}
                          placeholder="Emoji"
                          className="h-9 rounded-xl bg-white border border-purple-200 px-2.5 text-sm text-center"
                        />
                        <input
                          type="text"
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          placeholder="Nama Produk"
                          className="h-9 rounded-xl bg-white border border-purple-200 px-2.5 text-xs col-span-1 sm:col-span-3"
                        />
                        <input
                          type="number"
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          placeholder="Harga Jual (Rp)"
                          className="h-9 rounded-xl bg-white border border-purple-200 px-2.5 text-xs col-span-1 sm:col-span-2"
                        />
                        <input
                          type="number"
                          value={newProdCogs}
                          onChange={(e) => setNewProdCogs(e.target.value)}
                          placeholder="Modal/HPP (Rp)"
                          className="h-9 rounded-xl bg-white border border-purple-200 px-2.5 text-xs col-span-1 sm:col-span-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newProdName.trim() || !Number(newProdPrice)) return;
                          onAddPosProduct({
                            name: newProdName.trim(),
                            emoji: newProdEmoji || '🧁',
                            price: Number(newProdPrice),
                            cogs: Number(newProdCogs) || 0,
                            categoryLabel: 'Produk',
                          });
                          setNewProdName('');
                          setNewProdPrice('');
                          setNewProdCogs('');
                          setShowAddProduct(false);
                        }}
                        className="w-full h-9 rounded-full bg-purple-600 text-white text-xs font-bold"
                      >
                        Simpan ke Katalog POS
                      </button>
                    </div>
                  )}

                  {/* Product Grid */}
                  {state.posProducts.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/40 p-5 text-center space-y-2.5">
                      <p className="text-2xl">🛍️</p>
                      <p className="text-xs font-semibold text-slate-600">
                        Katalog POS masih kosong. Tambahkan produk atau jasa pertamamu untuk mulai berjualan.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-600 text-white px-4 py-1.5 text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Produk Pertama</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {state.posProducts.map((prod) => {
                        const qty = cart[prod.id] || 0;
                        return (
                          <div
                            key={prod.id}
                            className={`rounded-2xl p-3 border transition-all ${
                              qty > 0
                                ? 'bg-purple-50 border-purple-300 shadow-sm'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setCart((prev) => ({ ...prev, [prod.id]: (prev[prod.id] || 0) + 1 }))
                                }
                                className="text-left flex-1 min-w-0"
                              >
                                <span className="text-xl">{prod.emoji}</span>
                                <p className="mt-1 text-xs font-extrabold text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                <p className="text-xs font-bold text-purple-700 tabular-nums">
                                  {formatIDR(prod.price)}
                                </p>
                              </button>
                              <button
                                type="button"
                                aria-label={`Hapus produk ${prod.name}`}
                                onClick={() => onDeletePosProduct(prod.id)}
                                className="p-1 text-slate-300 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                HPP {formatCompactIDR(prod.cogs)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCart((prev) => ({
                                      ...prev,
                                      [prod.id]: Math.max(0, (prev[prod.id] || 0) - 1),
                                    }))
                                  }
                                  className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-extrabold tabular-nums">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCart((prev) => ({ ...prev, [prod.id]: (prev[prod.id] || 0) + 1 }))
                                  }
                                  className="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ringkasan Struk Pesanan */}
                  <div className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-purple-600" />
                        Ringkasan Struk Pesanan
                      </h4>
                      {sortedWallets.length > 0 ? (
                        <select
                          aria-label="Dompet penerima omzet"
                          value={posWalletId}
                          onChange={(e) => setPosWalletId(e.target.value)}
                          className="h-8 rounded-full bg-purple-50 border border-purple-200 px-3 text-xs font-bold text-purple-800"
                        >
                          {sortedWallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              Masuk ke: {w.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAssetSheet();
                          }}
                          className="h-8 rounded-full bg-amber-100 text-amber-800 px-3 text-[11px] font-bold"
                        >
                          + Buat Dompet Dulu
                        </button>
                      )}
                    </div>

                    {cartItems.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        Tap produk di atas untuk membuat pesanan kasir.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5 border-y border-dashed border-slate-200 py-2.5 text-xs">
                          {cartItems.map((it) => (
                            <div key={it.productId} className="flex justify-between tabular-nums">
                              <span>
                                {it.qty}x {it.name}
                              </span>
                              <span className="font-bold">{formatIDR(it.price * it.qty)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-center text-xs">
                          <label className="text-slate-600 font-semibold">Diskon (Rp)</label>
                          <input
                            type="number"
                            value={posDiscount}
                            onChange={(e) => setPosDiscount(e.target.value)}
                            className="h-8 rounded-xl bg-slate-50 border border-slate-200 px-2.5 text-right tabular-nums font-bold"
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-1">
                          <span>Total Bayar</span>
                          <span className="tabular-nums text-purple-700">{formatIDR(posTotal)}</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold tabular-nums">
                          Estimasi Profit Bersih: +{formatIDR(posProfit)}
                        </p>

                        <button
                          type="button"
                          disabled={!posWalletId}
                          onClick={handleCheckoutPos}
                          className="w-full min-h-[44px] rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-extrabold shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity"
                        >
                          {posWalletId
                            ? `Checkout & Catat Omzet (${formatIDR(posTotal)})`
                            : 'Buat Dompet Dulu untuk Checkout'}
                        </button>
                      </>
                    )}

                    {lastPosReceipt && (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                        ✅ Struk <strong>{lastPosReceipt.orderNumber}</strong> berhasil dicatat sebesar{' '}
                        <strong>{formatIDR(lastPosReceipt.total)}</strong> ke saldo dompet!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Form Pencatatan Transaksi Bisnis (Modal/HPP vs Omzet) */
                <form
                  onSubmit={handleSaveBizForm}
                  className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3.5"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBizKind('revenue')}
                      className={`min-h-[40px] rounded-2xl text-xs font-bold border ${
                        bizKind === 'revenue'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🏪 Pendapatan Jasa / Produk
                    </button>
                    <button
                      type="button"
                      onClick={() => setBizKind('cogs')}
                      className={`min-h-[40px] rounded-2xl text-xs font-bold border ${
                        bizKind === 'cogs'
                          ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      📦 Modal / HPP Usaha
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Keterangan Transaksi Bisnis
                    </label>
                    <input
                      type="text"
                      required
                      value={bizTitle}
                      onChange={(e) => setBizTitle(e.target.value)}
                      placeholder={
                        bizKind === 'revenue'
                          ? 'cth: Pelunasan Desain Logo UMKM'
                          : 'cth: Belanja Biji Kopi & Susu Oat'
                      }
                      className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={bizAmount}
                        onChange={(e) => setBizAmount(e.target.value)}
                        placeholder="250000"
                        className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Dompet</label>
                      {sortedWallets.length > 0 ? (
                        <select
                          value={bizWalletId}
                          onChange={(e) => setBizWalletId(e.target.value)}
                          className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm"
                        >
                          {sortedWallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.emoji} {w.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAssetSheet();
                          }}
                          className="w-full h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 px-3 text-xs font-bold"
                        >
                          + Tambah Dompet Dulu
                        </button>
                      )}
                    </div>
                  </div>

                  {bizSavedMsg && (
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl p-2.5">
                      ✅ {bizSavedMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!bizWalletId}
                    className="w-full min-h-[44px] rounded-full bg-purple-600 text-white text-xs font-extrabold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Simpan Transaksi Bisnis
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === 'widget' && (
            <div className="space-y-5">
              {/* Live iOS Homescreen Widget Preview */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-slate-500 mb-2.5">
                  Live Preview Widget iOS Homescreen
                </p>

                <div
                  style={widgetBgStyle}
                  className={`w-full max-w-[340px] rounded-[30px] p-5 text-white shadow-[0_20px_45px_-12px_rgba(168,85,247,0.4)] relative overflow-hidden ${
                    widgetCfg.backgroundType === 'gradient'
                      ? WIDGET_GRADIENTS[widgetCfg.gradient].className
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-full bg-white/22 backdrop-blur-md px-3 py-1 text-[11px] font-bold">
                      {widgetData.periodLabel} · {widgetData.walletName}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (sortedWallets.length === 0) {
                          onOpenAssetSheet();
                          return;
                        }
                        onQuickTxFromWallet(
                          widgetCfg.walletId === 'all' ? sortedWallets[0].id : widgetCfg.walletId,
                          'expense',
                          widgetCfg.categoryId === 'all' ? undefined : widgetCfg.categoryId,
                        );
                      }}
                      className="min-h-[32px] inline-flex items-center gap-1 rounded-full bg-white text-purple-700 px-3 py-1 text-[11px] font-extrabold shadow-sm hover:scale-105 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold text-white/90">
                      {widgetCfg.mode === 'expense'
                        ? `Pengeluaran · ${widgetData.catName}`
                        : `Sisa Budget · ${widgetData.catName}`}
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold tabular-nums tracking-tight drop-shadow-sm">
                      {widgetCfg.mode === 'expense'
                        ? formatIDR(widgetData.totalSpent)
                        : formatIDR(widgetData.remainingBudget)}
                    </p>
                  </div>

                  {widgetCfg.mode === 'budget' ? (
                    <div className="mt-4 space-y-1.5">
                      <div className="h-2.5 w-full rounded-full bg-white/25 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{ width: `${widgetData.usedPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-semibold text-white/90 tabular-nums">
                        <span>Terpakai {widgetData.usedPct}%</span>
                        <span>Limit {formatCompactIDR(widgetCfg.budgetLimit)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-[11px] font-semibold text-white/90 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mucuw Widget · Sinkron Real-Time
                    </p>
                  )}
                </div>
              </div>

              {/* Widget Customizer Controls */}
              <div className="rounded-3xl bg-white border border-purple-100 p-4 space-y-4">
                {/* Mode Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateWidgetConfig({ mode: 'expense' })}
                    className={`min-h-[40px] rounded-2xl text-xs font-bold border ${
                      widgetCfg.mode === 'expense'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💸 Mode Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateWidgetConfig({ mode: 'budget' })}
                    className={`min-h-[40px] rounded-2xl text-xs font-bold border ${
                      widgetCfg.mode === 'budget'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🎯 Mode Budgeting
                  </button>
                </div>

                {widgetCfg.mode === 'budget' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Limit Budget Widget (Rp)
                    </label>
                    <input
                      type="number"
                      value={widgetCfg.budgetLimit}
                      onChange={(e) =>
                        onUpdateWidgetConfig({ budgetLimit: Number(e.target.value) || 0 })
                      }
                      className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-sm font-bold tabular-nums"
                    />
                  </div>
                )}

                {/* Background Gradients & Photo Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600">
                      Background Foto / Gradien
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 px-3 py-1 text-[11px] font-bold hover:bg-pink-100">
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Upload Foto Idol / Aesthetic</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadWidgetPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {(Object.keys(WIDGET_GRADIENTS) as WidgetGradientKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          onUpdateWidgetConfig({ backgroundType: 'gradient', gradient: key })
                        }
                        className={`h-11 rounded-2xl text-[10px] font-bold text-white flex items-end p-1.5 shadow-sm ${
                          WIDGET_GRADIENTS[key].className
                        } ${
                          widgetCfg.backgroundType === 'gradient' && widgetCfg.gradient === key
                            ? 'ring-2 ring-purple-600 ring-offset-2'
                            : ''
                        }`}
                      >
                        {WIDGET_GRADIENTS[key].label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onUpdateWidgetConfig({ backgroundType: 'preset_photo' })}
                      style={{
                        backgroundImage: `url(${WIDGET_AESTHETIC_BG_SRC})`,
                        backgroundSize: 'cover',
                      }}
                      className={`h-11 rounded-2xl text-[10px] font-bold text-slate-900 flex items-end p-1.5 shadow-sm ${
                        widgetCfg.backgroundType === 'preset_photo'
                          ? 'ring-2 ring-purple-600 ring-offset-2'
                          : ''
                      }`}
                    >
                      <span className="bg-white/75 rounded px-1">Clouds</span>
                    </button>
                  </div>
                </div>

                {/* Widget Filters: Period, Category, Wallet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    aria-label="Periode Widget"
                    value={widgetCfg.period}
                    onChange={(e) =>
                      onUpdateWidgetConfig({
                        period: e.target.value as WidgetConfig['period'],
                      })
                    }
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                  >
                    <option value="today">Hari ini</option>
                    <option value="week">Minggu ini</option>
                    <option value="month">Bulan ini</option>
                  </select>

                  <select
                    aria-label="Kategori Widget"
                    value={widgetCfg.categoryId}
                    onChange={(e) => onUpdateWidgetConfig({ categoryId: e.target.value })}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                  >
                    <option value="all">Semua Kategori</option>
                    {state.categories
                      .filter((c) => c.type !== 'income')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                  </select>

                  <select
                    aria-label="Dompet Widget"
                    value={widgetCfg.walletId}
                    onChange={(e) => onUpdateWidgetConfig({ walletId: e.target.value })}
                    className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                  >
                    <option value="all">Semua Dompet</option>
                    {sortedWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.emoji} {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
