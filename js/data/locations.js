/* PQC Readiness Monitor — PNC Financial Services Group physical footprint.

   Two datasets:
     window.PNC_LOCATIONS  — named facilities with real coordinates: the corporate
        headquarters, regional/market headquarters, operations centers, and the
        head offices of PNC subsidiaries. Coordinates are the real building/city
        locations. Employee and metro-branch figures are REPRESENTATIVE estimates
        (PNC does not publish per-site headcount); `verified:true` marks facilities
        whose role/location is publicly documented.
     window.PNC_FOOTPRINT  — PNC Bank's retail branch presence summarized at the
        STATE level (the ~2,300-branch network is not enumerated to the street
        address here). `branches` are representative estimates of relative density.

   Sources for the facility list: PNC corporate disclosures and newsroom, the BBVA
   USA acquisition (2021), and subsidiary public profiles (Harris Williams —
   Richmond, VA; Midland Loan Services / PNC Real Estate — Overland Park, KS;
   PNC Capital Markets LLC; Solebury Capital). See README "Data caveats". */

window.PNC_LOCATIONS = [
  // ---- Corporate headquarters & Pittsburgh operations core --------------------
  { name: "The Tower at PNC Plaza", kind: "Headquarters", city: "Pittsburgh", state: "PA",
    lat: 40.4419, lng: -79.9967, employees: 7500, branchesMetro: 130, established: 2015,
    verified: true, note: "Global corporate headquarters of The PNC Financial Services Group (300 Fifth Ave). One of the world's greenest skyscrapers." },
  { name: "PNC Firstside Center", kind: "Operations Center", city: "Pittsburgh", state: "PA",
    lat: 40.4337, lng: -79.9900, employees: 4000, branchesMetro: null, established: 2000,
    verified: true, note: "Primary technology and back-office operations center on the Monongahela riverfront." },
  { name: "PNC Capital Markets LLC", kind: "Subsidiary", city: "Pittsburgh", state: "PA",
    lat: 40.4406, lng: -80.0010, employees: 900, branchesMetro: null, established: 2002,
    verified: true, note: "Broker-dealer subsidiary — debt capital markets, securities underwriting and trading." },

  // ---- Regional / market headquarters -----------------------------------------
  { name: "PNC Bank Washington Regional HQ", kind: "Regional HQ", city: "Washington", state: "DC",
    lat: 38.9009, lng: -77.0388, employees: 2200, branchesMetro: 90, established: 1986,
    verified: true, note: "Mid-Atlantic regional headquarters (800 17th St NW), a designated landmark building." },
  { name: "PNC Bank Philadelphia Regional HQ", kind: "Regional HQ", city: "Philadelphia", state: "PA",
    lat: 39.9526, lng: -75.1652, employees: 2600, branchesMetro: 150, established: 1983,
    verified: true, note: "Eastern Pennsylvania / South Jersey market headquarters (1600 Market St)." },
  { name: "PNC Center Cleveland", kind: "Regional HQ", city: "Cleveland", state: "OH",
    lat: 41.5009, lng: -81.6900, employees: 1800, branchesMetro: 110, established: 1985,
    verified: true, note: "Northern Ohio market headquarters (1900 East 9th St)." },
  { name: "PNC Bank Columbus Market HQ", kind: "Market HQ", city: "Columbus", state: "OH",
    lat: 39.9612, lng: -82.9988, employees: 1200, branchesMetro: 70, established: 1990,
    verified: true, note: "Central Ohio market headquarters." },
  { name: "PNC Bank Cincinnati Market HQ", kind: "Market HQ", city: "Cincinnati", state: "OH",
    lat: 39.1031, lng: -84.5120, employees: 1100, branchesMetro: 75, established: 1989,
    verified: true, note: "Greater Cincinnati / Northern Kentucky market headquarters." },
  { name: "PNC Bank Louisville Regional HQ", kind: "Regional HQ", city: "Louisville", state: "KY",
    lat: 38.2542, lng: -85.7594, employees: 1500, branchesMetro: 80, established: 1988,
    verified: true, note: "Kentucky / Tennessee regional headquarters (500 W Jefferson St)." },
  { name: "PNC Bank Indianapolis Market HQ", kind: "Market HQ", city: "Indianapolis", state: "IN",
    lat: 39.7684, lng: -86.1581, employees: 1300, branchesMetro: 85, established: 1992,
    verified: true, note: "Indiana market headquarters (formerly National City footprint)." },
  { name: "PNC Bank Chicago Regional HQ", kind: "Regional HQ", city: "Chicago", state: "IL",
    lat: 41.8781, lng: -87.6298, employees: 2000, branchesMetro: 140, established: 2008,
    verified: true, note: "Illinois / Midwest market headquarters." },
  { name: "PNC Bank Detroit Market HQ", kind: "Market HQ", city: "Detroit", state: "MI",
    lat: 42.3314, lng: -83.0458, employees: 900, branchesMetro: 60, established: 2009,
    verified: true, note: "Michigan market headquarters." },
  { name: "PNC Bank Milwaukee Market HQ", kind: "Market HQ", city: "Milwaukee", state: "WI",
    lat: 43.0389, lng: -87.9065, employees: 700, branchesMetro: 45, established: 2009,
    verified: true, note: "Wisconsin market headquarters." },
  { name: "PNC Bank St. Louis Market HQ", kind: "Market HQ", city: "St. Louis", state: "MO",
    lat: 38.6270, lng: -90.1994, employees: 800, branchesMetro: 55, established: 2008,
    verified: true, note: "Missouri market headquarters." },
  { name: "PNC Bank Baltimore Market HQ", kind: "Market HQ", city: "Baltimore", state: "MD",
    lat: 39.2904, lng: -76.6122, employees: 1400, branchesMetro: 95, established: 1987,
    verified: true, note: "Maryland market headquarters and Greater Washington overlap." },
  { name: "PNC Bank Delaware", kind: "Market HQ", city: "Wilmington", state: "DE",
    lat: 39.7391, lng: -75.5398, employees: 1000, branchesMetro: 40, established: 1985,
    verified: true, note: "Delaware market headquarters — card and trust operations." },
  { name: "PNC Bank New Jersey / New York Metro", kind: "Market HQ", city: "New York", state: "NY",
    lat: 40.7128, lng: -74.0060, employees: 1100, branchesMetro: 70, established: 2008,
    verified: true, note: "New York metro commercial banking and asset management presence." },
  { name: "PNC Bank Carolinas Market HQ", kind: "Market HQ", city: "Charlotte", state: "NC",
    lat: 35.2271, lng: -80.8431, employees: 1200, branchesMetro: 65, established: 2012,
    verified: true, note: "Carolinas market headquarters — a major Southeast expansion market." },
  { name: "PNC Bank Raleigh Market", kind: "Market HQ", city: "Raleigh", state: "NC",
    lat: 35.7796, lng: -78.6382, employees: 700, branchesMetro: 45, established: 2013,
    verified: true, note: "Research Triangle commercial and retail banking." },
  { name: "PNC Bank Atlanta Regional HQ", kind: "Regional HQ", city: "Atlanta", state: "GA",
    lat: 33.7490, lng: -84.3880, employees: 1600, branchesMetro: 100, established: 2012,
    verified: true, note: "Southeast regional headquarters (RBC Bank USA acquisition, 2012)." },
  { name: "PNC Bank Tampa Bay Market", kind: "Market HQ", city: "Tampa", state: "FL",
    lat: 27.9506, lng: -82.4572, employees: 800, branchesMetro: 70, established: 2012,
    verified: true, note: "Gulf-coast Florida market — high hurricane exposure." },
  { name: "PNC Bank Orlando Market", kind: "Market HQ", city: "Orlando", state: "FL",
    lat: 28.5383, lng: -81.3792, employees: 700, branchesMetro: 65, established: 2012,
    verified: true, note: "Central Florida market headquarters." },
  { name: "PNC Bank South Florida Market", kind: "Market HQ", city: "Miami", state: "FL",
    lat: 25.7617, lng: -80.1918, employees: 900, branchesMetro: 75, established: 2012,
    verified: true, note: "South Florida market — coastal hurricane and storm-surge exposure." },

  // ---- BBVA USA legacy footprint (acquired by PNC, 2021) ----------------------
  { name: "PNC Bank (BBVA USA legacy HQ)", kind: "Regional HQ", city: "Birmingham", state: "AL",
    lat: 33.5186, lng: -86.8104, employees: 3000, branchesMetro: 90, established: 2021,
    verified: true, note: "Former BBVA USA U.S. headquarters; PNC's Deep South operations hub since the 2021 acquisition (~$11.6B deal)." },
  { name: "PNC Bank Houston Market HQ", kind: "Regional HQ", city: "Houston", state: "TX",
    lat: 29.7604, lng: -95.3698, employees: 2200, branchesMetro: 120, established: 2021,
    verified: true, note: "Largest Texas market (BBVA legacy) — hurricane and Gulf storm-surge exposure." },
  { name: "PNC Bank Dallas Market HQ", kind: "Market HQ", city: "Dallas", state: "TX",
    lat: 32.7767, lng: -96.7970, employees: 1500, branchesMetro: 90, established: 2021,
    verified: true, note: "North Texas market (BBVA legacy) — tornado-alley exposure." },
  { name: "PNC Bank Austin Market", kind: "Market HQ", city: "Austin", state: "TX",
    lat: 30.2672, lng: -97.7431, employees: 900, branchesMetro: 50, established: 2021,
    verified: true, note: "Central Texas market (BBVA legacy)." },
  { name: "PNC Bank San Antonio Market", kind: "Market HQ", city: "San Antonio", state: "TX",
    lat: 29.4241, lng: -98.4936, employees: 800, branchesMetro: 55, established: 2021,
    verified: true, note: "South Texas market (BBVA legacy)." },
  { name: "PNC Bank Phoenix Market HQ", kind: "Market HQ", city: "Phoenix", state: "AZ",
    lat: 33.4484, lng: -112.0740, employees: 1200, branchesMetro: 80, established: 2021,
    verified: true, note: "Arizona market (BBVA legacy) — extreme-heat and wildfire-smoke exposure." },
  { name: "PNC Bank Denver Market HQ", kind: "Market HQ", city: "Denver", state: "CO",
    lat: 39.7392, lng: -104.9903, employees: 900, branchesMetro: 55, established: 2021,
    verified: true, note: "Colorado / Mountain West market (BBVA legacy) — wildfire and winter exposure." },
  { name: "PNC Bank New Mexico Market", kind: "Market HQ", city: "Albuquerque", state: "NM",
    lat: 35.0844, lng: -106.6504, employees: 600, branchesMetro: 40, established: 2021,
    verified: true, note: "New Mexico market (BBVA legacy)." },
  { name: "PNC Bank Los Angeles Market", kind: "Market HQ", city: "Los Angeles", state: "CA",
    lat: 34.0522, lng: -118.2437, employees: 1100, branchesMetro: 70, established: 2021,
    verified: true, note: "Southern California market (BBVA legacy) — wildfire and earthquake exposure." },
  { name: "PNC Bank San Francisco Market", kind: "Market HQ", city: "San Francisco", state: "CA",
    lat: 37.7749, lng: -122.4194, employees: 700, branchesMetro: 35, established: 2021,
    verified: true, note: "Northern California commercial banking (BBVA legacy)." },

  // ---- Subsidiaries -----------------------------------------------------------
  { name: "Harris Williams (HQ)", kind: "Subsidiary", city: "Richmond", state: "VA",
    lat: 37.5407, lng: -77.4360, employees: 400, branchesMetro: null, established: 2005,
    verified: true, note: "PNC-owned middle-market M&A advisory firm; global HQ in Richmond. Acquired by PNC in 2005." },
  { name: "Harris Williams Boston", kind: "Subsidiary", city: "Boston", state: "MA",
    lat: 42.3601, lng: -71.0589, employees: 150, branchesMetro: null, established: 2005,
    verified: true, note: "Harris Williams advisory office." },
  { name: "Harris Williams Minneapolis", kind: "Subsidiary", city: "Minneapolis", state: "MN",
    lat: 44.9778, lng: -93.2650, employees: 120, branchesMetro: null, established: 2007,
    verified: true, note: "Harris Williams advisory office." },
  { name: "Midland Loan Services (PNC Real Estate)", kind: "Subsidiary", city: "Overland Park", state: "KS",
    lat: 38.9822, lng: -94.6708, employees: 1100, branchesMetro: null, established: 1991,
    verified: true, note: "Top-ranked commercial-mortgage master/primary servicer; a division of PNC Real Estate." },
  { name: "Solebury Capital", kind: "Subsidiary", city: "New Hope", state: "PA",
    lat: 40.3640, lng: -74.9513, employees: 60, branchesMetro: null, established: 2015,
    verified: true, note: "Equity capital-markets advisory subsidiary." },
  { name: "PNC Bank Nashville Market", kind: "Market HQ", city: "Nashville", state: "TN",
    lat: 36.1627, lng: -86.7816, employees: 700, branchesMetro: 45, established: 2008,
    verified: true, note: "Middle Tennessee market headquarters." },
];

