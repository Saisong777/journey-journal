import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { queryClient } from "@/lib/queryClient";
import { OfflineSyncProvider } from "@/lib/offlineSyncContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { TripDataWarmup } from "@/components/app/TripDataWarmup";

// P1: Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Location = lazy(() => import("./pages/Location"));
const DailyJourney = lazy(() => import("./pages/DailyJourney"));
const Tools = lazy(() => import("./pages/Tools"));
const Members = lazy(() => import("./pages/Members"));
const Settings = lazy(() => import("./pages/Settings"));
const Attractions = lazy(() => import("./pages/Attractions"));
const TripSummary = lazy(() => import("./pages/TripSummary"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BibleLibrary = lazy(() => import("./pages/BibleLibrary"));
const PaulJourneys = lazy(() => import("./pages/PaulJourneys"));
const VerifyTrip = lazy(() => import("./pages/VerifyTrip"));
const AuthCallbackSuccess = lazy(() => import("./pages/AuthCallbackSuccess"));
const Landing = lazy(() => import("./pages/Landing"));
const RollCall = lazy(() => import("./pages/RollCall"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PreviewHome = import.meta.env.DEV ? lazy(() => import("./pages/PreviewHome")) : null;

// Admin pages — separate chunk
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTrips = lazy(() => import("./pages/admin/AdminTrips"));
const AdminTripDays = lazy(() => import("./pages/admin/AdminTripDays"));
const AdminDevotionals = lazy(() => import("./pages/admin/AdminDevotionals"));
const AdminInvitations = lazy(() => import("./pages/admin/AdminInvitations"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminTripNotes = lazy(() => import("./pages/admin/AdminTripNotes"));
const AdminBibleLibrary = lazy(() => import("./pages/admin/AdminBibleLibrary"));
const AdminAttractions = lazy(() => import("./pages/admin/AdminAttractions"));
const AdminBibleModuleEdit = lazy(() => import("./pages/admin/AdminBibleModuleEdit"));
const AdminHelpGuide = lazy(() => import("./pages/admin/AdminHelpGuide"));
const HelpGuide = lazy(() => import("./pages/HelpGuide"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const BibleModulePage = lazy(() => import("./pages/BibleModulePage"));

import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
}

function ServiceWorkerUpdateNotice() {
  const { toast } = useToast();

  useEffect(() => {
    const handleUpdateReady = () => {
      toast({
        title: "新版本已準備好",
        description: "等你方便時再更新，避免打斷正在填寫的內容。",
        action: (
          <ToastAction altText="重新整理" onClick={() => window.location.reload()}>
            更新
          </ToastAction>
        ),
      });
    };

    window.addEventListener("app-update-ready", handleUpdateReady);
    return () => window.removeEventListener("app-update-ready", handleUpdateReady);
  }, [toast]);

  return null;
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "頁面載入時發生問題",
    };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">頁面暫時沒有載入成功</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            可能是網路切換、版本更新，或本機伺服器剛重新啟動。資料不會因為這個畫面消失。
          </p>
          {this.state.message && (
            <p className="mt-3 rounded-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
              {this.state.message}
            </p>
          )}
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              className="h-11 flex-1 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              重新載入
            </button>
            <a
              className="flex h-11 flex-1 items-center justify-center rounded-sm border border-border px-4 text-sm font-semibold text-foreground"
              href="/"
            >
              回首頁
            </a>
          </div>
        </div>
      </div>
    );
  }
}

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {PreviewHome && <Route path="/preview/home" element={<PreviewHome />} />}
        <Route path="/welcome" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback-success" element={<AuthCallbackSuccess />} />
        <Route
          path="/verify-trip"
          element={
            <ProtectedRoute skipTripCheck>
              <VerifyTrip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-journey"
          element={
            <ProtectedRoute>
              <DailyJourney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <DailyJourney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devotional"
          element={
            <ProtectedRoute>
              <DailyJourney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location"
          element={
            <ProtectedRoute>
              <Location />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roll-call"
          element={
            <ProtectedRoute>
              <RollCall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute skipSetupCheck>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attractions"
          element={
            <ProtectedRoute>
              <Attractions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <TripSummary />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trips"
          element={
            <AdminRoute>
              <AdminTrips />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trip-days"
          element={
            <AdminRoute>
              <AdminTripDays />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trip-days/:tripId"
          element={
            <AdminRoute>
              <AdminTripDays />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/devotionals"
          element={
            <AdminRoute>
              <AdminDevotionals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/devotionals/:tripId"
          element={
            <AdminRoute>
              <AdminDevotionals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trip-notes"
          element={
            <AdminRoute>
              <AdminTripNotes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/invitations"
          element={
            <AdminRoute>
              <AdminInvitations />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/invitations/:tripId"
          element={
            <AdminRoute>
              <AdminInvitations />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <AdminRoute>
              <AdminMembers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/bible-library"
          element={
            <AdminRoute>
              <AdminBibleLibrary />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/bible-library/modules/:moduleId"
          element={
            <AdminRoute>
              <AdminBibleModuleEdit />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/attractions"
          element={
            <AdminRoute>
              <AdminAttractions />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/attractions/:tripId"
          element={
            <AdminRoute>
              <AdminAttractions />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/help-guide"
          element={
            <AdminRoute>
              <AdminHelpGuide />
            </AdminRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpGuide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <PrivacyPolicy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bible-library"
          element={
            <ProtectedRoute>
              <BibleLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bible-library/paul-journeys"
          element={
            <ProtectedRoute>
              <PaulJourneys />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bible-library/modules/:moduleId"
          element={
            <ProtectedRoute>
              <BibleModulePage />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
    </RouteErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <OfflineSyncProvider>
        <TooltipProvider>
          <ServiceWorkerUpdateNotice />
          <TripDataWarmup />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </OfflineSyncProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
