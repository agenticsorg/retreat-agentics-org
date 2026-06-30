import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Laptop, Waves, Mic, MapPin, Calendar, CheckCircle, TreePine, Anchor, Zap, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { submitInterest, getInventory } from "@/lib/api";

const interestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

type InterestForm = z.infer<typeof interestSchema>;

const highlights = [
  {
    icon: Zap,
    title: "Hackathon Challenge",
    description:
      "Kick off Friday night with a hands-on hackathon — build agentic systems, compete in teams, and present on Sunday to a panel of judges.",
  },
  {
    icon: Laptop,
    title: "AI Workshops",
    description:
      "Eight curated sessions across two full days: agentic engineering, SPARC methodology, AI safety, edge deployment, and keynote by Ruv.",
  },
  {
    icon: Anchor,
    title: "Sunset Boat Tour",
    description:
      "Private cruise around Lake Joseph with Sunset Cruises on Saturday evening — Muskoka at its finest, from the water.",
  },
  {
    icon: Users,
    title: "Lakeside Networking",
    description:
      "From welcome reception to bonfire coding sessions — four days of curated connections with engineers, researchers, and founders.",
  },
];

interface TierCardProps {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  availability: string;
  highlight?: boolean;
  soldOut?: boolean;
  includedItems: string[];
}

function TierCard({ name, price, priceUnit, description, availability, highlight, soldOut, includedItems }: TierCardProps) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border p-6 gap-4 ${
        soldOut
          ? "border-border bg-muted/40"
          : highlight
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border bg-card"
      }`}
    >
      {soldOut && (
        <span className="pointer-events-none absolute right-[-52px] top-[26px] z-10 w-[180px] rotate-45 bg-destructive py-1 text-center text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-md">
          Sold Out
        </span>
      )}
      {highlight && !soldOut && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          Most popular
        </span>
      )}
      <div className={soldOut ? "opacity-60" : undefined}>
        <h3 className="text-2xl font-heading font-bold">{name}</h3>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
      <div className={soldOut ? "opacity-60" : undefined}>
        <div className="flex items-baseline gap-1.5">
          <p className={`text-4xl font-heading font-bold ${soldOut ? "line-through text-muted-foreground" : ""}`}>{price}</p>
          {priceUnit && <span className="text-sm text-muted-foreground">{priceUnit}</span>}
        </div>
      </div>
      <ul className={`space-y-2 text-sm flex-1 ${soldOut ? "opacity-60" : ""}`}>
        {includedItems.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <p className={`text-xs ${soldOut ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{availability}</p>
      {soldOut ? (
        <span className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-destructive/15 px-4 text-sm font-bold uppercase tracking-wide text-destructive">
          Sold Out
        </span>
      ) : (
        <Button asChild className="mt-2" variant={highlight ? "default" : "outline"}>
          <Link to="/register">Register now <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      )}
    </div>
  );
}

const INCLUDED_BASE = [
  "Resort accommodations (3 nights)",
  "Friday welcome reception",
  "Sat & Sun full meals (3/day)",
  "Refreshment breaks daily",
  "AI workshops & hackathon",
  "Private Lake Joseph boat tour",
  "Resort activities (canoes, kayaks…)",
  "Summit swag",
];

