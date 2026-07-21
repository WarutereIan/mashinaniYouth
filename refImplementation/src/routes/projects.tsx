import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Megaphone,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  TreePine,
  Trophy,
  ArrowRight,
  Search,
  X,
  PlayCircle,
  Newspaper,
  Camera,
  ExternalLink,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import youthBarazaImg from "@/assets/projects/youth-baraza.jpg";
import pr1 from "@/assets/projects/pr1.jpg";
import pr2 from "@/assets/projects/pr2.jpg";
import pr3 from "@/assets/projects/pr3.jpg";
import pr4 from "@/assets/projects/pr4.jpg";
import pr5 from "@/assets/projects/pr5.jpg";
import pr6 from "@/assets/projects/pr6.jpg";
import pr7 from "@/assets/projects/pr7.jpg";
import pr8 from "@/assets/projects/pr8.jpg";
import pr9 from "@/assets/projects/pr9.jpg";
import pr10 from "@/assets/projects/pr10.jpg";
import m1 from "@/assets/media/m1.jpg";
import m2 from "@/assets/media/m2.jpg";
import m3 from "@/assets/media/m3.jpg";
import m4 from "@/assets/media/m4.jpg";
import m5 from "@/assets/media/m5.jpg";
import m6 from "@/assets/media/m6.jpg";
import m7 from "@/assets/media/m7.jpg";
import m8 from "@/assets/media/m8.jpg";
import m9 from "@/assets/media/m9.jpg";
import b1 from "@/assets/barazas/b1.jpg";
import b2 from "@/assets/barazas/b2.jpg";
import b3 from "@/assets/barazas/b3.jpg";
import b4 from "@/assets/barazas/b4.jpg";
import b5 from "@/assets/barazas/b5.jpg";
import b6 from "@/assets/barazas/b6.jpg";
import b7 from "@/assets/barazas/b7.jpg";
import b8 from "@/assets/barazas/b8.jpg";
import b9 from "@/assets/barazas/b9.jpg";
import b10 from "@/assets/barazas/b10.jpg";

const POSTERS: Record<string, string> = {
  pr1, pr2, pr3, pr4, pr5, pr6, pr7, pr8, pr9, pr10,
};

const MEDIA_IMAGES: Record<string, string> = {
  m1, m2, m3, m4, m5, m6, m7, m8, m9,
};

const BARAZA_IMAGES: Record<string, string> = {
  b1, b2, b3, b4, b5, b6, b7, b8, b9, b10,
};

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Kazi — Activities, Barazas & Media | MY-KDM" },
      {
        name: "description",
        content:
          "MY-KDM Kazi: upcoming activities, county-level Project Youth Barazas on government projects, and media coverage of the movement.",
      },
      { property: "og:title", content: "Kazi — Activities, Barazas & Media | MY-KDM" },
      {
        property: "og:description",
        content:
          "See what MY-KDM is doing on the ground — activities, youth barazas on government projects across counties, and press coverage.",
      },
    ],
  }),
  component: ProjectsPage,
});

type Category =
  | "Launch"
  | "Empowerment"
  | "Education"
  | "Philanthropy"
  | "Sports"
  | "Advocacy";

type Status = "Upcoming" | "Ongoing" | "Recurring";

type Project = {
  id: string;
  title: string;
  category: Category;
  status: Status;
  date: string;
  dateISO: string; // for sorting/filtering
  venue: string;
  region: string;
  summary: string;
};

