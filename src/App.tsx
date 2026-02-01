import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Journal from "./pages/Journal";
import Location from "./pages/Location";
import Devotional from "./pages/Devotional";
import Tools from "./pages/Tools";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import Attractions from "./pages/Attractions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/location" element={<Location />} />
          <Route path="/devotional" element={<Devotional />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/members" element={<Members />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/attractions" element={<Attractions />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
