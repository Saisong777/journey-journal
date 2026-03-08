import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { queryClient } from "@/lib/queryClient";
import { OfflineSyncProvider } from "@/lib/offlineSyncContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Journal = lazy(() => import("./pages/Journal"));
const Location = lazy(() => import("./pages/Location"));
const Devotional = lazy(() => import("./pages/Devotional"));
const DailyJourney = lazy(() => import("./pages/DailyJourney"));
const Tools = lazy(() => import("./pages/Tools"));
const Members = lazy(() => import("./pages/Members"));
const Settings = lazy(() => import("./pages/Settings"));
const Attractions = lazy(() => import("./pages/Attractions"));
const TripSummary = lazy(() => import("./pages/TripSummary"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTrips = lazy(() => import("./pages/admin/AdminTrips"));
const AdminTripDays = lazy(() => import("./pages/admin/AdminTripDays"));
const AdminDevotionals = lazy(() => import("./pages/admin/AdminDevotionals"));
const AdminInvitations = lazy(() => import("./pages/admin/AdminInvitations"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminTripNotes = lazy(() => import("./pages/admin/AdminTripNotes"));
const AdminBibleLibrary = lazy(() => import("./pages/admin/AdminBibleLibrary"));
const BibleLibrary = lazy(() => import("./pages/BibleLibrary"));
const PaulJourneys = lazy(() => import("./pages/PaulJourneys"));
const VerifyTrip = lazy(() => import("./pages/VerifyTrip"));
const AuthCallbackSuccess = lazy(() => import("./pages/AuthCallbackSuccess"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-amber-50">
    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OfflineSyncProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </OfflineSyncProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
