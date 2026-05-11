import { Link } from "react-router-dom";
import { TreePine } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TreePine className="h-4 w-4 text-primary" />
          <span>Agentics Foundation Fall Retreat 2026 · Lake Joseph, MacTier, Ontario</span>
        </div>
        <div className="flex gap-6">
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <a href="mailto:summit@agentics.org" className="hover:text-foreground transition-colors">Contact</a>
          <a href="https://agentics.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">agentics.org</a>
        </div>
        <p>© 2026 Agentics. All rights reserved.</p>
      </div>
    </footer>
  );
}