const PROJECTS: Project[] = [
  {
    id: "pr1",
    title: "MY-KDM National Launch & Youth Convention",
    category: "Launch",
    status: "Upcoming",
    date: "Sat, 18 Jul 2026 · 09:00 EAT",
    dateISO: "2026-07-18",
    venue: "Kasarani Sports Complex, Nairobi",
    region: "Nairobi",
    summary:
      "Official unveiling of the movement, secretariat and the national elections roadmap. Free entry for registered voters.",
  },
  {
    id: "pr2",
    title: "Regional Elections Kick-off — Nyanza",
    category: "Launch",
    status: "Upcoming",
    date: "Tue, 21 Jul 2026 · 08:00–18:00 EAT",
    dateISO: "2026-07-21",
    venue: "Jomo Kenyatta Sports Ground, Kisumu",
    region: "Nyanza",
    summary:
      "First region to vote in the MY-KDM ward-to-national elections cycle. All Nyanza counties polling on the same day.",
  },
  {
    id: "pr3",
    title: "Kazi Kwa Vijana Job Fair",
    category: "Empowerment",
    status: "Upcoming",
    date: "Sat, 09 Aug 2026 · 09:00–17:00 EAT",
    dateISO: "2026-08-09",
    venue: "Uhuru Gardens, Nairobi",
    region: "Nairobi",
    summary:
      "500+ employers and TVETs hiring on the spot. CV clinics, interview coaching and on-site NHIF/NSSF registration.",
  },
  {
    id: "pr4",
    title: "Coast Youth Entrepreneurship Bootcamp",
    category: "Education",
    status: "Upcoming",
    date: "Mon, 25 Aug – Fri, 29 Aug 2026",
    dateISO: "2026-08-25",
    venue: "Technical University of Mombasa",
    region: "Coast",
    summary:
      "Five-day intensive on business modelling, digital marketing and access to finance — 200 seats, bursaries available.",
  },
  {
    id: "pr5",
    title: "Rift Valley Tree-Planting Drive",
    category: "Philanthropy",
    status: "Recurring",
    date: "Sat, 06 Sep 2026 · 08:00 EAT",
    dateISO: "2026-09-06",
    venue: "Menengai Forest, Nakuru",
    region: "Rift Valley",
    summary:
      "50,000 indigenous seedlings planted with KFS and county governments. Ward youth units lead the delivery.",
  },
  {
    id: "pr6",
    title: "MY-KDM Ward Football Cup",
    category: "Sports",
    status: "Recurring",
    date: "Sep–Nov 2026 · Weekends",
    dateISO: "2026-09-12",
    venue: "Ward playgrounds, all 47 counties",
    region: "Nationwide",
    summary:
      "Ward-level tournaments feeding into county and national finals. Sponsor kits provided to top ward teams.",
  },
  {
    id: "pr7",
    title: "Western Youth Scholarship Fund Walk",
    category: "Philanthropy",
    status: "Upcoming",
    date: "Sat, 12 Sep 2026 · 07:00 EAT",
    dateISO: "2026-09-12",
    venue: "Muliro Gardens, Kakamega",
    region: "Western",
    summary:
      "10km charity walk raising bursaries for 300 university and TVET students across the Western region.",
  },
  {
    id: "pr8",
    title: "Central Kenya Mentorship Weekend",
    category: "Education",
    status: "Upcoming",
    date: "Sat, 19 Sep 2026 · 09:00–16:00 EAT",
    dateISO: "2026-09-19",
    venue: "Dedan Kimathi University, Nyeri",
    region: "Central",
    summary:
      "1-on-1 mentorship with MY-KDM patrons — MPs, CEOs and creatives — for 500 shortlisted young leaders.",
  },
  {
    id: "pr9",
    title: "Northern Kenya Peace & Opportunity Caravan",
    category: "Advocacy",
    status: "Upcoming",
    date: "Mon, 05 Oct – Fri, 09 Oct 2026",
    dateISO: "2026-10-05",
    venue: "Garissa → Wajir → Mandera",
    region: "North Eastern",
    summary:
      "Five-day cross-county caravan on peace-building, digital jobs and inclusion of pastoralist youth.",
  },
  {
    id: "pr10",
    title: "Eastern Innovation Expo",
    category: "Empowerment",
    status: "Upcoming",
    date: "Sat, 17 Oct 2026 · 10:00–18:00 EAT",
    dateISO: "2026-10-17",
    venue: "Machakos People's Park, Machakos",
    region: "Eastern",
    summary:
      "Showcase for youth-led innovations in agri-tech, climate and manufacturing. Seed grants for top 10 pitches.",
  },
];

