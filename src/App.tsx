import { useState } from 'react';
import { AssetSheetModal } from './components/AssetSheetModal';
import { AuthScreen } from './components/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { CenterActionSheet } from './components/CenterActionSheet';
import { FeatureModals } from './components/FeatureModals';
import { HomeView } from './components/HomeView';
import { ProfileDrawer } from './components/ProfileDrawer';
import { ReportView } from './components/ReportView';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { TransactionFormModal, TxPrefill } from './components/TransactionFormModal';
import { TransactionsView } from './components/TransactionsView';
import { MASCOT_LAPTOP_SRC } from './data/initialData';
import { useFinanceStore } from './hooks/useFinanceStore';
import { NavTab, Transaction } from './types/finance';

export default function App() {
  const {
    authReady,
    authError,
    clearAuthError,
    currentUser,
    savedAccounts,
    storageKey,
    state,
    sound,
    loginLocal,
    registerLocal,
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWalletAndAdjustBalance,
    deleteWallet,
    reorderWallets,
    addCategory,
    deleteCategory,
    addPosProduct,
    deletePosProduct,
    checkoutPosOrder,
    addBudgetDream,
    updateBudgetDream,
    deleteBudgetDream,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updateWidgetConfig,
    updateSettings,
    exportBackupJson,
    importBackupJson,
    resetEmptyAccount,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [assetSheetOpen, setAssetSheetOpen] = useState(false);
  const [centerSheetOpen, setCenterSheetOpen] = useState(false);
  const [centerSheetTab, setCenterSheetTab] = useState<'quick' | 'business' | 'widget'>('quick');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txPrefill, setTxPrefill] = useState<TxPrefill | null>(null);

  const [featureModal, setFeatureModal] = useState<'categories' | 'budgets' | 'investments' | null>(
    null,
  );

  const openNewTx = (prefill: TxPrefill | null = null) => {
    sound('tap');
    setEditingTx(null);
    setTxPrefill(prefill);
    setTxModalOpen(true);
  };

  const openEditTx = (tx: Transaction) => {
    sound('tap');
    setEditingTx(tx);
    setTxPrefill(null);
    setTxModalOpen(true);
  };

  const openCenterTab = (tab: 'quick' | 'business' | 'widget') => {
    sound('tap');
    setCenterSheetTab(tab);
    setCenterSheetOpen(true);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FFFDF9] px-4">
        <div className="h-16 w-16 rounded-3xl overflow-hidden border-2 border-purple-200 shadow-md animate-pulse">
          <img
            src={MASCOT_LAPTOP_SRC}
            alt="Memuat Mucuw"
            className="h-full w-full object-cover"
          />
        </div>
        <p className="font-display text-sm font-extrabold text-purple-800">
          Menyiapkan catatan keuanganmu...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        savedAccounts={savedAccounts}
        onLocalLogin={loginLocal}
        onLocalRegister={registerLocal}
        onClearError={clearAuthError}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Subtle Pastel Ambient Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      {/* Main Content Container */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-3 sm:pt-5">
        {activeTab === 'home' && (
          <HomeView
            state={state}
            onOpenAssetSheet={() => {
              sound('tap');
              setAssetSheetOpen(true);
            }}
            onOpenTransfer={() => openNewTx({ type: 'transfer' })}
            onOpenBusinessTab={() => openCenterTab('business')}
            onOpenProfile={() => {
              sound('tap');
              setProfileOpen(true);
            }}
            onOpenNewTx={(type, walletId) => openNewTx({ type, walletId })}
            onEditTx={openEditTx}
            onGoToTransactions={() => {
              sound('tap');
              setActiveTab('transactions');
            }}
            onGoToReport={() => {
              sound('tap');
              setActiveTab('report');
            }}
            onOpenBudgetsModal={() => {
              sound('tap');
              setFeatureModal('budgets');
            }}
            onOpenInvestmentsModal={() => {
              sound('tap');
              setFeatureModal('investments');
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            state={state}
            onEditTx={openEditTx}
            onDeleteTx={deleteTransaction}
            onAddNewTx={() => openNewTx({ type: 'expense' })}
          />
        )}

        {activeTab === 'report' && (
          <ReportView
            state={state}
            onOpenInvestmentsModal={() => {
              sound('tap');
              setFeatureModal('investments');
            }}
            onOpenBudgetsModal={() => {
              sound('tap');
              setFeatureModal('budgets');
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          sound('tap');
          setActiveTab(tab);
        }}
        onOpenScan={() => {
          sound('tap');
          setScanModalOpen(true);
        }}
        onOpenCenterSheet={() => openCenterTab('quick')}
        lang={state.settings.language}
      />

      {/* Bottom Sheet: Pilih Aset */}
      <AssetSheetModal
        open={assetSheetOpen}
        onClose={() => setAssetSheetOpen(false)}
        state={state}
        onOpenTransfer={() => openNewTx({ type: 'transfer' })}
        onAddWallet={addWallet}
        onUpdateWallet={updateWalletAndAdjustBalance}
        onDeleteWallet={deleteWallet}
        onReorderWallet={reorderWallets}
        onSelectWalletQuickTx={(walletId, type) => openNewTx({ walletId, type })}
      />

      {/* Bottom Sheet: Center + (Quick Actions, Bisnis POS, Widget) */}
      <CenterActionSheet
        open={centerSheetOpen}
        initialTab={centerSheetTab}
        onClose={() => setCenterSheetOpen(false)}
        state={state}
        onOpenAssetSheet={() => setAssetSheetOpen(true)}
        onOpenTransfer={() => openNewTx({ type: 'transfer' })}
        onOpenCategoriesModal={() => setFeatureModal('categories')}
        onOpenBudgetsModal={() => setFeatureModal('budgets')}
        onOpenInvestmentsModal={() => setFeatureModal('investments')}
        onQuickTxFromWallet={(walletId, type, presetCatId) =>
          openNewTx({ walletId, type, categoryId: presetCatId })
        }
        onAddBusinessTx={addTransaction}
        onAddPosProduct={addPosProduct}
        onDeletePosProduct={deletePosProduct}
        onCheckoutPos={checkoutPosOrder}
        onUpdateWidgetConfig={updateWidgetConfig}
      />

      {/* Modal: Add / Edit Transaction */}
      <TransactionFormModal
        open={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
          setTxPrefill(null);
        }}
        state={state}
        editingTx={editingTx}
        prefill={txPrefill}
        onSaveNew={addTransaction}
        onSaveEdit={updateTransaction}
        onOpenCreateWallet={() => setAssetSheetOpen(true)}
      />

      {/* Modal: Scan Struk */}
      <ScanReceiptModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        state={state}
        onExtracted={(prefill) => openNewTx(prefill)}
      />

      {/* Drawer: Profile & Settings */}
      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
        storageKey={storageKey}
        state={state}
        onUpdateSettings={updateSettings}
        onOpenBusinessPOS={() => openCenterTab('business')}
        onOpenCategoriesModal={() => setFeatureModal('categories')}
        onOpenBudgetsModal={() => setFeatureModal('budgets')}
        onOpenInvestmentsModal={() => setFeatureModal('investments')}
        onExportBackup={exportBackupJson}
        onImportBackup={importBackupJson}
        onResetAccount={resetEmptyAccount}
        onLogout={logout}
      />

      {/* Sub-Modals: Categories, Budgets/Dreams, Investments */}
      <FeatureModals
        activeModal={featureModal}
        onClose={() => setFeatureModal(null)}
        state={state}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onAddBudgetDream={addBudgetDream}
        onUpdateBudgetDream={updateBudgetDream}
        onDeleteBudgetDream={deleteBudgetDream}
        onAddInvestment={addInvestment}
        onUpdateInvestment={updateInvestment}
        onDeleteInvestment={deleteInvestment}
      />
    </div>
  );
}
