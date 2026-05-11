import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Calendar, Mail, Home } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@shared/components/ui/button";
import { Separator } from "@shared/components/ui/separator";

export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <>
      <SEO
        title="Registration Confirmed"
        description="Your Agentics Summer Retreat 2026 registration is confirmed."
        path="/success"
        noindex
      />
      <div className="container py-20 max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">
          You're registered!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Welcome to the Agentics AI Summit 2026.
        </p>

        {sessionId && (
          <p className="text-xs text-muted-foreground mb-8 font-mono">
            Booking reference: {sessionId}
          </p>
        )}

        <Separator className="mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-10">
          <div className="rounded-xl border border-border bg-card p-5 flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Check your email</p>
              <p className="text-sm text-muted-foreground">
                A confirmation with your booking details and receipt has been sent to your
                registered email address.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Add to your calendar</p>
              <p className="text-sm text-muted-foreground">
                September 4–6, 2026 · RockyCrest Resort, Ontario, Canada. Calendar invites will be
                sent closer to the event.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-left mb-10">
          <h2 className="font-heading font-bold text-lg mb-2">What happens next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              You'll receive a detailed pre-event guide 4 weeks before the summit.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              Resort check-in details and shuttle schedules will be emailed 2 weeks out.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              Questions? Email us at{" "}
              <a
                href="mailto:summit@agentics.org"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                summit@agentics.org
              </a>
            </li>
          </ul>
        </div>

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
