import { HardDrive, Lock, Mail, Sparkles, User } from 'lucide-react';
import { useState } from 'react';
import { MASCOT_COACH_SRC, MASCOT_LAPTOP_SRC } from '../data/initialData';
import { SavedAccountSummary } from '../hooks/useFinanceStore';

interface AuthScreenProps {
  savedAccounts: SavedAccountSummary[];
  onLocalLogin: (email: string, password: string) => void;
  onLocalRegister: (name: string, email: string, password: string) => void;
  onClearError: () => void;
  error: string | null;
}

export function AuthScreen({
  savedAccounts,
  onLocalLogin,
  onLocalRegister,
  onClearError,
  error,
}: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>(
    savedAccounts.length > 0 ? 'login' : 'register',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState(savedAccounts[0]?.email || '');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLocalLogin(email, password);
    } else {
      onLocalRegister(name, email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Pastel Ambient Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-purple-200/45 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Brand Showcase Card */}
        <section className="lg:col-span-5 glossy-sheen rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-400 p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mucuw Finance & Mini POS</span>
            </div>

            <h1 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold leading-tight">
              Atur Dompet Pribadi & Omzet Bisnis Jadi Lebih Gemes ✨
            </h1>
            <p className="mt-2.5 text-sm text-purple-100 leading-relaxed">
              Mulai dari Rp 0 dengan dompet pilihanmu sendiri. Semua catatan keuangan tersimpan otomatis dan privat langsung di browser kamu tanpa server.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3.5 rounded-3xl bg-white/18 backdrop-blur-md p-3.5 border border-white/25">
            <img
              src={MASCOT_COACH_SRC}
              alt="Maskot Kapibara Mucuw"
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-2xl object-cover border-2 border-white shrink-0"
            />
            <div className="text-xs space-y-1">
              <p className="font-extrabold inline-flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>100% LocalStorage & Backup JSON</span>
              </p>
              <p className="text-purple-100">
                Data tersimpan per akun email di perangkat ini dan bebas dipindahkan kapan saja lewat file JSON.
              </p>
            </div>
          </div>
        </section>

        {/* Right Auth Form Card */}
        <section className="lg:col-span-7 mucuw-card rounded-3xl p-6 sm:p-8 flex flex-col justify-center space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                {mode === 'login' ? 'Masuk ke Akunmu 👋' : 'Buat Akun Baru 🧁'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login'
                  ? 'Lanjutkan catatan keuanganmu yang tersimpan di browser ini'
                  : 'Daftar gratis untuk memulai catatan keuangan bersih dari Rp 0'}
              </p>
            </div>
            <img
              src={MASCOT_LAPTOP_SRC}
              alt="Maskot Kapibara Laptop"
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-2xl object-cover border border-purple-100 shadow-sm shrink-0"
            />
          </div>

          {/* Saved Local Accounts Quick Selector */}
          {savedAccounts.length > 0 && mode === 'login' && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500">Akun tersimpan di browser ini:</p>
              <div className="flex flex-wrap gap-2">
                {savedAccounts.map((acct) => (
                  <button
                    key={acct.email}
                    type="button"
                    onClick={() => {
                      setEmail(acct.email);
                      onClearError();
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                      email.trim().toLowerCase() === acct.email
                        ? 'bg-purple-50 border-purple-400 text-purple-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {acct.name} ({acct.email})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                onClearError();
              }}
              className={`min-h-[38px] rounded-full text-xs font-bold transition-all ${
                mode === 'login' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                onClearError();
              }}
              className={`min-h-[38px] rounded-full text-xs font-bold transition-all ${
                mode === 'register' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Panggilan
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth: Septi, Naya, Dika"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white text-sm font-extrabold shadow-lg hover:opacity-95 transition-opacity"
            >
              {mode === 'login' ? 'Masuk ke Mucuw ✨' : 'Daftar & Mulai Sekarang ✨'}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center">
            Seluruh data disimpan privat di LocalStorage browser (<span className="font-semibold text-slate-500">mucuw_user_data_&lt;email&gt;</span>). Gunakan Export & Import JSON di Pengaturan untuk mencadangkan atau pindah perangkat.
          </p>
        </section>
      </div>
    </div>
  );
}
