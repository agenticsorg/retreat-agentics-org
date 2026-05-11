import { useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { signInWithGoogle, logOut } from "../lib/firebase";

export default function AccountMenu() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  async function onSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    setBusy(true);
    try {
      await logOut();
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={onSignIn} disabled={busy} className="gap-2">
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const label = user.displayName || user.email || "Account";
  return (
    <div className="flex items-center gap-1">
      <span
        className="hidden md:flex items-center gap-2 text-xs text-muted-foreground max-w-[160px] truncate"
        title={label}
      >
        <UserIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSignOut}
        disabled={busy}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
