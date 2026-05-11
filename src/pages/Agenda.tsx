import { Coffee, Utensils, Sunset, Mic, BookOpen, Users, Waves, Star, Zap } from "lucide-react";
import SEO from "@/components/SEO";
import { Separator } from "@shared/components/ui/separator";

interface AgendaItem {
  time: string;
  title: string;
  description?: string;
  type: "keynote" | "workshop" | "social" | "meal" | "activity" | "logistics" | "hackathon";
}

interface DaySchedule {
  day: string;
  date: string;
  tagline: string;
  items: AgendaItem[];
}

const schedule: DaySchedule[] = [
  {
    day: "Day 1",
    date: "Friday, September 18, 2026",
    tagline: "Arrival, welcome & hackathon kickoff",
    items: [
      {
        time: "4:00 pm",
        title: "Resort check-in opens",
        description: "Check in at Rocky Crest Golf Resort reception. Your room key and welcome pack will be ready.",
        type: "logistics",
      },
      {
        time: "4:00 pm – 6:00 pm",
        title: "Orientation & free time",
        description: "Explore the Lake Joseph waterfront, meet fellow attendees informally, and settle in. Canoes and kayaks available.",
        type: "activity",
      },
      {
        time: "6:30 pm",
        title: "Welcome reception & dinner",
        description: "Join the full cohort for a lakeside welcome reception. Opening remarks from the Agentics Foundation team.",
        type: "meal",
      },
      {
        time: "8:30 pm",
        title: "Hackathon challenge kickoff",
        description:
          "Team formation and challenge brief. Build agentic systems over the weekend — present your work Sunday afternoon to a panel of judges. Prizes awarded.",
        type: "hackathon",
      },
    ],
  },
  {
    day: "Day 2",
    date: "Saturday, September 19, 2026",
    tagline: "Full programme day + sunset boat tour",
    items: [
      {
        time: "7:00 am – 8:00 am",
        title: "Optional morning activity",
        description: "Guided kayaking on Lake Joseph, a forest hike, or resort leisure. Equipment provided.",
        type: "activity",
      },
      {
        time: "8:00 am",
        title: "Breakfast",
        description: "First of three Muskoka-inspired meals today.",
        type: "meal",
      },
      {
        time: "9:00 am – 10:15 am",
        title: "Agentics Foundation welcome & opening keynote",
        description:
          "Welcome from the Agentics Foundation. Keynote by Ruv: the state of agentic AI and where we're headed.",
        type: "keynote",
      },
      {
        time: "10:15 am – 10:30 am",
        title: "Refreshment break",
        type: "meal",
      },
      {
        time: "10:30 am – 12:00 pm",
        title: "Workshop 1: Agentic Engineering",
        description:
          "Hands-on introduction to building reliable multi-agent systems — orchestration patterns, communication protocols, and failure modes. Bring your laptop.",
        type: "workshop",
      },
      {
        time: "12:00 pm – 1:00 pm",
        title: "Lunch",
        description: "Muskoka-inspired lakeside lunch. Facilitated topic tables for structured networking.",
        type: "meal",
      },
      {
        time: "1:00 pm – 2:30 pm",
        title: "Workshop 2: SPARC Methodology",
        description:
          "Deep dive into Specification, Pseudocode, Architecture, Refinement, Completion — the SPARC framework for reliable AI system development.",
        type: "workshop",
      },
      {
        time: "2:30 pm – 2:45 pm",
        title: "Refreshment break",
        type: "meal",
      },
      {
        time: "2:45 pm – 4:15 pm",
        title: "Workshop 3: Guest speaker session",
        description:
          "Guest speakers from the front lines of agentic AI — deployment, scaling, and real-world lessons learned.",
        type: "workshop",
      },
      {
        time: "4:15 pm – 5:30 pm",
        title: "Workshop 4: AI Safety & Alignment in Practice",
        description:
          "Practical alignment approaches for deployed agentic systems — evaluation frameworks, red-teaming, and guardrails that actually hold.",
        type: "workshop",
      },
      {
        time: "5:30 pm – 6:30 pm",
        title: "Free time & hackathon work",
        description: "Dock time, resort activities, or head back to the room to advance your hackathon project.",
        type: "activity",
      },
      {
        time: "6:30 pm",
        title: "Dinner",
        description: "Muskoka-inspired dinner at the resort waterfront.",
        type: "meal",
      },
      {
        time: "8:00 pm",
        title: "Private Sunset Boat Tour — Lake Joseph",
        description:
          "Exclusive private cruise around Lake Joseph with Sunset Cruises. Watch the Muskoka sunset from the water with the full cohort.",
        type: "social",
      },
      {
        time: "After boat tour",
        title: "Coding by bonfire",
        description: "Return to resort for informal bonfire sessions — hack, network, or just enjoy the Muskoka night sky.",
        type: "hackathon",
      },
    ],
  },
  {
    day: "Day 3",
    date: "Sunday, September 20, 2026",
    tagline: "Advanced sessions & hackathon presentations",
    items: [
      {
        time: "7:00 am – 8:00 am",
        title: "Optional morning activity",
        description: "Sunrise paddle on Lake Joseph, guided hike, or resort leisure.",
        type: "activity",
      },
      {
        time: "8:00 am",
        title: "Breakfast",
        description: "First of three Muskoka-inspired meals today.",
        type: "meal",
      },
      {
        time: "9:00 am – 10:30 am",
        title: "Workshop 5: Advanced Agentic Engineering",
        description:
          "Production-grade patterns for large-scale agent systems — memory architectures, cross-agent coordination, and Byzantine fault tolerance.",
        type: "workshop",
      },
      {
        time: "10:30 am – 10:45 am",
        title: "Refreshment break",
        type: "meal",
      },
      {
        time: "10:45 am – 12:15 pm",
        title: "Workshop 6: Agentics on the Edge",
        description:
          "Running agentic AI on edge hardware — chips, on-device inference, Muskoka's own Canadian Shield as a metaphor for resilient distributed systems.",
        type: "workshop",
      },
      {
        time: "12:15 pm – 1:15 pm",
        title: "Lunch",
        description: "Muskoka-inspired lakeside lunch.",
        type: "meal",
      },
      {
        time: "1:15 pm – 2:45 pm",
        title: "Workshop 7: Open space & lightning talks",
        description:
          "Attendee-led sessions. Propose a topic in the morning, run it in the afternoon. 5-minute lightning talks welcome.",
        type: "workshop",
      },
      {
        time: "2:45 pm – 3:00 pm",
        title: "Refreshment break",
        type: "meal",
      },
      {
        time: "3:00 pm – 4:30 pm",
        title: "Hackathon presentations",
        description:
          "Teams present their agentic systems to a panel of judges. Q&A and scoring. Winners announced at dinner.",
        type: "hackathon",
      },
      {
        time: "6:30 pm",
        title: "Dinner & awards",
        description: "Closing dinner with hackathon awards ceremony and closing remarks.",
        type: "meal",
      },
      {
        time: "Evening",
        title: "Bonfire & farewells",
        description: "Informal lakeside bonfire to close out the weekend.",
        type: "social",
      },
    ],
  },
  {
    day: "Day 4",
    date: "Monday, September 21, 2026",
    tagline: "Wrap-up & checkout",
    items: [
      {
        time: "8:00 am – 9:00 am",
        title: "Breakfast",
        type: "meal",
      },
      {
        time: "9:00 am – 10:30 am",
        title: "Workshop 8: Wrap-up & what's next",
        description:
          "Closing session: key takeaways, community next steps, and the Agentics Foundation roadmap for 2027.",
        type: "keynote",
      },
      {
        time: "10:30 am",
        title: "Resort checkout",
        description: "Check out by 11 am. Luggage storage available until evening for those extending their stay.",
        type: "logistics",
      },
      {
        time: "Ongoing",
        title: "Optional extended stay",
        description:
          "Rocky Crest Golf Resort offers extended stays at a preferential rate for retreat attendees. Book directly with the resort.",
        type: "activity",
      },
    ],
  },
];

