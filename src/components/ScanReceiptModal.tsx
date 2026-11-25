import { Camera, FileUp, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppState, TransactionScope } from '../types/finance';
import { getTodayYMD } from '../utils/formatters';
import { TxPrefill } from './TransactionFormModal';

interface ScanReceiptModalProps {
  open: boolean;
  onClose: () => void;
  state: AppState;
  onExtracted: (prefill: TxPrefill) => void;
}

const DEMO_RECEIPTS: { label: string; emoji: string; prefill: TxPrefill }[] = [
  {
    label: 'Kopi Kenangan · Rp 48.000',
    emoji: '🧋',
    prefill: {
      type: 'expense',
      scope: 'personal',
      title: 'Kopi Kenangan',
      amount: 48000,
      date: getTodayYMD(),
      time: '10:25',
      categoryId: 'cat_food',
      notes: '2x Kopi Kenangan Mantan Regular (Rp 48.000)',
      extractedItems: [{ name: 'Kopi Kenangan Mantan Regular', qty: 2, price: 48000 }],
      extractedByAi: true,
    },
  },
  {
    label: 'Indomaret Point · Rp 112.500',
    emoji: '🛒',
    prefill: {
      type: 'expense',
      scope: 'personal',
      title: 'Indomaret Point',
      amount: 112500,
      date: getTodayYMD(),
      time: '16:40',
      categoryId: 'cat_shopping',
      notes: '1x Susu UHT, 1x Roti Tawar, 1x Sabun Cuci',
      extractedItems: [
        { name: 'Susu UHT 1L', qty: 1, price: 22500 },
        { name: 'Roti Tawar Gandum', qty: 1, price: 24000 },
        { name: 'Sabun Cuci Cair', qty: 1, price: 66000 },
      ],
      extractedByAi: true,
    },
  },
  {
    label: 'Supplier Bahan Bisnis · Rp 340.000',
    emoji: '📦',
    prefill: {
      type: 'expense',
      scope: 'business',
      title: 'Toko Kemasan & Bahan Baku',
      amount: 340000,
      date: getTodayYMD(),
      time: '14:05',
      categoryId: 'cat_biz_cogs',
      notes: '100x Cup 16oz, 1x Bubuk Matcha 500g',
      extractedItems: [
        { name: 'Cup 16oz + Lid', qty: 100, price: 150000 },
        { name: 'Bubuk Matcha Ceremonial 500g', qty: 1, price: 190000 },
      ],
      extractedByAi: true,
    },
  },
];

function guessFromFilename(name: string): { title: string; categoryId: string; scope: TransactionScope } {
  const lower = name.toLowerCase();
  if (/kopi|cafe|kafe|resto|makan|food|boba|warung|mie/.test(lower)) {
    return { title: 'Struk Makan & Minum', categoryId: 'cat_food', scope: 'personal' };
  }
  if (/grab|gojek|bensin|parkir|tol|kereta|transport/.test(lower)) {
    return { title: 'Struk Transportasi', categoryId: 'cat_transport', scope: 'personal' };
  }
  if (/listrik|pln|wifi|air|pdam|pulsa|tagihan/.test(lower)) {
    return { title: 'Struk Tagihan', categoryId: 'cat_bills', scope: 'personal' };
  }
  if (/supplier|bahan|grosir|kemasan|hpp|modal/.test(lower)) {
    return { title: 'Belanja Bahan Usaha', categoryId: 'cat_biz_cogs', scope: 'business' };
  }
  return { title: 'Struk Belanja', categoryId: 'cat_shopping', scope: 'personal' };
}

export function ScanReceiptModal({ open, onClose, state, onExtracted }: ScanReceiptModalProps) {
  const lang = state.settings.language;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [categoryId, setCategoryId] = useState('cat_shopping');
  const [scope, setScope] = useState<TransactionScope>('personal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setFileName(null);
      setStoreName('');
      setTotalAmount('');
      setCategoryId('cat_shopping');
      setScope('personal');
      setNotes('');
    }
  }, [open]);

  if (!open) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const guessed = guessFromFilename(file.name);
    setStoreName(guessed.title);
    setCategoryId(guessed.categoryId);
    setScope(guessed.scope);
    setNotes(`Lampiran struk lokal: ${file.name}`);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleConfirmManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    onClose();
    onExtracted({
      type: 'expense',
      scope,
      title: storeName.trim() || 'Struk Belanja',
      amount: Number(totalAmount) || 0,
      date: getTodayYMD(),
      time,
      categoryId,
      notes: notes.trim() || (fileName ? `Lampiran struk: ${fileName}` : 'Dari Scan Struk'),
      extractedByAi: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] shadow-2xl border border-purple-100 overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-purple-100">
          <div>
            <h2 className="font-display text-lg font-extrabold text-slate-900">
              {lang === 'id' ? '📸 Scan & Catat Struk' : '📸 Receipt Scanner'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'id'
                ? 'Pratinjau foto struk langsung di browser (100% offline tanpa server)'
                : 'Preview receipts locally in-browser (100% offline, no server)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup scan struk"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tips Card */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border border-purple-100 p-4 space-y-1.5">
            <p className="text-xs font-extrabold text-purple-900">
              💡 Catat Struk Lebih Praktis (Tanpa Internet/Server):
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Ambil foto atau pilih gambar struk untuk dilihat sambil mengisi nominal, atau pilih simulasi template struk cepat di bawah.
            </p>
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3.5 text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity">
              <Camera className="w-5 h-5" />
              <span>Ambil Foto Struk</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-3xl bg-white border-2 border-purple-200 text-purple-800 p-3.5 text-xs font-extrabold hover:bg-purple-50 transition-colors">
              <FileUp className="w-5 h-5" />
              <span>Pilih Gambar Struk</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Local Preview + Quick Entry Helper */}
          {(previewUrl || fileName) && (
            <form
              onSubmit={handleConfirmManualScan}
              className="rounded-3xl bg-white border border-purple-200 p-4 space-y-3"
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Pratinjau struk belanja"
                  className="max-h-52 mx-auto rounded-2xl object-contain border border-slate-100"
                />
              )}
              <p className="text-[11px] font-semibold text-slate-500 text-center truncate">
                {fileName}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama Toko / Merchant
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="cth: Alfamart / Kopi Kenangan"
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Total Struk (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <select
                  aria-label="Kategori struk"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                >
                  {state.categories
                    .filter((c) => c.type === 'expense' || c.type === 'both')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                </select>
                <select
                  aria-label="Mode transaksi struk"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as TransactionScope)}
                  className="h-10 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-xs font-semibold"
                >
                  <option value="personal">👤 Pribadi</option>
                  <option value="business">🏪 Bisnis</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full min-h-[42px] rounded-full bg-purple-600 text-white text-xs font-extrabold hover:bg-purple-700 transition-colors"
              >
                Lanjutkan ke Form Transaksi ✨
              </button>
            </form>
          )}

          {/* Instant Demo Simulation */}
          <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Coba Simulasi Template Struk Cepat:
            </p>
            <div className="space-y-2">
              {DEMO_RECEIPTS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => {
                    onClose();
                    onExtracted(demo.prefill);
                  }}
                  className="w-full min-h-[44px] flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 hover:border-purple-300 hover:bg-purple-50/40 transition-colors"
                >
                  <span>
                    {demo.emoji} {demo.label}
                  </span>
                  <span className="text-purple-600">Isi Form →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