const CATEGORY_META: Record<Category, { Icon: typeof Briefcase; classes: string }> = {
  Launch: { Icon: Megaphone, classes: "bg-flag-red/10 text-flag-red border-flag-red/30" },
  Empowerment: { Icon: Briefcase, classes: "bg-primary/10 text-primary border-primary/30" },
  Education: { Icon: GraduationCap, classes: "bg-accent/10 text-accent border-accent/30" },
  Philanthropy: { Icon: TreePine, classes: "bg-accent/10 text-accent border-accent/30" },
  Sports: { Icon: Trophy, classes: "bg-primary/10 text-primary border-primary/30" },
  Advocacy: { Icon: HeartHandshake, classes: "bg-flag-red/10 text-flag-red border-flag-red/30" },
};

const STATUS_CLASSES: Record<Status, string> = {
  Upcoming: "bg-primary/10 text-primary border-primary/30",
  Ongoing: "bg-accent/10 text-accent border-accent/30",
  Recurring: "bg-flag-red/10 text-flag-red border-flag-red/30",
};

const REGIONS = [
  "All regions",
  ...Array.from(new Set(PROJECTS.map((p) => p.region))).sort(),
];

type MediaKind = "Print" | "Video" | "Pictorial";
type Platform = "YouTube" | "Instagram" | "X" | "Facebook" | "TikTok" | "Web";

type MediaItem = {
  id: string;
  kind: MediaKind;
  outlet: string;
  title: string;
  date: string;
  href: string;
  platform: Platform;
};

const MEDIA: MediaItem[] = [
  {
    id: "m1",
    kind: "Print",
    outlet: "Daily Nation",
    title: "MY-KDM launches nationwide ward-to-national youth elections",
    date: "12 Jul 2026",
    href: "https://nation.africa/kenya/news/my-kdm-launches-nationwide-youth-elections",
    platform: "Web",
  },
  {
    id: "m2",
    kind: "Video",
    outlet: "Citizen TV",
    title: "Inside Kenya's first fully digital youth movement",
    date: "10 Jul 2026",
    href: "https://www.youtube.com/results?search_query=Citizen+TV+MY-KDM+digital+youth+movement",
    platform: "YouTube",
  },
  {
    id: "m3",
    kind: "Print",
    outlet: "The Standard",
    title: "Kutoka Ground Hadi Top: the manifesto behind MY-KDM",
    date: "08 Jul 2026",
    href: "https://www.standardmedia.co.ke/search?q=MY-KDM+manifesto",
    platform: "Web",
  },
  {
    id: "m4",
    kind: "Pictorial",
    outlet: "MY-KDM Newsroom",
    title: "Nyanza registration drive in pictures",
    date: "05 Jul 2026",
    href: "https://www.instagram.com/explore/tags/mykdm/",
    platform: "Instagram",
  },
  {
    id: "m5",
    kind: "Video",
    outlet: "KTN News",
    title: "MY-KDM secretariat unveiled at Kasarani",
    date: "01 Jul 2026",
    href: "https://www.youtube.com/results?search_query=KTN+News+MY-KDM+secretariat+Kasarani",
    platform: "YouTube",
  },
  {
    id: "m6",
    kind: "Print",
    outlet: "Business Daily",
    title: "Equity, Comcraft back youth delivery movement",
    date: "28 Jun 2026",
    href: "https://www.businessdailyafrica.com/bd/search?query=MY-KDM",
    platform: "Web",
  },
  {
    id: "m7",
    kind: "Pictorial",
    outlet: "MY-KDM on X",
    title: "Ward launch highlights — Coast region thread",
    date: "22 Jun 2026",
    href: "https://x.com/search?q=%23MYKDM&f=media",
    platform: "X",
  },
  {
    id: "m8",
    kind: "Pictorial",
    outlet: "MY-KDM Facebook",
    title: "Rift Valley tree-planting drive album",
    date: "18 Jun 2026",
    href: "https://www.facebook.com/hashtag/mykdm",
    platform: "Facebook",
  },
  {
    id: "m9",
    kind: "Video",
    outlet: "NTV Kenya",
    title: "The MY-KDM story — a special feature",
    date: "15 Jun 2026",
    href: "https://www.youtube.com/results?search_query=NTV+Kenya+MY-KDM+feature",
    platform: "YouTube",
  },
];

