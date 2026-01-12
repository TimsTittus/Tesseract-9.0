import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { VolunteerRoute } from "@/components/volunteer/VolunteerRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TicketRegistration from "./pages/TicketRegistration";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminTicketTemplate from "./pages/admin/AdminTicketTemplate";
import AdminCheckin from "./pages/admin/AdminCheckin";
import AdminCoupons from "./pages/admin/AdminCoupons";
import VolunteerCheckin from "./pages/volunteer/VolunteerCheckin";
import VolunteerParticipants from "./pages/volunteer/VolunteerParticipants";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets/:ticketId/register" element={<TicketRegistration />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/tickets/:ticketId/template" element={<AdminRoute><AdminTicketTemplate /></AdminRoute>} />
            <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
            <Route path="/admin/referrals" element={<AdminRoute><AdminReferrals /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/checkin" element={<AdminRoute><AdminCheckin /></AdminRoute>} />
            <Route path="/volunteer" element={<VolunteerRoute><VolunteerCheckin /></VolunteerRoute>} />
            <Route path="/volunteer/participants" element={<VolunteerRoute><VolunteerParticipants /></VolunteerRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