const typeConfig: Record<AgendaItem["type"], { icon: typeof Mic; color: string; label: string }> = {
  keynote:   { icon: Mic,     color: "text-primary bg-primary/10",                               label: "Keynote / Talk" },
  workshop:  { icon: BookOpen, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",          label: "Workshop" },
  social:    { icon: Users,   color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",        label: "Networking" },
  meal:      { icon: Utensils, color: "text-green-600 bg-green-50 dark:bg-green-950/30",          label: "Dining" },
  activity:  { icon: Waves,   color: "text-sky-600 bg-sky-50 dark:bg-sky-950/30",                 label: "Activity" },
  logistics: { icon: Coffee,  color: "text-muted-foreground bg-muted",                            label: "Logistics" },
  hackathon: { icon: Zap,     color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",        label: "Hackathon" },
};

void Sunset;

export default function Agenda() {
  return (
    <>
      <SEO
        title="Agenda"
        description="Full 4-day programme for the Agentics Foundation Fall Retreat 2026 at Rocky Crest Golf Resort, Muskoka — workshops, keynotes, hackathon, and a Lake Joseph boat tour."
        path="/agenda"
      />
      <div className="container py-16 max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3">Retreat agenda</h1>
          <p className="text-muted-foreground">
            September 18–21, 2026 · Rocky Crest Golf Resort · Lake Joseph, MacTier, Muskoka
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Initial agenda drafted by Claude · Subject to change
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-10">
          {Object.entries(typeConfig).map(([, { color, label, icon: Icon }]) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>

        <div className="space-y-14">
          {schedule.map(({ day, date, tagline, items }, dayIdx) => (
            <section key={day}>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">{day}</span>
                <h2 className="text-2xl font-heading font-bold">{date}</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6 -mt-4 italic">{tagline}</p>

              <div className="space-y-1">
                {items.map((item, idx) => {
                  const { icon: Icon, color } = typeConfig[item.type];
                  return (
                    <div key={`${dayIdx}-${idx}`} className="flex gap-4 py-4">
                      <div className="w-28 shrink-0 pt-0.5">
                        <p className="text-xs font-medium text-muted-foreground leading-snug">
                          {item.time}
                        </p>
                      </div>
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div
                          className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-snug">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {dayIdx < schedule.length - 1 && <Separator className="mt-6" />}
            </section>
          ))}
        </div>

        {/* Note */}
        <div className="mt-12 rounded-xl border border-border bg-muted/40 p-5 flex gap-3 text-sm text-muted-foreground">
          <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>
            Programme subject to change — initial agenda drafted by Claude. Registered attendees
            receive the confirmed agenda 2 weeks before the retreat. Want to propose a lightning
            talk or workshop?{" "}
            <a href="mailto:support@agentics.org" className="text-primary underline underline-offset-2">
              Email us
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