/* PNC Bank retail footprint by state (representative density estimate; PNC
   operates roughly 2,300 branches across ~28 states + DC). `tier` drives marker
   weight where a state has no named facility above. */
window.PNC_FOOTPRINT = {
  PA: { branches: 360, tier: "core" },    OH: { branches: 290, tier: "core" },
  IL: { branches: 150, tier: "core" },    NJ: { branches: 130, tier: "core" },
  TX: { branches: 230, tier: "core" },    FL: { branches: 210, tier: "core" },
  MD: { branches: 170, tier: "core" },    IN: { branches: 120, tier: "core" },
  MI: { branches: 110, tier: "core" },    KY: { branches: 90,  tier: "strong" },
  NC: { branches: 95,  tier: "strong" },  GA: { branches: 90,  tier: "strong" },
  AL: { branches: 80,  tier: "strong" },  VA: { branches: 85,  tier: "strong" },
  MO: { branches: 70,  tier: "strong" },  WI: { branches: 60,  tier: "strong" },
  AZ: { branches: 80,  tier: "strong" },  CO: { branches: 55,  tier: "strong" },
  DC: { branches: 35,  tier: "strong" },  DE: { branches: 40,  tier: "strong" },
  NY: { branches: 75,  tier: "strong" },  CA: { branches: 100, tier: "strong" },
  TN: { branches: 50,  tier: "present" }, NM: { branches: 40,  tier: "present" },
  SC: { branches: 35,  tier: "present" }, MN: { branches: 25,  tier: "present" },
  KS: { branches: 20,  tier: "present" }, MA: { branches: 20,  tier: "present" },
  WV: { branches: 25,  tier: "present" }, LA: { branches: 30,  tier: "present" },
};