const MEDIA_ICON: Record<MediaKind, typeof Newspaper> = {
  Print: Newspaper,
  Video: PlayCircle,
  Pictorial: Camera,
};

const MEDIA_KINDS: (MediaKind | "All")[] = ["All", "Print", "Video", "Pictorial"];

type TabKey = "activities" | "barazas" | "media";

function ProjectsPage() {
  const [tab, setTab] = useState<TabKey>("activities");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <img
          src={youthBarazaImg}
          alt="MY-KDM youth baraza on a county road-construction project"
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink/85" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="text-xs uppercase tracking-widest text-accent">Kazi</div>
          <h1 className="mt-2 font-display text-4xl leading-tight text-white md:text-6xl">
            <span className="text-white">Kazi</span>{" "}
            <span className="text-gradient-gold">on the ground,</span>{" "}
            <span className="text-accent">county by county.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/80 md:text-lg">
            Activities, Project Youth Barazas on government projects across counties, and how the
            media is covering the movement.
          </p>
        </div>
      </section>

      {/* Sticky section tabs */}
      <div className="sticky top-16 z-40 border-y border-border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {[
              { key: "activities" as const, label: "Upcoming activities" },
              { key: "barazas" as const, label: "Mashinani Youth Baraza's" },
              { key: "media" as const, label: "Media" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-gradient-gold text-ink shadow"
                    : "text-ink/70 hover:bg-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "activities" ? (
        <ActivitiesTab />
      ) : tab === "barazas" ? (
        <BarazasTab />
      ) : (
        <MediaTab />
      )}

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <div className="text-xs uppercase tracking-widest text-flag-red">Host with us</div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">
            <span className="text-ink">Bring a</span>{" "}
            <span className="text-gradient-gold">MY-KDM project</span>{" "}
            <span className="text-accent">to your ward.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Counties, campuses and partners can co-host an activity. Register on the platform and
            your Ward Head will be in touch.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" className="bg-gradient-gold" asChild>
              <Link to="/auth">
                Get involved <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}


