export type Tier = "national" | "county" | "constituency" | "ward";

export interface Position {
  id: string;
  tier: Tier;
  title: string;
  scope: string;
  description: string;
  county?: string;
  constituency?: string;
  ward?: string;
}


export interface Candidate {
  id: string;
  positionId: string;
  name: string;
  age: number;
  county: string;
  slogan: string;
  bio: string;
  initials: string;
  accent: "gold" | "sage" | "terracotta";
}

export const POSITIONS: Position[] = [
  {
    id: "national-chair",
    tier: "national",
    title: "National Chair",
    scope: "National Secretariat",
    description:
      "Sets the strategic vision, chairs national leadership meetings, and safeguards the movement's founding principles.",
  },
  {
    id: "national-ceo",
    tier: "national",
    title: "Chief Executive Officer",
    scope: "National Secretariat",
    description:
      "Runs day-to-day operations, drives weekly activities, and manages the elected national and county leadership.",
  },
  {
    id: "minister-enterprise",
    tier: "national",
    title: "Youth Minister — Enterprise",
    scope: "Cabinet of Youth Ministers",
    description:
      "Leads the enterprise, jobs and opportunities docket in partnership with M-Taji's marketplace.",
  },
  {
    id: "minister-health",
    tier: "national",
    title: "Youth Minister — Health",
    scope: "Cabinet of Youth Ministers",
    description:
      "Represents youth priorities on mental health, SRHR, NCDs and universal health coverage.",
  },
  {
    id: "governor-nairobi",
    tier: "county",
    title: "County Youth Governor — Nairobi",
    scope: "County Leadership",
    description:
      "Coordinates Nairobi's ward representatives and speaks for the county's youth on the national stage.",
    county: "Nairobi",
  },
  {
    id: "governor-kisumu",
    tier: "county",
    title: "County Youth Governor — Kisumu",
    scope: "County Leadership",
    description:
      "Coordinates Kisumu's ward representatives and speaks for the county's youth on the national stage.",
    county: "Kisumu",
  },
  {
    id: "ward-kibra",
    tier: "ward",
    title: "Ward Representative — Kibra Central",
    scope: "Ward Leadership",
    description:
      "Closest point of contact with young people on the ground in Kibra Central ward.",
    county: "Nairobi",
    constituency: "Kibra",
    ward: "Kibra Central",
  },
  {
    id: "constituency-kibra",
    tier: "constituency",
    title: "Constituency Youth Rep — Kibra",
    scope: "Constituency Leadership",
    description:
      "Represents Kibra constituency's wards on the county council and links ward reps to national leadership.",
    county: "Nairobi",
    constituency: "Kibra",
  },
  {
    id: "constituency-kisumu-central",
    tier: "constituency",
    title: "Constituency Youth Rep — Kisumu Central",
    scope: "Constituency Leadership",
    description:
      "Represents Kisumu Central constituency and coordinates its ward representatives.",
    county: "Kisumu",
    constituency: "Kisumu Central",
  },
  {
    id: "ward-kondele",
    tier: "ward",
    title: "Ward Representative — Kisumu Central Central",
    scope: "Ward Leadership",
    description:
      "Closest point of contact with young people on the ground in Kisumu Central Central ward.",
    county: "Kisumu",
    constituency: "Kisumu Central",
    ward: "Kisumu Central Central",
  },

];

