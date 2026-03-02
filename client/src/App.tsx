import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Journal from "./pages/Journal";
import Location from "./pages/Location";
import Devotional from "./pages/Devotional";
import DailyJourney from "./pages/DailyJourney";
import Tools from "./pages/Tools";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import Attractions from "./pages/Attractions";
import TripSummary from "./pages/TripSummary";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminTripDays from "./pages/admin/AdminTripDays";
import AdminDevotionals from "./pages/admin/AdminDevotionals";
import AdminInvitations from "./pages/admin/AdminInvitations";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminTripNotes from "./pages/admin/AdminTripNotes";
import AdminBibleLibrary from "./pages/admin/AdminBibleLibrary";
import BibleLibrary from "./pages/BibleLibrary";
import PaulJourneys from "./pages/PaulJourneys";
import VerifyTrip from "./pages/VerifyTrip";
import AuthCallbackSuccess from "./pages/AuthCallbackSuccess";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
