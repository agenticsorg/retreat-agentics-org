import { Link } from "react-router-dom";
import { Home, Mountain } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@shared/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SEO title="Page not found" path="" noindex />
      <div className="container flex flex-col items-center justify-center py-32 text-center gap-6">
        <Mountain className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-6xl font-heading font-bold text-muted-foreground/60">404</h1>
        <h2 className="text-2xl font-heading font-bold">Page not found</h2>
        <p className="text-muted-foreground max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg">
          <Link to="/">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </>
  );
}
