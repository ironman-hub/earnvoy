import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import NavBar from "./components/NavBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Footer from "./components/Footer.jsx";
import TermsGate from "./components/TermsGate.jsx";
import { RequireAuth, RequireAdmin } from "./components/Guards.jsx";

import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { VerifyEmail, VerifyAccount } from "./pages/Verify.jsx";
import { ForgotPassword, ResetPassword } from "./pages/PasswordReset.jsx";
import Terms from "./pages/Terms.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <TermsGate />
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify" element={<RequireAuth><VerifyAccount /></RequireAuth>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/create-listing" element={<RequireAuth><CreateListing /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
