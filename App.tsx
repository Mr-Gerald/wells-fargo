


import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useChat } from './contexts/ChatContext';
import FargoChat from './components/FargoChat';
import { FargoChatIcon } from './constants';

import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import AccountDetailsPage from './components/AccountDetailsPage';
import BottomNav from './components/BottomNav';
import FicoScorePage from './components/FicoScorePage';
import TransactionReceiptPage from './components/TransactionReceiptPage';
import DepositPage from './components/DepositPage';
import PayTransferPage from './components/PayTransferPage';
import MenuPage from './components/MenuPage';
import ExplorePage from './components/ExplorePage';
import SplashScreen from './components/SplashScreen';

// New Functional Page Imports
import RewardsPage from './components/RewardsPage';
import DepositCheckPage from './components/DepositCheckPage';
import FindAtmPage from './components/FindAtmPage';
import ZellePage from './components/ZellePage';
import TransferMoneyPage from './components/TransferMoneyPage';
import PayBillsPage from './components/PayBillsPage';
import RequestMoneyPage from './components/RequestMoneyPage';
import AlertsPage from './components/AlertsPage';
import CardSettingsPage from './components/CardSettingsPage';
import SecurityPage from './components/SecurityPage';
import AccountServicesPage from './components/AccountServicesPage';
import ContactUsPage from './components/ContactUsPage';
import OpenAccountPage from './components/OpenAccountPage';
import MortgagePage from './components/MortgagePage';
import AutoLoansPage from './components/AutoLoansPage';
import CreditCardsPage from './components/CreditCardsPage';
import InvestingPage from './components/InvestingPage';
import SignupPage from './components/SignupPage';
import AdminPage from './components/admin/AdminPage';
import ProfilePage from './components/ProfilePage';
import VerificationPage from './components/VerificationPage';
import BonusPointsPage from './components/BonusPointsPage';
import CreateInstantAccountPage from './components/CreateInstantAccountPage';
import { User } from './types';

const FloatingChatButton = () => {
    const { openChat } = useChat();
    return (
        <button
            onClick={openChat}
            className="fixed bottom-24 right-4 bg-purple-700 text-white p-3 rounded-full shadow-lg hover:bg-purple-800 transition-transform hover:scale-110 z-30 animate-fade-in"
            aria-label="Open Fargo Chat"
        >
            <FargoChatIcon />
        </button>
    );
};

function App() {
  const { currentUser, checkAuthStatus, loadingAuth } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      checkAuthStatus();
    }
  }, [showSplash, checkAuthStatus]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (loadingAuth) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="text-2xl font-bold text-wells-red tracking-wider">WELLS FARGO</div>
        <div className="mt-4 text-gray-600">Loading...</div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto shadow-lg min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    )
  }

  if (!('accounts' in currentUser)) {
    return (
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-lg flex flex-col">
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </div>
    );
  }

  const hideBottomNav = location.pathname.startsWith('/verify-identity');
  const showChatButton = !hideBottomNav;
  const user = currentUser as User;
  const hasRewards = user.rewards && user.rewards.activity && user.rewards.activity.length > 0;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg flex flex-col">
        <>
            <main className={`flex-1 overflow-y-auto ${hideBottomNav ? 'pb-0' : 'pb-20'}`}>
                <Routes>
                  {/* Main Navigation */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/account/:id" element={<AccountDetailsPage />} />
                  <Route path="/account/:id/transaction/:txId" element={<TransactionReceiptPage />} />
                  <Route path="/fico-score" element={hasRewards ? <FicoScorePage /> : <Navigate to="/" />} />
                  <Route path="/rewards" element={hasRewards ? <RewardsPage /> : <Navigate to="/" />} />
                  <Route path="/bonus-points" element={hasRewards ? <BonusPointsPage /> : <Navigate to="/" />} />
                  <Route path="/deposit" element={<DepositPage />} />
                  <Route path="/pay-transfer" element={<PayTransferPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/verify-identity/:accountId/:txId" element={<VerificationPage />} />

                  {/* Deposit Sub-pages */}
                  <Route path="/deposit/check" element={<DepositCheckPage />} />
                  <Route path="/deposit/atm" element={<FindAtmPage />} />

                   {/* Pay & Transfer Sub-pages */}
                  <Route path="/pay-transfer/zelle" element={<ZellePage />} />
                  <Route path="/pay-transfer/transfer" element={<TransferMoneyPage />} />
                  <Route path="/pay-transfer/bills" element={<PayBillsPage />} />
                  <Route path="/pay-transfer/request" element={<RequestMoneyPage />} />

                  {/* Menu Sub-pages */}
                  <Route path="/menu/alerts" element={<AlertsPage />} />
                  <Route path="/menu/card-settings" element={<CardSettingsPage />} />
                  <Route path="/menu/security" element={<SecurityPage />} />
                  <Route path="/menu/account-services" element={<AccountServicesPage />} />
                  <Route path="/menu/contact-us" element={<ContactUsPage />} />
                  <Route path="/menu/open-account" element={<OpenAccountPage />} />
                  <Route path="/menu/profile" element={<ProfilePage />} />
                  <Route path="/menu/create-instant-account" element={<CreateInstantAccountPage />} />


                  {/* Explore Sub-pages */}
                  <Route path="/explore/mortgage" element={<MortgagePage />} />
                  <Route path="/explore/auto-loans" element={<AutoLoansPage />} />
                  <Route path="/explore/credit-cards" element={<CreditCardsPage />} />
                  <Route path="/explore/investing" element={<InvestingPage />} />

                  {/* Redirect any other path to dashboard */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
            {!hideBottomNav && <BottomNav />}
            {showChatButton && <FloatingChatButton />}
            <FargoChat />
        </>
    </div>
  );
}

export default App;