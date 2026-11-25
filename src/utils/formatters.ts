import { AppLanguage, AppState, Transaction, WalletTheme, WidgetGradientKey } from '../types/finance';

export function formatIDR(amount: number): string {
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(absVal);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatCompactIDR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000)} rb`;
  }
  return `${sign}Rp ${abs}`;
}

export function getTodayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateGroupLabel(ymd: string, lang: AppLanguage): string {
  const today = getTodayYMD();
  const yesterday = getYesterdayYMD();
  if (ymd === today) return lang === 'id' ? 'Hari ini' : 'Today';
  if (ymd === yesterday) return lang === 'id' ? 'Kemarin' : 'Yesterday';

  const [y, m, d] = ymd.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  return dateObj.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getMonthLabel(ym: string, lang: AppLanguage): string {
  const [y, m] = ym.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, 1);
  return dateObj.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export const WALLET_THEME_STYLES: Record<
  WalletTheme,
  { cardBg: string; text: string; accentPill: string; badge: string }
> = {
  mandiri: {
    cardBg: 'bg-gradient-to-br from-[#003D79] via-[#1D5FA7] to-[#F5B700]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-amber-300 text-slate-900',
  },
  blubca: {
    cardBg: 'bg-gradient-to-br from-[#00B4B6] via-[#14B8A6] to-[#6EE7B7]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-teal-100 text-teal-900',
  },
  seabank: {
    cardBg: 'bg-gradient-to-br from-[#FF5722] via-[#FF7A45] to-[#FBBF24]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-orange-100 text-orange-900',
  },
  gopay: {
    cardBg: 'bg-gradient-to-br from-[#0081A0] via-[#0EA5E9] to-[#38BDF8]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-sky-100 text-sky-900',
  },
  lavender: {
    cardBg: 'bg-gradient-to-br from-[#8B5CF6] via-[#A855F7] to-[#EC4899]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-purple-100 text-purple-900',
  },
  pink: {
    cardBg: 'bg-gradient-to-br from-[#EC4899] via-[#F472B6] to-[#FDA4AF]',
    text: 'text-white',
    accentPill: 'bg-white/20 text-white border border-white/30',
    badge: 'bg-pink-100 text-pink-900',
  },
  mint: {
    cardBg: 'bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#A7F3D0]',
    text: 'text-slate-900',
    accentPill: 'bg-slate-900/10 text-slate-900 border border-slate-900/15',
    badge: 'bg-emerald-100 text-emerald-900',
  },
  gold: {
    cardBg: 'bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FDE68A]',
    text: 'text-slate-900',
    accentPill: 'bg-slate-900/10 text-slate-900 border border-slate-900/15',
    badge: 'bg-amber-100 text-amber-900',
  },
};

export const WIDGET_GRADIENTS: Record<WidgetGradientKey, { label: string; className: string }> = {
  classic: {
    label: 'Classic',
    className: 'bg-gradient-to-br from-purple-400 via-fuchsia-300 to-pink-300',
  },
  ocean: {
    label: 'Ocean',
    className: 'bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-400',
  },
  sunset: {
    label: 'Sunset',
    className: 'bg-gradient-to-br from-rose-400 via-orange-300 to-amber-200',
  },
  forest: {
    label: 'Forest',
    className: 'bg-gradient-to-br from-emerald-400 via-teal-400 to-lime-300',
  },
  midnight: {
    label: 'Midnight',
    className: 'bg-gradient-to-br from-slate-800 via-indigo-900 to-purple-900',
  },
  berry: {
    label: 'Berry',
    className: 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500',
  },
};

let audioCtx: AudioContext | null = null;

export function playCuteSound(enabled: boolean, kind: 'tap' | 'success' | 'cash' = 'tap') {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (kind === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.075);
    } else if (kind === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Audio playback optional
  }
}

export function exportTransactionsToCSV(state: AppState, transactions: Transaction[]) {
  const walletMap = new Map(state.wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(state.categories.map((c) => [c.id, `${c.emoji} ${c.name}`]));

  const headers = ['Tanggal', 'Jam', 'Tipe', 'Mode', 'Judul', 'Kategori', 'Dompet', 'Dompet Tujuan', 'Nominal (IDR)', 'Catatan'];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.time,
    tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Pindah Saldo',
    tx.scope === 'business' ? 'Bisnis' : 'Pribadi',
    `"${(tx.title || '').replace(/"/g, '""')}"`,
    `"${(categoryMap.get(tx.categoryId) || tx.categoryId).replace(/"/g, '""')}"`,
    `"${(walletMap.get(tx.walletId) || tx.walletId).replace(/"/g, '""')}"`,
    `"${(tx.toWalletId ? walletMap.get(tx.toWalletId) || '' : '').replace(/"/g, '""')}"`,
    tx.amount,
    `"${(tx.notes || tx.posItemsSummary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mucuw-transaksi-${getTodayYMD()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
