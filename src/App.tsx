import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Services from "./pages/Services";
import CreateService from "./pages/CreateService";
import EditService from "./pages/EditService";
import BookService from "./pages/BookService";
import Chat from "./pages/Chat";
import FreelancerProfile from "./pages/FreelancerProfile";
import Availability from "./pages/Availability";
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
          <Route path="/home" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/new" element={<CreateService />} />
          <Route path="/services/edit/:id" element={<EditService />} />
          <Route path="/book/:serviceId" element={<BookService />} />
          <Route path="/chat/:bookingId" element={<Chat />} />
          <Route path="/freelancer/:freelancerId" element={<FreelancerProfile />} />
          <Route path="/availability" element={<Availability />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