export const CANDIDATES: Candidate[] = [
  // National Chair
  { id: "c1", positionId: "national-chair", name: "David Mbehi", age: 31, county: "Nairobi", slogan: "Kutoka Ground Hadi Top", bio: "Founding member of MY-KDM. Grassroots organiser across 14 counties, focused on turning youth voice into policy weight.", initials: "DM", accent: "gold" },
  { id: "c2", positionId: "national-chair", name: "Amina Yusuf", age: 29, county: "Mombasa", slogan: "One Movement, One Voice", bio: "Coast regional coordinator. Ten years in civic-tech and voter education campaigns.", initials: "AY", accent: "sage" },
  { id: "c3", positionId: "national-chair", name: "Kipchoge Ruto", age: 33, county: "Uasin Gishu", slogan: "Serious youth, serious results", bio: "Ex-USLA chair. Builds bridges between campus leadership and mashinani realities.", initials: "KR", accent: "terracotta" },

  // CEO
  { id: "c4", positionId: "national-ceo", name: "Maloba Wanjala", age: 30, county: "Bungoma", slogan: "Delivery over noise", bio: "Operations lead with USLA. Ships weekly. Runs the county-by-county activation calendar.", initials: "MW", accent: "gold" },
  { id: "c5", positionId: "national-ceo", name: "Faith Nyambura", age: 28, county: "Nyeri", slogan: "Systems that scale", bio: "Product and operations background. Believes MY-KDM should feel like a well-run tech company.", initials: "FN", accent: "sage" },

  // Minister Enterprise
  { id: "c6", positionId: "minister-enterprise", name: "Brian Otieno", age: 27, county: "Siaya", slogan: "Jobs, not slogans", bio: "Runs a jua-kali cooperative of 400 members. Champion of the M-Taji opportunities marketplace.", initials: "BO", accent: "gold" },
  { id: "c7", positionId: "minister-enterprise", name: "Zawadi Mwikali", age: 26, county: "Machakos", slogan: "Capital to the mashinani", bio: "Founder of a rural fintech pilot. Focused on unlocking capital for young founders.", initials: "ZM", accent: "terracotta" },

  // Minister Health
  { id: "c8", positionId: "minister-health", name: "Dr. Aisha Noor", age: 29, county: "Garissa", slogan: "Healthy youth, healthy nation", bio: "Medical officer and mental health advocate. Working on youth-friendly SRHR access.", initials: "AN", accent: "sage" },
  { id: "c9", positionId: "minister-health", name: "Kevin Kimani", age: 28, county: "Kiambu", slogan: "Mental health is a mashinani issue", bio: "Public health researcher. Ran the 'Boys Speak' peer-support program in Central Kenya.", initials: "KK", accent: "gold" },

  // Governor Nairobi
  { id: "c10", positionId: "governor-nairobi", name: "Wanjiru Kariuki", age: 27, county: "Nairobi", slogan: "Nairobi youth, unignorable", bio: "Community organiser across Eastlands. Runs the largest youth WhatsApp mobilisation network in Nairobi.", initials: "WK", accent: "gold" },
  { id: "c11", positionId: "governor-nairobi", name: "Juma Hassan", age: 30, county: "Nairobi", slogan: "From Kibra to City Hall", bio: "Ward-level organiser turned countywide convenor. Focus on jobs, hustle permits and safety.", initials: "JH", accent: "terracotta" },
  { id: "c12", positionId: "governor-nairobi", name: "Achieng Odera", age: 26, county: "Nairobi", slogan: "Digital-first governance", bio: "Civic-tech builder. Wants every ward in Nairobi on a public MY-KDM dashboard.", initials: "AO", accent: "sage" },

  // Governor Kisumu
  { id: "c13", positionId: "governor-kisumu", name: "Tom Ochieng", age: 29, county: "Kisumu", slogan: "Kisumu forward", bio: "Boda-boda SACCO leader. Represents the informal economy on youth boards.", initials: "TO", accent: "gold" },
  { id: "c14", positionId: "governor-kisumu", name: "Grace Adhiambo", age: 28, county: "Kisumu", slogan: "Lake region rising", bio: "Ran the county's youth vaccination drive. Focus on health, sports and blue economy.", initials: "GA", accent: "sage" },

  // Ward Kibra
  { id: "c15", positionId: "ward-kibra", name: "Peter 'PJ' Juma", age: 25, county: "Nairobi", slogan: "Kibra kwanza", bio: "Runs a youth talent hub in Laini Saba. Football, music, coding — one roof.", initials: "PJ", accent: "gold" },
  { id: "c16", positionId: "ward-kibra", name: "Mercy Achieng", age: 24, county: "Nairobi", slogan: "Sisters to the front", bio: "Champion for young mothers and adolescent girls. Runs a mentorship circle of 200+.", initials: "MA", accent: "terracotta" },

  // Ward Kondele
  { id: "c17", positionId: "ward-kondele", name: "Silas Otieno", age: 26, county: "Kisumu", slogan: "Kondele on the map", bio: "Community journalist. Documented the ward's needs into a public data brief.", initials: "SO", accent: "sage" },
  { id: "c18", positionId: "ward-kondele", name: "Linet Awuor", age: 25, county: "Kisumu", slogan: "Deliver, don't perform", bio: "Small-business organiser. Ran a savings-and-credit group for 60 young traders.", initials: "LA", accent: "gold" },

  // Constituency Kibra
  { id: "c19", positionId: "constituency-kibra", name: "Hussein Abdalla", age: 28, county: "Nairobi", slogan: "Wards first, always", bio: "Convener of the Kibra ward reps caucus. Focus on housing, water and youth jobs.", initials: "HA", accent: "gold" },
  { id: "c20", positionId: "constituency-kibra", name: "Naliaka Wafula", age: 27, county: "Nairobi", slogan: "Kibra one voice", bio: "Community paralegal. Ran the Kibra youth ID drive with M-Taji.", initials: "NW", accent: "sage" },

  // Constituency Kisumu Central
  { id: "c21", positionId: "constituency-kisumu-central", name: "Otieno Kajwang'", age: 29, county: "Kisumu", slogan: "Central rising", bio: "Small trader organiser. Pushes for hustle permits and market space for young traders.", initials: "OK", accent: "terracotta" },
  { id: "c22", positionId: "constituency-kisumu-central", name: "Sharon Anyango", age: 26, county: "Kisumu", slogan: "Data-driven Kisumu", bio: "Data analyst turned civic organiser. Ward-level dashboards for every constituency.", initials: "SA", accent: "gold" },
];

export const TIER_META: Record<Tier, { label: string; blurb: string }> = {
  national: {
    label: "National Secretariat",
    blurb: "Chair, CEO and the Cabinet of Youth Ministers — the movement's national leadership.",
  },
  county: {
    label: "County Leadership",
    blurb: "County Youth Governors representing each of Kenya's 47 counties.",
  },
  constituency: {
    label: "Constituency Leadership",
    blurb: "Constituency Youth Reps linking wards to county and national leadership.",
  },
  ward: {
    label: "Ward Leadership",
    blurb: "Ward Representatives — the closest point of contact with young people on the ground.",
  },
};
