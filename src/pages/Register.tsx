import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { submitInterest, createRegistrationSession } from "@/lib/api";

// ── Early Interest ──────────────────────────────────────────────────────────
const interestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});
type InterestForm = z.infer<typeof interestSchema>;

// ── Full Registration ───────────────────────────────────────────────────────
const registrationSchema = z
  .object({
    tier: z.enum(["solo", "buddy", "family", "meals"], { required_error: "Please select a tier" }),
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    partner: z.string().optional(),
    additionalPersons: z.coerce.number().min(0).max(10).optional(),
    dietaryReqs: z.string().optional(),
    emergencyName: z.string().min(2, "Please enter an emergency contact name"),
    emergencyPhone: z.string().min(7, "Please enter an emergency contact phone number"),
  })
  .superRefine((data, ctx) => {
    if (data.tier === "buddy" && !data.partner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner email is required for the Buddy tier",
        path: ["partner"],
      });
    }
  });

type RegistrationForm = z.infer<typeof registrationSchema>;

const TIER_INFO: Record<string, { label: string; price: string; note: string }> = {
  solo: {
    label: "Solo — Private 1-bedroom suite",
    price: "$2,000 USD / person",
    note: "All meals + activities included. Private 1-bedroom suite — only a few rooms left.",
  },
  buddy: {
    label: "Buddy — Shared 2-bedroom suite (per person)",
    price: "$1,700 USD / person",
    note: "Both attendees must register. Enter your partner's email below. Only a few rooms left.",
  },
  family: {
    label: "Family — Exclusive 2-bedroom suite",
    price: "$2,300 USD first person + $450 / additional person",
    note: "All meals + activities included. Only a few rooms left.",
  },
  meals: {
    label: "Meals & Sessions — day pass (no room)",
    price: "$450 USD / person",
    note: "All meals, workshops, hackathon & boat tour. Overnight accommodation not included — ideal for local or commuting guests.",
  },
};

function EarlyInterestForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InterestForm>({ resolver: zodResolver(interestSchema) });

  async function onSubmit(data: InterestForm) {
    try {
      await submitInterest({ ...data, source: "register-page" });
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-12 w-12 text-primary" />
        <h2 className="text-2xl font-heading font-bold">You're on the list!</h2>
        <p className="text-muted-foreground max-w-sm">
          We'll email you first when tickets open. Keep an eye on your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div className="space-y-1">
        <Label htmlFor="interest-name">Full name (optional)</Label>
        <Input id="interest-name" placeholder="Jane Smith" {...register("name")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="interest-email">
          Email address <span className="text-destructive">*</span>
        </Label>
        <Input id="interest-email" type="email" placeholder="jane@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Submitting…" : "Notify me when tickets open"}
      </Button>
    </form>
  );
}

