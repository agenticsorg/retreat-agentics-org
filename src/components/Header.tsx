import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.svg";
import AccountMenu from "@shared/components/AccountMenu";
import { Button } from "@shared/components/ui/button";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <img src={logo} alt="Agentics" className="h-7 w-auto" />
          <span className="hidden sm:inline text-sm font-semibold text-muted-foreground">Fall Retreat 2026</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/agenda" className="text-muted-foreground hover:text-foreground transition-colors">Agenda</Link>
          <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          <Link to="/#venue" className="text-muted-foreground hover:text-foreground transition-colors">Venue</Link>
        </nav>
        <div className="flex items-center gap-2">
          <AccountMenu />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link to="/register">Register</Link>
          </Button>
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-4">
          <Link to="/agenda" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Agenda</Link>
          <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>FAQ</Link>
          <Link to="/#venue" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>Venue</Link>
          <Button asChild size="sm" className="w-full">
            <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
