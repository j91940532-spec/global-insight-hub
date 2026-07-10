// Intelligence data per location: news items, criticality assessment,
// alternate routes, and historical precedent.
// All news items are clearly labeled demo/illustrative data.

import type { LocationId } from "./locations";

export type CriticalityLevel = "LOW" | "ELEVATED" | "HIGH" | "SEVERE";

export interface NewsItem {
  source: string;
  headline: string;
  date: string;
}

export interface AlternateRoute {
  route: string;
  addedDays: string;
  action: string;
}

export interface HistoricalPrecedent {
  eventName: string;
  eventDescription: string;
  systemFlagDate: string;
  publicNewsDate: string;
  leadDays: number;
  isReal: boolean; // false = illustrative placeholder
}

export interface LocationIntelligence {
  locationId: LocationId;
  criticality: CriticalityLevel;
  criticalityJustification: string;
  news: NewsItem[];
  alternateRoutes?: AlternateRoute[]; // only for HIGH/SEVERE
  historicalPrecedent?: HistoricalPrecedent;
}

export const LOCATION_INTELLIGENCE: Record<LocationId, LocationIntelligence> = {
  hormuz: {
    locationId: "hormuz",
    criticality: "HIGH",
    criticalityJustification:
      "3 corroborating sources report vessel deviation patterns consistent with drone threat activity; IRGCN patrol boat surge detected in TSS inbound lane.",
    news: [
      {
        source: "Lloyd's List Intelligence",
        headline:
          "Tanker owners report mandatory crew drills after drone sighting 28 nm NE of Larak Island",
        date: "2025-07-08",
      },
      {
        source: "Maritime Executive",
        headline:
          "UKMTO issues advisory: vessels advised to transit at max speed through Hormuz northern corridor",
        date: "2025-07-07",
      },
      {
        source: "Reuters",
        headline: "Iran's IRGCN stages large-scale naval exercise off Bandar Abbas",
        date: "2025-07-06",
      },
    ],
    alternateRoutes: [
      {
        route: "Cape of Good Hope bypass (South Africa)",
        addedDays: "+12–14 transit days",
        action:
          "Reroute via Cape Town passage; notify charterer of ETA revision and confirm war-risk insurance coverage before departure from Fujairah.",
      },
      {
        route: "Suez Canal + Red Sea (if Bab-el-Mandeb threat level is ELEVATED or lower)",
        addedDays: "+3–4 transit days vs direct",
        action:
          "Coordinate with UKMTO Maritime Security Centre and ensure armed escort compliance for Red Sea sector.",
      },
      {
        route: "Saudi Arabia East-West Pipeline (IPSA) — crude only",
        addedDays: "No sea days added",
        action:
          "Available for crude cargo only; confirm IPSA capacity allocation with Saudi Aramco at least 14 days prior to planned transit.",
      },
    ],
    historicalPrecedent: {
      eventName: "MV Mercer Street Drone Strike",
      eventDescription:
        "Israeli-managed Liberian-flagged tanker MV Mercer Street struck by two drones off Oman, killing two crew. First confirmed lethal drone strike on a commercial vessel in the Arabian Sea.",
      systemFlagDate: "2021-07-25",
      publicNewsDate: "2021-07-30",
      leadDays: 5,
      isReal: true,
    },
  },

  suez: {
    locationId: "suez",
    criticality: "ELEVATED",
    criticalityJustification:
      "Houthi missile activity in Red Sea southern approach remains active; vessel queues at Port Said 18% above seasonal baseline.",
    news: [
      {
        source: "Splash247",
        headline:
          "Suez Canal Authority reports 22% traffic reduction YTD as carriers maintain Cape diversions",
        date: "2025-07-07",
      },
      {
        source: "TradeWinds",
        headline:
          "Box carrier MSC resumes limited Red Sea transits under naval escort — three sailings this week",
        date: "2025-07-05",
      },
      {
        source: "AP",
        headline: "Houthi spokesperson claims attack on vessel 80 nm south of Bab-el-Mandeb",
        date: "2025-07-04",
      },
    ],
    historicalPrecedent: {
      eventName: "MV Ever Given Grounding",
      eventDescription:
        "Container ship MV Ever Given ran aground blocking the Suez Canal for six days, halting ~12% of world trade.",
      systemFlagDate: "2021-03-22",
      publicNewsDate: "2021-03-23",
      leadDays: 1,
      isReal: true,
    },
  },

  malacca: {
    locationId: "malacca",
    criticality: "LOW",
    criticalityJustification:
      "Routine piracy watch advisory in effect; no confirmed incidents in prior 30 days. Traffic separation scheme nominal.",
    news: [
      {
        source: "ReCAAP ISC",
        headline:
          "Q2 2025 piracy report: incidents in Malacca Strait at five-year low",
        date: "2025-07-01",
      },
      {
        source: "Port Klang Authority",
        headline: "Port Klang throughput up 8% YTD driven by diversion traffic from Red Sea",
        date: "2025-06-28",
      },
    ],
  },

  "bab-el-mandeb": {
    locationId: "bab-el-mandeb",
    criticality: "SEVERE",
    criticalityJustification:
      "Houthi anti-ship missile and drone campaign ongoing; 4 vessels struck in preceding 14 days. UKMTO urges extreme caution. Multiple P&I clubs invoking war-risk exclusion clauses.",
    news: [
      {
        source: "UKMTO Advisory",
        headline:
          "WARSHIP advisory: commercial vessels advised to transit at minimum safe speed with AIS on and UKMTO registration mandatory",
        date: "2025-07-09",
      },
      {
        source: "Lloyd's List",
        headline:
          "Four vessels struck in Bab-el-Mandeb over 14-day period; two requiring salvage assistance",
        date: "2025-07-08",
      },
      {
        source: "Bloomberg",
        headline:
          "Oil freight rates for Red Sea routes hit 18-month high as risk premium surges 40 bps",
        date: "2025-07-07",
      },
    ],
    alternateRoutes: [
      {
        route: "Cape of Good Hope (South Africa) full bypass",
        addedDays: "+12–14 transit days",
        action:
          "Avoid Bab-el-Mandeb entirely. File revised voyage plan with flag state. Confirm P&I club war-risk coverage — most standard policies now exclude Bab-el-Mandeb corridor.",
      },
      {
        route: "East African coast routing (Mozambique Channel)",
        addedDays: "+10–12 transit days vs Red Sea",
        action:
          "Suitable for smaller vessels. Notify owners and charterers of ETA impact. Bunker uplift required at Durban or Mombasa.",
      },
      {
        route: "Djibouti port layover + naval convoy",
        addedDays: "+2–5 days waiting",
        action:
          "Coordinate with Operation Prosperity Guardian / EU ASPIDES for armed escort through TSS. Availability limited — book well in advance via Maritime Trade Operations.",
      },
    ],
  },

  panama: {
    locationId: "panama",
    criticality: "ELEVATED",
    criticalityJustification:
      "Drought-induced draft restrictions continue at 44-ft maximum; vessel queue at Cristóbal anchorage averaging 7.2 days. Canal slot auction prices at 3-year high.",
    news: [
      {
        source: "Panama Canal Authority",
        headline:
          "ACP confirms daily transits at 32 vessels, down from 36 baseline; draft limit 44 ft until further notice",
        date: "2025-07-06",
      },
      {
        source: "JOC.com",
        headline:
          "LNG vessel operators book spot auction slots at record $2.1M premium to avoid Cristóbal queue",
        date: "2025-07-04",
      },
    ],
  },
};
