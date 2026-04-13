import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";
import { FloatingCartButton } from "./components/common/FloatingCartButton";
import { LandingPage } from "./pages/landing/LandingPage";
import { StaffDashboard } from "./pages/staff/StaffDashboard";
import { PaymentVerify } from "./pages/PaymentVerify";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { OrganizerApprovals } from "./pages/admin/OrganizerApprovals";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { OrganizerSignupPage } from "./pages/auth/OrganizerSignupPage";
import { DiscoveryPage } from "./pages/discovery/DiscoveryPage";
import { EventDetailPage } from "./pages/event/EventDetailPage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { SavedTicketsPage } from "./pages/cart/SavedTicketsPage";
import { MyTicketsPage } from "./pages/tickets/MyTicketsPage";
import { OrganizerDashboard } from "./pages/organizer/OrganizerDashboard";
import { CreateEventPage } from "./pages/organizer/CreateEventPage";
import { StaffManagementPage } from "./pages/organizer/StaffManagementPage";
import { PayoutSettingsPage } from "./pages/organizer/PayoutSettingsPage";
import { EventAnalyticsPage } from "./pages/organizer/EventAnalyticsPage";
import { EventsAnalyticsOverview } from "./pages/organizer/EventsAnalyticsOverview";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminApprovalPage } from "./pages/admin/AdminApprovalPage";
import { AdminEventsPage } from "./pages/admin/AdminEventsPage";
import { SecurityScannerPage } from "./pages/security/SecurityScannerPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { AdminManagement } from "./pages/admin/AdminManagement";
import { AboutPage } from "./pages/about/AboutPage";
import { FeaturesPage } from "./pages/info/FeaturesPage";
import { ContactPage } from "./pages/info/ContactPage";
import { HelpPage } from "./pages/info/HelpPage";
import { FaqPage } from "./pages/info/FaqPage";
import { SupportPage } from "./pages/info/SupportPage";
import { TermsPage } from "./pages/info/TermsPage";
import { PrivacyPage } from "./pages/info/PrivacyPage";
import { RefundPage } from "./pages/info/RefundPage";
import { useAuth } from "./contexts/AuthContext";

function ProtectedRoleRoute({ children, allowedRoleIds }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoleIds?.length && !allowedRoleIds.includes(user?.role_id)) {
    return <Navigate to="/discover" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/organizer/signup" element={<OrganizerSignupPage />} />
          <Route path="/discover" element={<DiscoveryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/saved-tickets" element={<SavedTicketsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/create-event" element={<CreateEventPage />} />
          <Route path="/staff/management" element={<StaffManagementPage />} />
          <Route path="/organizer/payouts" element={<PayoutSettingsPage />} />
          <Route
            path="/organizer/events-analytics"
            element={<EventsAnalyticsOverview />}
          />
          <Route
            path="/organizer/events-analitics"
            element={<EventsAnalyticsOverview />}
          />
          <Route
            path="/organizer/analytics/:eventId"
            element={<EventAnalyticsPage />}
          />
          <Route
            path="/organizer/events-analytics/:eventId"
            element={<EventAnalyticsPage />}
          />
          <Route
            path="/organizer/events-analitics/:eventId"
            element={<EventAnalyticsPage />}
          />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/approvals" element={<AdminApprovalPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoleRoute allowedRoleIds={[1, 4, 5]}>
                <StaffDashboard />
              </ProtectedRoleRoute>
            }
          />
          <Route path="/admin/users" element={<AdminManagement />} />
          <Route path="/admin/approvals" element={<OrganizerApprovals />} />
          <Route path="/payment/verify" element={<PaymentSuccess />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route
            path="/security/scanner"
            element={
              <ProtectedRoleRoute allowedRoleIds={[1, 4, 5]}>
                <SecurityScannerPage />
              </ProtectedRoleRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <FloatingCartButton />
    </div>
  );
}

export default App;
