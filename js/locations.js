/* PQC Readiness Monitor — Locations & Hazards.

   An interactive map of PNC Financial Services Group's U.S. footprint (corporate
   HQ, regional/market headquarters, operations centers, and subsidiary offices)
   overlaid with LIVE natural-hazard data and a modeled regional power-grid stress
   index, refreshed in real time.

   Live data source: the U.S. National Weather Service public API
   (https://api.weather.gov) — active watches/warnings for hurricanes & tropical
   storms, tornadoes, severe thunderstorms, wildfire (Red Flag), floods, winter
   storms/ice, extreme heat, and high wind. No API key; CORS-enabled; authoritative.
   Per-location 7-period forecasts are fetched on demand from the same API.

   Zero dependencies: the base map is the embedded continental-US GeoJSON
   (js/data/us-geo.js) drawn through a hand-rolled Albers equal-area projection,
   so every state polygon and every PNC marker share one coordinate system.

   The power-grid figure is a MODELED outage-risk index derived from the live NWS
   hazards intersecting each state (severe weather is the dominant driver of U.S.
   grid outages) — it is clearly labelled as modeled, not a live utility feed. */

(function () {
  "use strict";

  var ALERTS_URL = "https://api.weather.gov/alerts/active" +
    "?status=actual&message_type=alert&severity=Extreme,Severe,Moderate";
  var REFRESH_MS = 5 * 60 * 1000;   // live auto-refresh cadence
  var STALE_MS   = 4 * 60 * 1000;   // re-fetch on re-entry if data older than this

  /* ---- Hazard taxonomy (the hazards the user asked to track) --------------- */
  var CATS = [
    { key: "tropical", label: "Hurricane / Tropical", icon: "waves",     w: 3.0, test: /hurricane|tropical|storm surge|typhoon/i },
    { key: "tornado",  label: "Tornado",              icon: "tornado",   w: 3.0, test: /tornado/i },
    { key: "fire",     label: "Fire / Red Flag",      icon: "flame",     w: 2.0, test: /fire|red flag/i },
    { key: "winter",   label: "Winter / Ice",         icon: "snowflake", w: 2.5, test: /winter|snow|ice|blizzard|freez|frost|wind chill|sleet/i },
    { key: "flood",    label: "Flood",                icon: "droplets",  w: 1.5, test: /flood/i },
    { key: "severe",   label: "Severe storms",        icon: "wind",      w: 2.0, test: /severe thunderstorm|special marine|squall|dust storm/i },
    { key: "wind",     label: "High wind",            icon: "wind",      w: 2.0, test: /high wind|wind advisory|gale|extreme wind/i },
    { key: "heat",     label: "Extreme heat",         icon: "thermometer", w: 1.0, test: /heat/i },
  ];
  function catOf(event) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].test.test(event)) return CATS[i];
    return null; // uncategorised advisories are ignored — we track named hazards only
  }
  function catByKey(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i].key === k) return CATS[i]; return null; }

  var SEV_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
  var SEV_W    = { Extreme: 2, Severe: 1.5, Moderate: 1, Minor: 0.5, Unknown: 0.5 };
  // Map fill by the strongest active severity in a state.
  var HAZ_FILL = {
    4: "rgba(142,27,18,0.82)", 3: "rgba(192,57,43,0.74)", 2: "rgba(224,138,30,0.70)",
    1: "rgba(233,196,106,0.66)", 0: "rgba(107,116,124,0.45)",
  };
  var HAZ_LABEL = { 4: "Extreme", 3: "Severe", 2: "Moderate", 1: "Minor", 0: "Advisory" };

  // PNC presence tint (no active hazard) — the resting "footprint" map.
  var TIER_FILL = { core: "rgba(245,128,37,0.26)", strong: "rgba(245,128,37,0.15)", present: "rgba(245,128,37,0.08)" };
  var NEUTRAL_FILL = "#EDEFF1";

  var KIND = {
    "Headquarters":     { c: "#10314F", r: 8.5, z: 6 },
    "Operations Center":{ c: "#0069AA", r: 6.5, z: 5 },
    "Regional HQ":      { c: "#F58025", r: 6.5, z: 4 },
    "Market HQ":        { c: "#E06E14", r: 5,   z: 3 },
    "Subsidiary":       { c: "#1B7F4B", r: 5,   z: 3 },
  };
  function kindOf(k) { return KIND[k] || { c: "#6B747C", r: 5, z: 2 }; }

  var FIPS_ABBR = {
    "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC",
    "12":"FL","13":"GA","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY",
    "22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO",
    "30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC",
    "38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
    "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
  };

  /* ---- Albers equal-area projection (shared by polygons + markers) --------- */
  var RAD = Math.PI / 180, VB_W = 960, VB_H = 588, PAD = 14;
  function albersRaw(lng, lat) {
    var p0 = 38 * RAD, l0 = -96 * RAD, p1 = 29.5 * RAD, p2 = 45.5 * RAD;
    var n = (Math.sin(p1) + Math.sin(p2)) / 2;
    var C = Math.cos(p1) * Math.cos(p1) + 2 * n * Math.sin(p1);
    var rho0 = Math.sqrt(C - 2 * n * Math.sin(p0)) / n;
    var rho = Math.sqrt(C - 2 * n * Math.sin(lat * RAD)) / n;
    var theta = n * (lng * RAD - l0);
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  }

  // Lazily built from window.US_GEO the first time we render.
  var GEO = null; // { paths:[{abbr,name,d,cx,cy}], project(lng,lat)->[x,y] }
  function buildGeo() {
    if (GEO) return GEO;
    var feats = (window.US_GEO && window.US_GEO.states) || [];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    function scan(coords) { // walk nested rings collecting raw-projected bbox
      for (var i = 0; i < coords.length; i++) {
        var c = coords[i];
        if (typeof c[0] === "number") {
          var p = albersRaw(c[0], c[1]);
          if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
          if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
        } else scan(c);
      }
    }
    feats.forEach(function (f) { scan(f.coordinates); });
    var scale = Math.min((VB_W - 2 * PAD) / (maxX - minX), (VB_H - 2 * PAD) / (maxY - minY));
    var offX = (VB_W - (maxX - minX) * scale) / 2;
    var offY = (VB_H - (maxY - minY) * scale) / 2;
    function project(lng, lat) {
      var p = albersRaw(lng, lat);
      return [offX + (p[0] - minX) * scale, offY + (maxY - p[1]) * scale]; // flip Y for SVG
    }
    var paths = feats.map(function (f) {
      var rings = f.type === "MultiPolygon" ? f.coordinates : [f.coordinates];
      var d = "", bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
      rings.forEach(function (poly) {
        poly.forEach(function (ring) {
          ring.forEach(function (pt, i) {
            var s = project(pt[0], pt[1]);
            d += (i === 0 ? "M" : "L") + s[0].toFixed(1) + " " + s[1].toFixed(1);
            if (s[0] < bx0) bx0 = s[0]; if (s[0] > bx1) bx1 = s[0];
            if (s[1] < by0) by0 = s[1]; if (s[1] > by1) by1 = s[1];
          });
          d += "Z";
        });
      });
      return { abbr: FIPS_ABBR[f.id] || f.id, name: f.name, d: d,
               cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2 };
    });
    GEO = { paths: paths, project: project };
    return GEO;
  }

  /* ---- Module state -------------------------------------------------------- */
  var M = {
    mounted: false, timer: null, onClick: null,
    status: "idle", updatedAt: null, fetchedAt: 0,
    layer: "all", showPower: true, auto: true,
    byState: {}, alerts: [], totals: null,
    selected: null, forecast: {}, // forecast[name] = {status, periods, when}
  };

  function gridBand(s) {
    return s >= 12 ? { k: "severe", label: "Severe", c: "var(--risk-critical)", bg: "var(--risk-critical-bg)" }
         : s >= 6  ? { k: "high",   label: "High",   c: "var(--risk-high)",     bg: "var(--risk-high-bg)" }
         : s >= 2.5? { k: "elev",   label: "Elevated", c: "var(--risk-medium)", bg: "var(--risk-medium-bg)" }
         : s > 0   ? { k: "low",    label: "Watch",  c: "var(--info)",          bg: "var(--info-bg)" }
         :           { k: "none",   label: "Nominal", c: "var(--success)",      bg: "var(--success-bg)" };
  }

  /* ---- Live fetch ---------------------------------------------------------- */
  function fetchJson(url, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, ms || 12000);
    return fetch(url, {
      headers: { "Accept": "application/geo+json" },
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function statesOfAlert(p) {
    var out = {}, ugc = (p.geocode && p.geocode.UGC) || [], same = (p.geocode && p.geocode.SAME) || [];
    ugc.forEach(function (u) { var ab = String(u).slice(0, 2); if (FIPS_ABBR_HAS(ab)) out[ab] = 1; });
    if (!Object.keys(out).length) same.forEach(function (s) {
      var ab = FIPS_ABBR[String(s).slice(1, 3)]; if (ab) out[ab] = 1;
    });
    return Object.keys(out);
  }
  var _abbrSet = null;
  function FIPS_ABBR_HAS(ab) {
    if (!_abbrSet) { _abbrSet = {}; for (var k in FIPS_ABBR) _abbrSet[FIPS_ABBR[k]] = 1; }
    return !!_abbrSet[ab];
  }

  function process(json) {
    var byState = {}, kept = [];
    (json.features || []).forEach(function (f) {
      var p = f.properties || {}, cat = catOf(p.event || "");
      if (!cat) return;
      var sev = p.severity || "Unknown", rank = SEV_RANK[sev] || 0;
      var rec = {
        id: f.id, event: p.event, cat: cat.key, sev: sev, rank: rank,
        headline: p.headline || p.event, area: p.areaDesc || "",
        sender: p.senderName || "NWS", expires: p.expires || p.ends || "",
        states: statesOfAlert(p),
      };
      kept.push(rec);
      rec.states.forEach(function (ab) {
        var st = byState[ab] || (byState[ab] = { count: 0, rank: 0, stress: 0, cats: {}, alerts: [] });
        st.count++; st.rank = Math.max(st.rank, rank);
        st.cats[cat.key] = (st.cats[cat.key] || 0) + 1;
        st.stress += cat.w * (SEV_W[sev] || 0.5);
        st.alerts.push(rec);
      });
    });
    M.byState = byState; M.alerts = kept;
    M.alerts.sort(function (a, b) { return b.rank - a.rank; });
    M.updatedAt = new Date(); M.fetchedAt = Date.now();
  }

  function refresh() {
    if (M.status === "loading") return;
    M.status = "loading"; paintStatus();
    fetchJson(ALERTS_URL).then(function (j) {
      process(j); M.status = "ok"; paint();
    }).catch(function () {
      M.status = "error"; paint();
    });
  }

  function loadForecast(loc) {
    var key = loc.name;
    var f = M.forecast[key];
    if (f && (f.status === "ok" || f.status === "loading")) return;
    M.forecast[key] = { status: "loading" };
    var pt = loc.lat.toFixed(4) + "," + loc.lng.toFixed(4);
    fetchJson("https://api.weather.gov/points/" + pt, 9000).then(function (j) {
      var url = j.properties && j.properties.forecast;
      if (!url) throw new Error("no forecast");
      return fetchJson(url, 9000);
    }).then(function (fc) {
      M.forecast[key] = { status: "ok", periods: (fc.properties && fc.properties.periods) || [] };
      if (M.selected === key) paintSide();
    }).catch(function () {
      M.forecast[key] = { status: "error" };
      if (M.selected === key) paintSide();
    });
  }

  /* ---- Derived tallies (under the active layer filter) --------------------- */
  function alertMatchesLayer(a) { return M.layer === "all" || a.cat === M.layer; }
  function stateHazard(ab) { // strongest severity rank in a state under current layer
    var st = M.byState[ab]; if (!st) return -1;
    if (M.layer === "all") return st.rank;
    var r = -1; st.alerts.forEach(function (a) { if (a.cat === M.layer) r = Math.max(r, a.rank); });
    return r;
  }
  function totals() {
    var states = {}, facs = 0, alerts = 0, elevated = 0;
    M.alerts.forEach(function (a) { if (alertMatchesLayer(a)) { alerts++; a.states.forEach(function (s) { states[s] = 1; }); } });
    (window.PNC_LOCATIONS || []).forEach(function (l) { if (stateHazard(l.state) >= 0) facs++; });
    Object.keys(M.byState).forEach(function (ab) { if (gridBand(M.byState[ab].stress).k === "elev" || gridBand(M.byState[ab].stress).k === "high" || gridBand(M.byState[ab].stress).k === "severe") elevated++; });
    return { states: Object.keys(states).length, facs: facs, alerts: alerts, elevated: elevated };
  }

  /* ---- Map ----------------------------------------------------------------- */
  function svgMap() {
    var geo = buildGeo();
    var foot = window.PNC_FOOTPRINT || {};
    var s = "";
    // 1) state polygons
    geo.paths.forEach(function (st) {
      var rank = stateHazard(st.abbr), fill;
      if (rank >= 0) fill = HAZ_FILL[rank];
      else { var t = foot[st.abbr]; fill = t ? TIER_FILL[t.tier] : NEUTRAL_FILL; }
      s += '<path class="loc-state" data-action="loc-state" data-abbr="' + st.abbr + '" d="' + st.d +
        '" fill="' + fill + '" stroke="#ffffff" stroke-width="0.8"><title>' +
        esc(st.name) + (rank >= 0 ? " — " + HAZ_LABEL[rank] + " hazard active" : (foot[st.abbr] ? " — PNC footprint" : "")) + '</title></path>';
    });
    // 2) modeled power-grid stress flags
    if (M.showPower) {
      var ZAP = "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z";
      geo.paths.forEach(function (st) {
        var d = M.byState[st.abbr]; if (!d) return;
        var b = gridBand(d.stress); if (b.k !== "high" && b.k !== "severe") return;
        var col = b.k === "severe" ? "#7a1208" : "#8a5a00";
        s += '<g transform="translate(' + (st.cx + 8) + ',' + (st.cy - 16) + ') scale(0.62)" pointer-events="none">' +
          '<circle cx="12" cy="12" r="13" fill="#fff" opacity="0.92"/>' +
          '<path d="' + ZAP + '" fill="' + col + '"/></g>';
      });
    }
    // 3) PNC markers (sorted so larger/important draw last = on top)
    var locs = (window.PNC_LOCATIONS || []).slice().sort(function (a, b) { return kindOf(a.kind).z - kindOf(b.kind).z; });
    locs.forEach(function (l) {
      var p = geo.project(l.lng, l.lat), k = kindOf(l.kind), sel = M.selected === l.name;
      s += '<circle class="loc-mark' + (sel ? " sel" : "") + '" data-action="loc-select" data-name="' + esc(l.name) +
        '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (sel ? k.r + 2.5 : k.r) +
        '" fill="' + k.c + '" stroke="#ffffff" stroke-width="' + (sel ? 2.4 : 1.4) + '">' +
        '<title>' + esc(l.name) + " — " + esc(l.city) + ", " + esc(l.state) + '</title></circle>';
    });
    return '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" width="100%" preserveAspectRatio="xMidYMid meet" ' +
      'role="img" aria-label="Map of PNC U.S. locations with active weather hazards">' + s + '</svg>';
  }

  /* ---- Pieces -------------------------------------------------------------- */
  function statusChip() {
    var map = { loading: ["Updating…", "loading"], ok: ["Live", "ok"], error: ["Feed offline", "err"], idle: ["—", ""] };
    var m = map[M.status] || map.idle;
    var when = M.updatedAt ? M.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
    return '<span class="loc-live ' + m[1] + '">' + icon("radio", 14) + m[0] + '</span>' +
      '<span class="loc-when">' + (M.status === "error" ? "last attempt failed" : "Updated " + esc(when)) + '</span>';
  }

  function headHtml() {
    return '<div class="loc-head">' +
      '<div class="loc-head-l">' + icon("activity", 18, "var(--pnc-blue)") +
      '<span class="loc-head-t">Live hazard &amp; resilience monitor</span>' + statusChip() + '</div>' +
      '<div class="loc-head-r">' +
      '<button class="loc-btn" data-action="loc-power" aria-pressed="' + M.showPower + '">' +
        icon(M.showPower ? "zap" : "zap-off", 15) + 'Grid stress' + '</button>' +
      '<button class="loc-btn" data-action="loc-auto" aria-pressed="' + M.auto + '">' +
        icon("clock", 15) + 'Auto ' + (M.auto ? "on" : "off") + '</button>' +
      '<button class="loc-btn primary" data-action="loc-refresh"' + (M.status === "loading" ? " disabled" : "") + '>' +
        icon("refresh-cw", 15) + 'Refresh' + '</button>' +
      '</div></div>';
  }

  function kpisHtml() {
    var t = M.totals = totals();
    var nFac = (window.PNC_LOCATIONS || []).length;
    var nStates = Object.keys(window.PNC_FOOTPRINT || {}).length;
    function tile(ic, val, lab, tone) {
      return '<div class="loc-kpi' + (tone ? " " + tone : "") + '">' + icon(ic, 18) +
        '<div><div class="loc-kpi-v">' + val + '</div><div class="loc-kpi-l">' + lab + '</div></div></div>';
    }
    return tile("building-2", nFac, "Named facilities", "") +
      tile("map-pin", "~2,300", "Branches · " + nStates + " states + DC", "") +
      tile("alert-triangle", t.alerts, "Active hazard alerts", t.alerts ? "warn" : "good") +
      tile("navigation", t.facs, "Facilities under a hazard", t.facs ? "warn" : "good") +
      tile("zap", t.elevated, "Regions at elevated grid stress", t.elevated ? "warn" : "good");
  }

  function layersHtml() {
    var btn = function (key, label, ic) {
      var on = M.layer === key, n = key === "all" ? M.alerts.length
        : M.alerts.filter(function (a) { return a.cat === key; }).length;
      return '<button class="loc-layer' + (on ? " on" : "") + '" data-action="loc-layer" data-layer="' + key + '">' +
        icon(ic, 14) + esc(label) + (M.status === "ok" ? '<span class="loc-layer-n">' + n + '</span>' : '') + '</button>';
    };
    var s = btn("all", "All hazards", "layers");
    CATS.forEach(function (c) { s += btn(c.key, c.label, c.icon); });
    return '<div class="loc-layers">' + s + '</div>';
  }

  function legendHtml() {
    var kinds = "";
    ["Headquarters", "Operations Center", "Regional HQ", "Market HQ", "Subsidiary"].forEach(function (k) {
      kinds += '<span class="loc-leg"><i style="background:' + KIND[k].c + '"></i>' + esc(k) + '</span>';
    });
    var sev = "";
    [[4, "Extreme"], [3, "Severe"], [2, "Moderate"], [1, "Minor"]].forEach(function (p) {
      sev += '<span class="loc-leg"><i style="background:' + HAZ_FILL[p[0]] + '"></i>' + p[1] + '</span>';
    });
    return '<div class="loc-legend"><div class="loc-leg-row"><b>PNC sites</b>' + kinds + '</div>' +
      '<div class="loc-leg-row"><b>Active hazard</b>' + sev +
      '<span class="loc-leg"><i class="foot"></i>PNC footprint (no hazard)</span>' +
      '<span class="loc-leg">' + icon("zap", 12, "#8a5a00") + 'Grid stress flag</span></div></div>';
  }

  /* ---- Side column --------------------------------------------------------- */
  function fmtExpires(iso) {
    if (!iso) return "";
    var d = new Date(iso); if (isNaN(d)) return "";
    return "until " + d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  }
  function sevChip(sev) {
    var r = SEV_RANK[sev] || 0;
    return '<span class="loc-sev s' + r + '">' + esc(sev) + '</span>';
  }

  function detailHtml() {
    var loc = (window.PNC_LOCATIONS || []).find(function (l) { return l.name === M.selected; });
    if (!loc) {
      return '<div class="loc-card"><div class="loc-card-h">' + icon("landmark", 16) +
        'PNC footprint</div><p class="loc-muted">PNC Financial Services Group operates roughly ' +
        '<b>2,300 retail branches</b> and ~9,500 ATMs across <b>28 states and Washington, D.C.</b>, ' +
        'plus the corporate headquarters, regional/market headquarters, operations centers and ' +
        'subsidiary offices plotted here. Select any marker for site stats and a live forecast.</p>' +
        '<p class="loc-muted">Map fill shows live NWS hazards where active, and PNC branch density ' +
        'elsewhere. Toggle a hazard layer above to isolate hurricanes, tornadoes, fire risk, and more.</p></div>';
    }
    var k = kindOf(loc.kind), st = M.byState[loc.state], band = gridBand(st ? st.stress : 0);
    var stats = "";
    function row(l, v) { return v == null ? "" : '<div class="loc-stat"><span>' + l + '</span><b>' + v + '</b></div>'; }
    stats += row("Type", esc(loc.kind));
    stats += row("Location", esc(loc.city) + ", " + esc(loc.state));
    stats += row("Est. employees", loc.employees ? loc.employees.toLocaleString() + "*" : null);
    stats += row("Metro branches", loc.branchesMetro != null ? "~" + loc.branchesMetro + "*" : null);
    stats += row("Since", loc.established || null);

    var hz = "";
    if (st && st.alerts.length) {
      var seen = {};
      hz = st.alerts.slice(0, 6).map(function (a) {
        return '<a class="loc-haz" href="' + esc(a.id) + '" target="_blank" rel="noopener">' +
          sevChip(a.sev) + '<span>' + esc(a.event) + '</span></a>';
      }).join("");
      hz = '<div class="loc-card-sec"><div class="loc-sec-h">' + icon("alert-triangle", 14) +
        'Active hazards in ' + esc(loc.state) + '</div><div class="loc-haz-wrap">' + hz + '</div></div>';
    } else {
      hz = '<div class="loc-card-sec"><span class="loc-ok">' + icon("shield-check", 14) +
        'No active NWS hazard for ' + esc(loc.state) + '</span></div>';
    }

    var grid = '<div class="loc-card-sec"><div class="loc-sec-h">' + icon("zap", 14) +
      'Modeled grid stress</div><div class="loc-grid-pill" style="color:' + band.c + ';background:' + band.bg + '">' +
      band.label + (st ? ' · index ' + st.stress.toFixed(1) : '') + '</div>' +
      '<div class="loc-tiny">Derived from live hazards in ' + esc(loc.state) + ' — not a live utility feed.</div></div>';

    return '<div class="loc-card detail">' +
      '<div class="loc-card-h"><span class="loc-dot" style="background:' + k.c + '"></span>' + esc(loc.name) +
      (loc.verified ? ' <span class="loc-verified" title="Publicly documented facility">' + icon("file-check", 13) + '</span>' : '') + '</div>' +
      (loc.note ? '<p class="loc-note">' + esc(loc.note) + '</p>' : '') +
      '<div class="loc-stats">' + stats + '</div>' +
      hz + grid + forecastHtml(loc) +
      '<div class="loc-tiny">* employee / branch figures are representative estimates — see caveats.</div>' +
      '</div>';
  }

  function forecastHtml(loc) {
    var f = M.forecast[loc.name];
    var head = '<div class="loc-sec-h">' + icon("thermometer", 14) + 'Live forecast — ' + esc(loc.city) + '</div>';
    if (!f || f.status === "loading") return '<div class="loc-card-sec">' + head + '<div class="loc-tiny">Loading NWS forecast…</div></div>';
    if (f.status === "error") return '<div class="loc-card-sec">' + head + '<div class="loc-tiny">Forecast unavailable right now.</div></div>';
    var rows = (f.periods || []).slice(0, 4).map(function (p) {
      return '<div class="loc-fc"><div class="loc-fc-n">' + esc(p.name) + '</div>' +
        '<div class="loc-fc-t">' + esc(p.temperature) + '°' + esc(p.temperatureUnit || "F") + '</div>' +
        '<div class="loc-fc-s">' + esc(p.shortForecast || "") +
        (p.windSpeed ? ' · ' + esc(p.windDirection || "") + ' ' + esc(p.windSpeed) : '') + '</div></div>';
    }).join("");
    return '<div class="loc-card-sec">' + head + '<div class="loc-fc-wrap">' + (rows || '<div class="loc-tiny">No periods returned.</div>') + '</div></div>';
  }

  function hazardsListHtml() {
    var list = M.alerts.filter(alertMatchesLayer);
    var head = '<div class="loc-card-h">' + icon("radio", 16) + 'Active hazards' +
      '<span class="loc-count">' + list.length + '</span></div>';
    if (M.status === "error")
      return '<div class="loc-card">' + head + '<p class="loc-muted">Live NWS feed unavailable — showing the footprint map only. Retry with Refresh.</p></div>';
    if (M.status === "loading" && !M.alerts.length)
      return '<div class="loc-card">' + head + '<p class="loc-muted">Loading active watches &amp; warnings from the National Weather Service…</p></div>';
    if (!list.length)
      return '<div class="loc-card">' + head + '<p class="loc-ok">' + icon("shield-check", 14) +
        'No active ' + (M.layer === "all" ? "tracked hazards" : (catByKey(M.layer) || {}).label) + ' across the PNC footprint.</p></div>';
    // Only show alerts that touch a PNC-footprint state, most severe first.
    var foot = window.PNC_FOOTPRINT || {};
    var inFoot = list.filter(function (a) { return a.states.some(function (s) { return foot[s] || s === "DC"; }); });
    var show = (inFoot.length ? inFoot : list).slice(0, 40);
    var items = show.map(function (a) {
      var c = catByKey(a.cat) || { icon: "alert-triangle" };
      var hitFoot = a.states.filter(function (s) { return foot[s]; });
      return '<a class="loc-alert" href="' + esc(a.id) + '" target="_blank" rel="noopener">' +
        '<span class="loc-alert-ic">' + icon(c.icon, 15) + '</span>' +
        '<span class="loc-alert-b"><span class="loc-alert-t">' + sevChip(a.sev) + esc(a.event) + '</span>' +
        '<span class="loc-alert-a">' + esc(clip(a.area, 90)) + '</span>' +
        '<span class="loc-alert-m">' + (hitFoot.length ? 'PNC: ' + esc(hitFoot.join(", ")) + ' · ' : '') + esc(fmtExpires(a.expires)) + '</span></span></a>';
    }).join("");
    return '<div class="loc-card">' + head +
      '<div class="loc-tiny" style="margin:-2px 0 8px">From api.weather.gov · prioritising the PNC footprint</div>' +
      '<div class="loc-alerts">' + items + '</div></div>';
  }

  function gridListHtml() {
    var rows = Object.keys(M.byState).map(function (ab) {
      return { ab: ab, st: M.byState[ab], band: gridBand(M.byState[ab].stress) };
    }).filter(function (r) { return r.band.k !== "none" && r.band.k !== "low"; })
      .sort(function (a, b) { return b.st.stress - a.st.stress; }).slice(0, 12);
    var foot = window.PNC_FOOTPRINT || {};
    var head = '<div class="loc-card-h">' + icon("zap", 16) + 'Regional grid stress' + '</div>';
    if (!rows.length)
      return '<div class="loc-card">' + head + '<p class="loc-ok">' + icon("shield-check", 14) +
        'No elevated grid-stress regions modeled right now.</p></div>';
    var items = rows.map(function (r) {
      return '<div class="loc-gridrow"><span class="loc-grid-ab' + (foot[r.ab] ? " foot" : "") + '">' + r.ab + '</span>' +
        '<span class="loc-bar"><span style="width:' + Math.min(100, r.st.stress / 20 * 100).toFixed(0) +
        '%;background:' + r.band.c + '"></span></span>' +
        '<span class="loc-grid-pill sm" style="color:' + r.band.c + ';background:' + r.band.bg + '">' + r.band.label + '</span></div>';
    }).join("");
    return '<div class="loc-card">' + head +
      '<div class="loc-tiny" style="margin:-2px 0 8px">Modeled outage-risk index from live hazards. Bold = PNC footprint.</div>' +
      items + '</div>';
  }

  function sideHtml() {
    return detailHtml() + hazardsListHtml() + gridListHtml();
  }

  function body() {
    return headHtml() +
      '<div class="loc-kpis" id="loc-kpis">' + kpisHtml() + '</div>' +
      '<div class="loc-grid-2">' +
      '<section class="loc-map-card">' + layersHtml() +
      '<div class="loc-map-wrap" id="loc-map">' + svgMap() + '</div>' + legendHtml() + '</section>' +
      '<aside class="loc-side" id="loc-side">' + sideHtml() + '</aside>' +
      '</div>' +
      '<p class="loc-caveat">' + icon("alert-triangle", 13) +
      ' Named corporate, regional, operations and subsidiary facilities are real and publicly documented; ' +
      'per-site employee and metro-branch figures are <b>representative estimates</b> (PNC does not publish them). ' +
      'The ~2,300-branch retail network is summarized at the state level. Hazards are <b>live</b> from the U.S. ' +
      'National Weather Service (api.weather.gov); the grid-stress index is <b>modeled</b> from those hazards, not a live utility feed.</p>';
  }

  /* ---- Targeted repaints --------------------------------------------------- */
  function $(id) { return document.getElementById(id); }
  function paint() {
    var root = $("loc-view"); if (!root || !M.mounted) return;
    root.innerHTML = body();
  }
  function paintSide() { var el = $("loc-side"); if (el) el.innerHTML = sideHtml(); }
  function paintStatus() {
    var root = $("loc-view"); if (!root) return;
    var head = root.querySelector(".loc-head"); if (head) head.outerHTML = headHtml();
  }

  /* ---- Events / lifecycle -------------------------------------------------- */
  function handleClick(e) {
    if (!M.mounted) return;
    var el = e.target.closest("[data-action]"); if (!el || !$("loc-view") || !$("loc-view").contains(el)) return;
    switch (el.getAttribute("data-action")) {
      case "loc-refresh": refresh(); break;
      case "loc-auto": M.auto = !M.auto; setTimer(); paintStatus(); break;
      case "loc-power": M.showPower = !M.showPower; paintStatus(); var m = $("loc-map"); if (m) m.innerHTML = svgMap(); break;
      case "loc-layer": M.layer = el.getAttribute("data-layer"); paint(); break;
      case "loc-select": {
        var name = el.getAttribute("data-name");
        M.selected = M.selected === name ? null : name;
        if (M.selected) { var loc = window.PNC_LOCATIONS.find(function (l) { return l.name === M.selected; }); if (loc) loadForecast(loc); }
        var mp = $("loc-map"); if (mp) mp.innerHTML = svgMap();
        paintSide();
        var sd = $("loc-side"); if (sd && M.selected) sd.scrollIntoView({ block: "nearest", behavior: "smooth" });
        break;
      }
      case "loc-state": {
        // Select the most significant PNC site in the clicked state, if any.
        var ab = el.getAttribute("data-abbr");
        var inSt = (window.PNC_LOCATIONS || []).filter(function (l) { return l.state === ab; })
          .sort(function (a, b) { return kindOf(b.kind).z - kindOf(a.kind).z; });
        if (inSt[0]) { M.selected = inSt[0].name; loadForecast(inSt[0]); var mm = $("loc-map"); if (mm) mm.innerHTML = svgMap(); paintSide(); }
        break;
      }
    }
  }

  function setTimer() {
    if (M.timer) { clearInterval(M.timer); M.timer = null; }
    if (M.auto && M.mounted) M.timer = setInterval(refresh, REFRESH_MS);
  }

  function render() { return '<div id="loc-view" class="loc-view"></div>'; }

  function mount() {
    M.mounted = true;
    var root = $("loc-view"); if (root) root.innerHTML = body();
    if (!M.onClick) { M.onClick = handleClick; document.addEventListener("click", M.onClick); }
    setTimer();
    // Fetch on first entry or when the cached feed is stale.
    if (M.status !== "loading" && (!M.fetchedAt || Date.now() - M.fetchedAt > STALE_MS)) refresh();
  }

  function unmount() {
    M.mounted = false;
    if (M.timer) { clearInterval(M.timer); M.timer = null; }
    if (M.onClick) { document.removeEventListener("click", M.onClick); M.onClick = null; }
  }

  // small shared helper (clip long strings)
  function clip(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  window.LOCATIONS_VIEW = { render: render, mount: mount, unmount: unmount };
})();
