import { lazy, Suspense } from "react";
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
const NotFound = lazy(() => import("./pages/NotFound"));

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

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <OfflineSyncProvider>
        <TooltipProvider>
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