function FullRegistrationForm() {
  const [tier, setTier] = useState<string>("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationForm>({ resolver: zodResolver(registrationSchema) });

  async function onSubmit(data: RegistrationForm) {
    try {
      const { emergencyName, emergencyPhone, ...rest } = data;
      const payload = {
        ...rest,
        emergencyContact: `${emergencyName} — ${emergencyPhone}`,
      };
      const { url } = await createRegistrationSession(payload as Parameters<typeof createRegistrationSession>[0]);
      window.location.href = url;
    } catch {
      toast.error("Registration failed. Please try again or contact retreat@agentics.org.");
    }
  }

  function handleTierChange(value: string) {
    setTier(value);
    setValue("tier", value as RegistrationForm["tier"], { shouldValidate: true });
  }

  const tierInfo = tier ? TIER_INFO[tier] : null;
  const additionalPersons = Number(watch("additionalPersons")) || 0;
  const familyTotal = 2300 + additionalPersons * 450;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Tier */}
      <div className="space-y-1">
        <Label htmlFor="tier-select">
          Registration tier <span className="text-destructive">*</span>
        </Label>
        <Select onValueChange={handleTierChange}>
          <SelectTrigger id="tier-select" className="bg-card border-border">
            <SelectValue placeholder="Select a tier…" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="solo">Solo — $2,000 / person (private 1-bedroom)</SelectItem>
            <SelectItem value="buddy">Buddy — $1,700 / person (shared 2-bedroom)</SelectItem>
            <SelectItem value="family">Family — $2,300 + $450/person (exclusive 2-bedroom)</SelectItem>
            <SelectItem value="meals">Meals & Sessions — $450 / person (day pass, no room)</SelectItem>
          </SelectContent>
        </Select>
        {errors.tier && <p className="text-xs text-destructive">{errors.tier.message}</p>}
        {tierInfo && (
          <div className="mt-2 rounded-lg bg-primary/8 border border-primary/20 p-3 space-y-1 text-xs">
            <p className="font-semibold text-primary">{tierInfo.price}</p>
            <p className="text-muted-foreground">{tierInfo.note}</p>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="reg-name">
          Full name <span className="text-destructive">*</span>
        </Label>
        <Input id="reg-name" placeholder="Jane Smith" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label htmlFor="reg-email">
          Email address <span className="text-destructive">*</span>
        </Label>
        <Input id="reg-email" type="email" placeholder="jane@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <Label htmlFor="reg-phone">Phone number (optional)</Label>
        <Input id="reg-phone" type="tel" placeholder="+1 416 555 0100" {...register("phone")} />
      </div>

      {/* Partner — Buddy tier only */}
      {tier === "buddy" && (
        <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Label htmlFor="reg-partner">
            Partner email address <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Both attendees must register. Enter your partner's email so we can link your booking.
          </p>
          <Input
            id="reg-partner"
            type="email"
            placeholder="partner@example.com"
            {...register("partner")}
          />
          {errors.partner && (
            <p className="text-xs text-destructive">{errors.partner.message}</p>
          )}
        </div>
      )}

      {/* Additional persons — Family tier only */}
      {tier === "family" && (
        <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Label htmlFor="reg-additional">
            Additional attendees sharing your suite
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            $450 per additional person. Leave at 0 if registering alone.
          </p>
          <Input
            id="reg-additional"
            type="number"
            min={0}
            max={10}
            placeholder="0"
            {...register("additionalPersons")}
          />
          <p className="text-xs font-semibold text-primary mt-2">
            Total: ${familyTotal.toLocaleString()} USD
            {additionalPersons > 0 && ` (${1 + additionalPersons} people)`}
          </p>
        </div>
      )}

      {/* Dietary */}
      <div className="space-y-1">
        <Label htmlFor="reg-dietary">Dietary requirements (optional)</Label>
        <Input
          id="reg-dietary"
          placeholder="e.g. vegetarian, nut allergy, kosher"
          {...register("dietaryReqs")}
        />
      </div>

      {/* Emergency contact */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <p className="text-sm font-medium">Emergency contact</p>
        <div className="space-y-1">
          <Label htmlFor="reg-ec-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input id="reg-ec-name" placeholder="Alex Smith" {...register("emergencyName")} />
          {errors.emergencyName && (
            <p className="text-xs text-destructive">{errors.emergencyName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="reg-ec-phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input id="reg-ec-phone" type="tel" placeholder="+1 416 555 0199" {...register("emergencyPhone")} />
          {errors.emergencyPhone && (
            <p className="text-xs text-destructive">{errors.emergencyPhone.message}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Clicking "Continue to payment" redirects to secure Stripe checkout. Suite tiers are
        all-inclusive — resort accommodations (3 nights), all meals, workshops, hackathon, Saturday
        boat tour, and resort amenities. The meals-only day pass excludes overnight accommodation.
        Golf and alcohol not included.
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Active Agentics member?</span> Enter your
        member code at checkout for $500 off a suite tier.
      </p>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Redirecting to checkout…" : "Continue to payment"}
      </Button>
    </form>
  );
}

export default function Register() {
  return (
    <>
      <SEO
        title="Register"
        description="Register for the Agentics Foundation Fall Retreat 2026 at Rocky Crest Golf Resort on Lake Joseph, Muskoka."
        path="/register"
      />
      <div className="container py-16 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">
            Join the Retreat
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Agentics Foundation Fall Retreat 2026 · Rocky Crest Golf Resort · September 18–21, 2026
          </p>
        </div>

        {/* Availability banner */}
        <div className="mb-8 rounded-lg bg-primary/8 border border-primary/25 p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-primary">Only a few rooms left — register now to secure your place</p>
            <p className="text-muted-foreground">Solo, Buddy, and Family suites, plus a meals-only day pass. Sep 18–21, 2026.</p>
          </div>
        </div>

        <Tabs defaultValue="register">
          <TabsList className="mb-8 bg-muted border border-border">
            <TabsTrigger value="interest" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Early interest</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Secure your spot</TabsTrigger>
          </TabsList>

          <TabsContent value="interest">
            <div className="mb-6">
              <h2 className="text-xl font-heading font-bold mb-1">Not ready to commit?</h2>
              <p className="text-muted-foreground text-sm">
                Leave your email and we'll notify you first when full registration opens.
              </p>
            </div>
            <EarlyInterestForm />
          </TabsContent>

          <TabsContent value="register">
            <div className="mb-6">
              <h2 className="text-xl font-heading font-bold mb-1">Full registration</h2>
              <p className="text-muted-foreground text-sm">
                Complete the form and you'll be redirected to secure Stripe checkout.
              </p>
            </div>
            <FullRegistrationForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