function ActivitiesTab() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("All regions");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      if (region !== "All regions" && p.region !== region) return false;
      if (from && p.dateISO < from) return false;
      if (to && p.dateISO > to) return false;
      if (q) {
        const hay = `${p.title} ${p.venue} ${p.region} ${p.summary} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [query, region, from, to]);

  const anyFilter = query || region !== "All regions" || from || to;

  function reset() {
    setQuery("");
    setRegion("All regions");
    setFrom("");
    setTo("");
  }

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-32 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Search
              </label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Search title, venue, category…"
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="min-w-[160px]">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Region
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flag-red" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {anyFilter ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            ) : null}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {filtered.length} of {PROJECTS.length} activities
          </div>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          {filtered.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-3 font-display text-lg text-ink">No activities match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening the date range or clearing the region.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

type Baraza = {
  id: string;
  county: string;
  project: string;
  sector: "Roads" | "Health" | "Water" | "Education" | "Agriculture" | "Housing" | "ICT";
  date: string;
  venue: string;
  agenda: string;
  attendees: string;
};

const BARAZAS: Baraza[] = [
  {
    id: "b1",
    county: "Nairobi",
    project: "Nairobi Expressway Slip-Road Access Project",
    sector: "Roads",
    date: "Sat, 26 Jul 2026 · 10:00 EAT",
    venue: "Mukuru Social Hall, Embakasi South",
    agenda: "Local youth hiring quotas, boda-boda access lanes and safety walkways.",
    attendees: "KeNHA, MoTIH, Ward Youth Units",
  },
  {
    id: "b2",
    county: "Mombasa",
    project: "Dongo Kundu SEZ Phase II",
    sector: "Housing",
    date: "Sat, 02 Aug 2026 · 09:00 EAT",
    venue: "Likoni Community Centre",
    agenda: "Land compensation transparency, apprenticeship pipeline and MSME contracts.",
    attendees: "KPA, EPZA, County Government of Mombasa",
  },
  {
    id: "b3",
    county: "Kisumu",
    project: "Kisumu Port Modernisation",
    sector: "Roads",
    date: "Sat, 09 Aug 2026 · 10:00 EAT",
    venue: "Jomo Kenyatta Sports Ground, Kisumu Central",
    agenda: "Skilled labour opportunities in ship-repair and cold-chain logistics.",
    attendees: "KPA, County Government of Kisumu, TVET reps",
  },
  {
    id: "b4",
    county: "Nakuru",
    project: "Menengai Geothermal Expansion",
    sector: "ICT",
    date: "Sat, 16 Aug 2026 · 11:00 EAT",
    venue: "Menengai Community Hall",
    agenda: "STEM internships, data-centre tenancy for youth start-ups, land rehabilitation.",
    attendees: "GDC, KenGen, Nakuru County",
  },
  {
    id: "b5",
    county: "Kiambu",
    project: "Affordable Housing Programme — Kiambu Estate",
    sector: "Housing",
    date: "Sat, 23 Aug 2026 · 09:30 EAT",
    venue: "Thika Municipal Hall",
    agenda: "Youth cooperatives for allocation, on-site jua-kali contracts and quality audits.",
    attendees: "State Dept for Housing, County Government of Kiambu",
  },
  {
    id: "b6",
    county: "Kakamega",
    project: "Mumias Sugar Revival",
    sector: "Agriculture",
    date: "Sat, 30 Aug 2026 · 10:00 EAT",
    venue: "Mumias Sports Club",
    agenda: "Out-grower schemes, seedling access and youth-run transport SACCOs.",
    attendees: "KSB, County Government of Kakamega, Farmer cooperatives",
  },
  {
    id: "b7",
    county: "Uasin Gishu",
    project: "Eldoret International Airport Cargo Terminal",
    sector: "Roads",
    date: "Sat, 06 Sep 2026 · 09:00 EAT",
    venue: "Eldoret Sports Club",
    agenda: "Aviation training bursaries, cargo-handling jobs, hostel accommodation for interns.",
    attendees: "KAA, County Government of Uasin Gishu",
  },
  {
    id: "b8",
    county: "Garissa",
    project: "Garissa Solar Power Plant Phase II",
    sector: "ICT",
    date: "Sat, 13 Sep 2026 · 10:00 EAT",
    venue: "Garissa Youth Empowerment Centre",
    agenda: "Solar-technician certification, community electrification and last-mile ICT hubs.",
    attendees: "REREC, County Government of Garissa",
  },
  {
    id: "b9",
    county: "Kilifi",
    project: "Kilifi County Level 5 Hospital Upgrade",
    sector: "Health",
    date: "Sat, 20 Sep 2026 · 10:00 EAT",
    venue: "Kilifi Cultural Centre",
    agenda: "Nursing intake, community health promoter stipends and mental-health outreach.",
    attendees: "MoH, County Government of Kilifi",
  },
  {
    id: "b10",
    county: "Machakos",
    project: "Konza Technopolis Youth Innovation Hub",
    sector: "ICT",
    date: "Sat, 27 Sep 2026 · 10:00 EAT",
    venue: "Konza Complex, Machakos",
    agenda: "Incubation spots, code bootcamp sponsorships and digital-jobs marketplace.",
    attendees: "KoTDA, ICT Authority, Machakos County",
  },
];

const SECTOR_CLASSES: Record<Baraza["sector"], string> = {
  Roads: "bg-primary/10 text-primary border-primary/30",
  Health: "bg-flag-red/10 text-flag-red border-flag-red/30",
  Water: "bg-accent/10 text-accent border-accent/30",
  Education: "bg-accent/10 text-accent border-accent/30",
  Agriculture: "bg-accent/10 text-accent border-accent/30",
  Housing: "bg-primary/10 text-primary border-primary/30",
  ICT: "bg-flag-red/10 text-flag-red border-flag-red/30",
};

function BarazasTab() {
  const [county, setCounty] = useState<string>("All counties");
  const [query, setQuery] = useState("");
  const counties = useMemo(
    () => ["All counties", ...Array.from(new Set(BARAZAS.map((b) => b.county))).sort()],
    [],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BARAZAS.filter((b) => {
      if (county !== "All counties" && b.county !== county) return false;
      if (q) {
        const hay = `${b.project} ${b.county} ${b.sector} ${b.venue} ${b.agenda} ${b.attendees}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [county, query]);

  return (
    <>
      <div className="sticky top-32 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Search
              </label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Search project, sector, agency…"
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                County
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flag-red" />
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {counties.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(query || county !== "All counties") ? (
              <button
                type="button"
                onClick={() => { setQuery(""); setCounty("All counties"); }}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {filtered.length} of {BARAZAS.length} barazas
          </div>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="mb-8 max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl">
              <span className="text-ink">Mashinani</span>{" "}
              <span className="text-gradient-gold">Youth Kazi Barazas</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              County-level town halls where MY-KDM ward units meet government agencies to review
              flagship projects — jobs, tenders, quality and impact for young people.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => {
              const img = BARAZA_IMAGES[b.id];
              return (
                <article
                  key={b.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {img ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt={b.project}
                        loading="lazy"
                        width={1024}
                        height={640}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur ${SECTOR_CLASSES[b.sector]}`}
                        >
                          {b.sector}
                        </span>
                        <span className="rounded-full bg-ink/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white backdrop-blur">
                          {b.county}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg text-ink">{b.project}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.agenda}</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2 text-ink">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <dd>{b.date}</dd>
                      </div>
                      <div className="flex items-start gap-2 text-ink">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" />
                        <dd>{b.venue}</dd>
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <dd>{b.attendees}</dd>
                      </div>
                    </dl>
                    <Button asChild size="sm" className="mt-5 w-full bg-gradient-gold">
                      <Link to="/auth">
                        Register to attend <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function MediaTab() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediaKind | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDIA.filter((m) => {
      if (kind !== "All" && m.kind !== kind) return false;
      if (q) {
        const hay = `${m.title} ${m.outlet} ${m.kind}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, kind]);

  return (
    <>
      <div className="sticky top-32 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Search coverage, outlet, headline…"
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="inline-flex flex-wrap rounded-full border border-border bg-card p-1">
              {MEDIA_KINDS.map((k) => {
                const active = kind === k;
                const Icon = k === "All" ? Newspaper : MEDIA_ICON[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-gradient-gold text-ink shadow"
                        : "text-muted-foreground hover:text-ink"
                    }`}
                  >
                    {k !== "All" ? <Icon className="h-3.5 w-3.5" /> : null}
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {filtered.length} of {MEDIA.length} coverage items
          </div>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => {
              const Icon = MEDIA_ICON[m.kind];
              const img = MEDIA_IMAGES[m.id];
              return (
                <a
                  key={m.id}
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {img ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt={m.title}
                        loading="lazy"
                        width={1024}
                        height={640}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
                          <Icon className="h-3 w-3" /> {m.kind}
                        </span>
                        <span className="rounded-full bg-ink/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white backdrop-blur">
                          {m.date}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg leading-snug text-ink">{m.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{m.outlet}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:translate-x-0.5">
                      {m.kind === "Video"
                        ? `Watch on ${m.platform}`
                        : m.kind === "Pictorial"
                        ? `View on ${m.platform}`
                        : "Read coverage"}{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const meta = CATEGORY_META[project.category];
  const Icon = meta.Icon;
  const poster = POSTERS[project.id];
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lg">
      {poster ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={poster}
            alt={`${project.title} poster`}
            loading="lazy"
            width={1024}
            height={768}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur ${meta.classes}`}
            >
              <Icon className="h-3 w-3" /> {project.category}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur ${STATUS_CLASSES[project.status]}`}
            >
              {project.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-5 pt-5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${meta.classes}`}>
            <Icon className="h-3 w-3" /> {project.category}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_CLASSES[project.status]}`}>
            {project.status}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg text-ink">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{project.summary}</p>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-start gap-2 text-ink">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <dd>{project.date}</dd>
          </div>
          <div className="flex items-start gap-2 text-ink">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" />
            <dd>
              {project.venue}{" "}
              <span className="text-muted-foreground">· {project.region}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <dd>Open to registered MY-KDM members</dd>
          </div>
        </dl>

        <Button asChild size="sm" className="mt-5 w-full bg-gradient-gold">
          <Link to="/auth">
            Register to attend <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