const INCLUDED_MEALS = [
  "Friday welcome reception",
  "Sat & Sun full meals (3/day)",
  "Refreshment breaks daily",
  "AI workshops & hackathon",
  "Private Lake Joseph boat tour",
  "Resort day activities (canoes, kayaks…)",
  "Summit swag",
  "No overnight accommodation",
];

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  // Optimistic default: only flip to sold-out on an explicit false from the API,
  // so a failed fetch never falsely blocks sponsorships (backend still guards).
  const [sponsorAvailable, setSponsorAvailable] = useState(true);

  useEffect(() => {
    getInventory()
      .then((inv) => setSponsorAvailable(inv.sponsorAvailable))
      .catch(() => {/* keep optimistic default */});
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InterestForm>({ resolver: zodResolver(interestSchema) });

  async function onInterest(data: InterestForm) {
    try {
      await submitInterest({ ...data, source: "home-banner" });
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <SEO path="/" title="Agentics Foundation: Fall Retreat 2026" />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-28 md:py-44"
        style={{
          backgroundImage: "url('https://static.wixstatic.com/media/3f22d1_34b0a76727aa4b2e94f208248ddfb0f6f000.jpg/v1/fill/w_2397,h_521,al_c,q_85,usm_0.33_1.00_0.00,enc_avif,quality_auto/3f22d1_34b0a76727aa4b2e94f208248ddfb0f6f000.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/82" />
        <div className="relative container flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Calendar className="h-3.5 w-3.5" />
            September 18–21, 2026 · Lake Joseph, Muskoka, Ontario
          </span>
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight text-white">
            Agentics Foundation<br />Fall Retreat 2026
          </h1>
          <p className="text-xl md:text-2xl text-white/80">
            Rocky Crest Golf Resort · MacTier, Muskoka · 2 hrs from Toronto
          </p>
          <p className="text-white/70 max-w-xl">
            Four days of hands-on AI workshops, a competitive hackathon, and lakeside networking
            in the heart of Muskoka cottage country on Lake Joseph. Space is limited and first come,
            first served.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button asChild size="lg" className="shadow-lg">
              <Link to="/register">
                Secure your spot <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/20 border-2 border-white/85 text-white font-semibold hover:bg-white/30 hover:text-white shadow-lg">
              <Link to="/agenda">See the agenda</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Availability urgency banner */}
      <section className="bg-primary text-primary-foreground py-3">
        <div className="container flex items-center justify-center gap-3 text-sm font-medium flex-wrap text-center">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Only a few rooms left</strong> — secure your lakeside suite before they're gone.
          </span>
          <Link to="/register" className="underline underline-offset-2 whitespace-nowrap hover:no-underline">
            Register now →
          </Link>
        </div>
      </section>

      {/* Event highlights */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            Where the Shield meets the future
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venue */}
      <section id="venue" className="py-20 bg-accent/30">
        <div className="container">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3">
                <MapPin className="h-4 w-4" />
                20 Barnwood Drive, MacTier, Ontario P0C 1H0
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Cottage country for serious builders
              </h2>
              <p className="text-muted-foreground mb-4">
                Perched on the shores of Lake Joseph in MacTier, Rocky Crest Golf Resort sits at
                the heart of Muskoka cottage country — 200 km (120 miles) north of Toronto, a
                2-hour drive from Pearson Airport via Hwy 400.
              </p>
              <p className="text-muted-foreground mb-4">
                All retreat activities, accommodations, and meals unfold on the resort grounds.
                Whether you're deep in a workshop, paddling out on Lake Joseph at sunrise, or
                coding by the bonfire under a sky full of stars — Rocky Crest gives you the space
                to think differently.
              </p>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {[
                  "Lake Joseph waterfront",
                  "High-speed Wi-Fi",
                  "Muskoka-inspired dining",
                  "Canoes & kayaks included",
                  "Paddle boards & paddle boats",
                  "Hiking trails",
                  "Beach volleyball & tennis",
                  "Fitness room & putting green",
                ].map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {amenity}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Golf course fees are optional and not included. Alcohol available at cash bar.
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://static.wixstatic.com/media/692408_756211e05a7641608a877d5c360b9ea5~mv2_d_1245_1875_s_2.jpg/v1/fill/w_2036,h_1145,q_90,enc_avif,quality_auto/692408_756211e05a7641608a877d5c360b9ea5~mv2_d_1245_1875_s_2.jpg"
                  alt="Lake Joseph view from Rocky Crest Golf Resort, MacTier, Muskoka"
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <p className="text-white text-sm font-medium">Lake Joseph · Rocky Crest Golf Resort, MacTier, Muskoka</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative rounded-xl overflow-hidden shadow aspect-video">
                  <img
                    src="https://static.wixstatic.com/media/692408_03962668ac1549d3945c59040a03a0fa~mv2_d_1875_1255_s_2.jpg/v1/fill/w_2044,h_1150,q_90,enc_avif,quality_auto/692408_03962668ac1549d3945c59040a03a0fa~mv2_d_1875_1255_s_2.jpg"
                    alt="Rocky Crest Golf Resort grounds"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="relative rounded-xl overflow-hidden shadow aspect-video">
                  <img
                    src="https://www.sunsetcruises.ca/wp-content/uploads/2024/04/slide2-2.jpg"
                    alt="Sunset boat cruise on Lake Joseph with Sunset Cruises"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-2">
                    <p className="text-white text-xs">Saturday boat tour</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-sm">
                <p className="font-semibold flex items-center gap-2"><TreePine className="h-4 w-4 text-primary" /> Getting there</p>
                <p className="text-muted-foreground">
                  200 km north of Toronto via Hwy 400 / Hwy 69 — approximately 2 hours from
                  Pearson International (YYZ). Group shuttles from Toronto will be arranged for
                  registered attendees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket tiers */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
              Choose your Muskoka experience
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Suite tiers are all-inclusive: accommodations, meals, workshops, hackathon, boat tour,
              and resort activities. Prefer to commute? Grab the meals-only day pass. Only a few
              rooms left.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Golf fees and alcohol not included.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <TierCard
              name="Solo"
              price="$2,000"
              priceUnit="USD / person"
              description="Private 1-bedroom suite for a solo attendee."
              availability="0 rooms left — sold out"
              soldOut
              includedItems={INCLUDED_BASE}
            />
            <TierCard
              name="Buddy"
              price="$1,700"
              priceUnit="USD / person"
              description="Two attendees sharing a 2-bedroom suite. Both must register together."
              availability="Only 10 rooms left"
              highlight
              includedItems={INCLUDED_BASE}
            />
            <TierCard
              name="Family"
              price="$2,300"
              priceUnit="USD + $450/person"
              description="2-bedroom suite for your group. First person + $450 per additional attendee."
              availability="Only 6 rooms left"
              includedItems={INCLUDED_BASE}
            />
            <TierCard
              name="Meals & Sessions"
              price="$450"
              priceUnit="USD / person"
              description="Day pass for local or commuting guests — all meals and sessions, no overnight room."
              availability="No accommodation included"
              includedItems={INCLUDED_MEALS}
            />
          </div>
        </div>
      </section>

      {/* Sponsor / scholarship tier */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl mx-auto">
          <div className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
            sponsorAvailable ? "border-primary/30 bg-primary/5" : "border-border bg-muted/40"
          }`}>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-xs font-semibold ${
              sponsorAvailable
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}>
              <Mic className="h-3.5 w-3.5" /> {sponsorAvailable ? "Sponsor a Scholarship" : "Sponsorships — Sold Out"}
            </span>
            <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-heading font-bold">Sponsor the summit, fund two scholarships</h3>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Put your name behind the next generation of agentic engineers. The sponsor package
                  gives you a stage and brings two scholarship participants to Lake Joseph on you.
                </p>
                <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
                  {[
                    "Keynote speaking slot at the summit",
                    "A Family suite, all meals for you and your guests",
                    "Two Buddy-room scholarship participants covered",
                    "All meals & activities for your scholars",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:text-right shrink-0">
                {sponsorAvailable ? (
                  <>
                    <p className="text-4xl font-heading font-bold">$6,000 <span className="text-sm font-normal text-muted-foreground">USD</span></p>
                    <Button asChild className="mt-4">
                      <Link to="/register">Become a sponsor <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-heading font-bold text-muted-foreground line-through">$6,000</p>
                    <span className="mt-4 inline-flex items-center justify-center rounded-md bg-destructive/15 px-5 py-2 text-sm font-bold uppercase tracking-wide text-destructive">
                      Sold Out
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground max-w-[14rem] lg:ml-auto">
                      The rooms this package needs are fully booked.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule preview */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            4 days on Lake Joseph
          </h2>
          <div className="relative border-l-2 border-primary/30 pl-8 space-y-10">
            {[
              {
                day: "Day 1",
                date: "Friday, Sept 18",
                events: ["Check-in opens at 4 pm", "Welcome reception", "Hackathon challenge kickoff"],
              },
              {
                day: "Day 2",
                date: "Saturday, Sept 19",
                events: [
                  "4 workshop sessions: Agentic engineering + guest speakers",
                  "Keynote by Ruv",
                  "Three Muskoka-inspired meals",
                  "Private sunset boat tour — Lake Joseph with Sunset Cruises",
                  "Coding by bonfire",
                ],
              },
              {
                day: "Day 3",
                date: "Sunday, Sept 20",
                events: [
                  "4 workshop sessions: Advanced agentic engineering",
                  "Agentics on the edge (edge AI / chips)",
                  "Three Muskoka-inspired meals",
                  "Hackathon presentations to judges panel",
                ],
              },
              {
                day: "Day 4",
                date: "Monday, Sept 21",
                events: ["Wrap-up session", "Resort checkout"],
              },
            ].map(({ day, date, events }) => (
              <div key={day} className="relative">
                <div className="absolute -left-10 top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                <p className="text-xs font-medium text-primary uppercase tracking-wider">{day}</p>
                <h3 className="text-xl font-heading font-bold mb-3">{date}</h3>
                <ul className="space-y-1.5">
                  {events.map((e) => (
                    <li key={e} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link to="/agenda">View full agenda</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Rooms preview */}
      <section className="py-20 bg-accent/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-10">
            Lakeside accommodations
          </h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://static.wixstatic.com/media/3f22d1_b7492156734c456fb55020cb87d5f3a1~mv2.jpg/v1/fit/w_1390,h_928,q_90,enc_avif,quality_auto/3f22d1_b7492156734c456fb55020cb87d5f3a1~mv2.jpg"
                alt="1-bedroom suite at Rocky Crest Golf Resort"
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 space-y-4 text-sm text-muted-foreground">
              <h3 className="text-xl font-heading font-bold text-foreground">Private suites on the lake</h3>
              <p>
                All attendees stay on-site at Rocky Crest Golf Resort. Naturally lit rooms with
                large windows opening onto the Muskoka landscape. All suites include resort access
                to canoes, kayaks, paddle boards, hiking trails, and the beach.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Solo: private 1-bedroom suite (sold out)",
                  "Buddy: shared 2-bedroom suite, register as a pair (10 left)",
                  "Family: exclusive 2-bedroom suite for your group (6 left)",
                  "Meals-only day pass: attend without an overnight room",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link to="/register">Reserve your suite <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Early interest banner */}
      <section className="py-20 bg-accent/40 border-y border-accent">
        <div className="container max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            Save my Muskoka chair
          </h2>
          <p className="text-muted-foreground mb-6">
            Get first access and updates when spots open. No spam, no obligation — just a seat by the dock.
          </p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-primary font-medium">
              <CheckCircle className="h-5 w-5" />
              You're on the list! We'll email you first when tickets open.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onInterest)} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1 text-left">
                <Label htmlFor="interest-email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="interest-email"
                  placeholder="your@email.com"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Notify me"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
