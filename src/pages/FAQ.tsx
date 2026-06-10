import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { contactRetreat } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Please enter a message (at least 10 characters)"),
});
type ContactForm = z.infer<typeof contactSchema>;

function ContactForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactForm) {
    try {
      await contactRetreat(data);
      setSent(true);
    } catch {
      toast.error("Failed to send — please try again or email support@agentics.org directly.");
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Message sent. We'll get back to you within one business day.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" placeholder="Jane Smith" {...register("name")} className="mt-1" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" type="email" placeholder="jane@example.com" {...register("email")} className="mt-1" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          rows={4}
          placeholder="Your question…"
          {...register("message")}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

interface FaqItem {
  question: string;
  answer: string | JSX.Element;
}

const faqs: FaqItem[] = [
  {
    question: "What's included in the price?",
    answer: (
      <>
        <p>All tiers are all-inclusive for the retreat dates (September 18–21, 2026):</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Resort accommodations (3 nights at Rocky Crest Golf Resort)</li>
          <li>Friday evening welcome reception</li>
          <li>Saturday &amp; Sunday: breakfast, lunch, and dinner (Muskoka-inspired)</li>
          <li>Two refreshment breaks per day (Sat &amp; Sun)</li>
          <li>All AI workshops (8 sessions across 2 days)</li>
          <li>Hackathon challenge (Fri–Sun)</li>
          <li>Private Saturday sunset boat tour on Lake Joseph (Sunset Cruises)</li>
          <li>All resort amenities: canoes, kayaks, paddle boards, paddle boats, hiking trails, fitness room, beach volleyball, basketball, tennis, putting green</li>
          <li>Summit swag</li>
        </ul>
        <p className="mt-2 text-xs font-medium">Not included: golf course fees (optional add-on) and alcohol (cash bar available).</p>
        <p className="mt-2 text-xs font-medium">The meals-only day pass ($450) includes everything above except overnight accommodation.</p>
      </>
    ),
  },
  {
    question: "What are the pricing tiers?",
    answer: (
      <>
        <p>All prices are in USD. Only a few rooms remain — first come, first served.</p>
        <ul className="mt-2 space-y-2 list-disc list-inside">
          <li>
            <strong>Solo</strong> — Private 1-bedroom suite: <strong>$2,000</strong> per person. Only 2 rooms left.
          </li>
          <li>
            <strong>Buddy</strong> — Shared 2-bedroom suite (register as a pair): <strong>$1,700</strong> per person. Only 10 rooms left.
          </li>
          <li>
            <strong>Family</strong> — Exclusive 2-bedroom suite: <strong>$2,300</strong> first person
            + <strong>$450</strong> per additional attendee. Only 6 rooms left.
          </li>
          <li>
            <strong>Meals &amp; Sessions</strong> — Day pass: <strong>$450</strong> per person. All meals
            and sessions with <em>no overnight accommodation</em> — ideal for local or commuting guests.
          </li>
          <li>
            <strong>Sponsor (Scholarship)</strong> — <strong>$6,000</strong>: a keynote speaking slot, a
            Family suite for you, plus full coverage (room + meals) for two Buddy-room scholarship
            participants. Our team follows up to coordinate the keynote and scholarship recipients.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Are there member discounts or promo codes?",
    answer:
      "Yes — active Agentics members receive $500 off a suite tier (Solo, Buddy, or Family). Enter your member code in the promo-code field on the secure Stripe checkout page and the discount is applied automatically. The discount does not apply to the meals-only day pass. Not a member yet? Email retreat@agentics.org.",
  },
  {
    question: "Can I attend at the Buddy rate without a partner?",
    answer:
      "No — the Buddy rate requires two attendees to register together and share a 2-bedroom suite. Both must complete registration and provide each other's email. Solo attendees should select the Solo tier.",
  },
  {
    question: "Is there a cancellation policy?",
    answer:
      "Cancellations made more than 60 days before the event (before July 19, 2026) receive a full refund less a $150 processing fee. Cancellations 30–60 days out receive a 50% refund. No refunds within 30 days of the event, but you may transfer your registration to another attendee at no charge by emailing retreat@agentics.org.",
  },
  {
    question: "What is the dress code?",
    answer:
      "Smart casual for workshop sessions and evening events. Resort casual (comfortable outdoor clothing, closed-toe shoes) for morning activities like kayaking and hiking. No formal dress requirements.",
  },
  {
    question: "How do I get to Rocky Crest Golf Resort?",
    answer: (
      <>
        <p>Rocky Crest Golf Resort is at 20 Barnwood Drive, MacTier, Ontario P0C 1H0 — approximately 200 km (120 miles) north of Toronto, a 2-hour drive from Pearson International Airport (YYZ) via Hwy 400 / Hwy 69.</p>
        <p className="mt-2">Group shuttles from Toronto will be arranged for registered attendees — details will be emailed 4 weeks before the retreat. Rental car and rideshare options are also available.</p>
      </>
    ),
  },
  {
    question: "Is there Wi-Fi at the resort?",
    answer:
      "Yes — Rocky Crest Golf Resort provides wireless high-speed internet throughout all indoor spaces including guest rooms, the meeting rooms (all with large windows), and common areas. Outdoor lakeside areas may have limited connectivity.",
  },
  {
    question: "What's the hackathon about?",
    answer:
      "The hackathon runs Friday evening through Sunday afternoon. Teams form on Friday night, build agentic systems over the weekend (solo or in groups of up to 4), and present to a judges panel Sunday afternoon. Prizes are awarded at the Sunday evening dinner. The challenge brief is revealed at kickoff.",
  },
  {
    question: "What is the Saturday boat tour?",
    answer: (
      <>
        <p>On Saturday evening, Sunset Cruises provides a private boat tour for all retreat attendees around Lake Joseph — one of Muskoka's most scenic lakes. The tour departs after dinner and runs approximately 90 minutes.</p>
        <p className="mt-2">The boat tour is included in all ticket tiers at no additional cost.</p>
      </>
    ),
  },
  {
    question: "What dietary needs can be accommodated?",
    answer:
      "Rocky Crest's kitchen can accommodate most dietary requirements including vegetarian, vegan, gluten-free, nut-free, kosher, and halal. Please specify requirements during registration. For severe allergies, contact retreat@agentics.org so we can coordinate with the catering team directly.",
  },
  {
    question: "Can I extend my stay beyond the retreat dates?",
    answer:
      "Yes — registered attendees may arrange extended stays at a preferential group rate by contacting Rocky Crest Golf Resort directly and referencing the Agentics Foundation Retreat. The resort is popular in September, so book early.",
  },
  {
    question: "Will sessions be recorded?",
    answer:
      "Selected keynotes and workshops may be recorded with speaker consent and shared with registered attendees after the event. Recording availability will be confirmed in the pre-retreat guide sent to all attendees.",
  },
  {
    question: "Is golf included?",
    answer:
      "Golf at Rocky Crest Golf Course is not included in the retreat price but is available as an optional add-on. The course is on-site and bookings can be made directly with the resort. Expect peak-season rates.",
  },
];

function FaqAccordionItem({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium gap-4 hover:text-primary transition-colors"
        aria-expanded={open}
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm text-muted-foreground leading-relaxed pr-8">
          {typeof answer === "string" ? <p>{answer}</p> : answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <>
      <SEO
        title="FAQ"
        description="Frequently asked questions about the Agentics Foundation Fall Retreat 2026 — pricing, member discounts, rooms, hackathon, boat tour, travel, and dietary needs."
        path="/faq"
      />
      <div className="container py-16 max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">
            Frequently asked questions
          </h1>
          <p className="text-muted-foreground">
            Can't find your answer? Send us a message below and we'll get back to you within one business day.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y-0 px-2">
          {faqs.map((faq) => (
            <FaqAccordionItem key={faq.question} {...faq} />
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-heading font-bold mb-1">Still have questions?</h2>
          <p className="text-sm text-muted-foreground">
            Send us a message and we'll reply within one business day.
          </p>
          <ContactForm />
        </div>

        <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="font-semibold mb-1">Ready to join us on Lake Joseph?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Only a few rooms left — secure your suite before they're gone.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Register for the retreat
          </Link>
        </div>
      </div>
    </>
  );
}
