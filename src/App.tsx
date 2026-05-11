import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@shared/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@shared/components/ScrollToTop";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Success from "@/pages/Success";
import Agenda from "@/pages/Agenda";
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/success" element={<Success />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
      <Sonner richColors closeButton />
    </BrowserRouter>
  );
}
