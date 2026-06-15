/* PQC Readiness Monitor — detail drawer (slide-over) for institutions and
   third-party providers. Click outside, the × button, or Escape closes it. */

(function () {
  function signalTile(iconName, label, value, tone) {
    var colors = { good: "var(--success)", mid: "var(--info)", warn: "var(--warning)", bad: "var(--danger)", na: "var(--fg-3)" };
    var c = colors[tone] || colors.na;
    return '<div class="sig-tile">' +
      '<span class="sig-tile-label">' + icon(iconName, 14, c) + esc(label) + '</span>' +
      '<span class="sig-tile-value">' + esc(value) + '</span></div>';
  }

  function row(k, valHtml) {
    return '<div class="drawer-row"><span class="drawer-row-key">' + esc(k) + '</span>' +
      '<span class="drawer-row-val">' + valHtml + '</span></div>';
  }

  /* Rating basis — decompose the published score into the four externally
     observable signals, each with a strength level (0-3) and a technical
     rationale derived from the entity's own data. Honest by construction:
     it explains how the methodology applies to this record rather than
     inventing measurements not in the dataset. */
  function ratingBasis(bank) {
    var isVendor = bank.kind === "vendor";
    var sig = bank.signals || {};
    var dims = [];

    if (!isVendor) {
      var edge = bank.edge || "its edge provider";
      var dom = bank.domain;
      var tlsMap = {
        live:    [3, "Primary site negotiates hybrid post-quantum key exchange — X25519MLKEM768 (X25519 + ML-KEM-768, FIPS 203) — via " + edge + ". Data in transit on the public endpoint already resists harvest-now-decrypt-later capture."],
        partial: [2, "Edge/CDN provider (" + edge + ") supports hybrid ML-KEM key exchange, but site-wide negotiation on " + dom + " was not confirmed at snapshot. The capability is present; enablement is the remaining step."],
        none:    [1, dom + " negotiates classical key exchange (ECDHE / RSA) only — no post-quantum protection for data in transit was observed."],
        unknown: [0, "Public TLS posture for " + dom + " has not been scanned in this snapshot; this dimension is held pending a live X25519MLKEM768 handshake test."],
      };
      var t = tlsMap[bank.tls] || tlsMap.unknown;
      dims.push({ label: "Public-web cryptography (TLS)", level: t[0], tech: t[1] });

      var rm = (sig.roadmap || "").toString(), rml = rm.toLowerCase(), pl, pt;
      if (rml.indexOf("public") >= 0) { pl = 3; pt = "Public disclosure of a quantum-safe program (" + rm + ")."; }
      else if (/signal|parent|internal|program|pilot|paper/.test(rml)) { pl = 2; pt = "Indirect program evidence (" + rm + ")."; }
      else { pl = bank.conf === "Estimated" ? 0 : 1; pt = "No public PQC program disclosure was located; this dimension is scored from sector-baseline expectations for the tier."; }
      if (bank.infraNotes && bank.infraNotes.length) pt += " Corroborated by " + bank.infraNotes.length + " documented program detail(s) listed below.";
      dims.push({ label: "Disclosed PQC program", level: pl, tech: pt });

      var st = sig.standards || [], sl, stt;
      if (st.length) { sl = bank.conf === "Documented" ? 3 : 2; stt = "Participation evidenced in: " + st.join(", ") + "."; }
      else { sl = bank.conf === "Estimated" ? 1 : 0; stt = "No specific standards-body participation evidenced; FS-ISAC membership is typical for this tier but unconfirmed."; }
      dims.push({ label: "Standards & sector participation", level: sl, tech: stt });

      var el = (bank.edge || "").toLowerCase(), il;
      if (/cloudflare|aws|azure|google|in-house|thought machine/.test(el)) il = 3;
      else if (/akamai|multi-cdn|fastly/.test(el)) il = 2;
      else if (/fiserv|jack henry|fis|temenos|finastra|mixed/.test(el)) il = 1;
      else il = 2;
      var inf = sig.infra || bank.note || ("Edge / platform: " + (bank.edge || "mixed") + ".");
      if (/fiserv|jack henry|\bfis\b/.test(el)) inf += " Reliance on a third-party core processor means PQC timing is largely inherited from that vendor's roadmap.";
      dims.push({ label: "Crypto-agility & infrastructure", level: il, tech: inf });
    } else {
      var pqcMap = {
        shipping: [3, "Post-quantum cryptography is shipping in products financial institutions consume today."],
        roadmap:  [2, "A public migration plan exists, but PQC is not yet broadly shipping in its financial-sector products."],
        research: [1, "Activity is limited to research, pilots, or thought leadership; no product PQC timeline yet."],
        none:     [0, "No public post-quantum activity in products; client institutions should raise PQC support in due-diligence and renewals."],
      };
      var p = pqcMap[bank.pqc] || pqcMap.none;
      dims.push({ label: "Product PQC availability", level: p[0], tech: bank.note || p[1] });

      var cl = (bank.pqc === "shipping" || bank.pqc === "roadmap")
        ? (bank.conf === "Documented" ? 3 : 2)
        : (bank.conf === "Documented" ? 2 : 1);
      dims.push({ label: "Public roadmap & commitments", level: cl,
        tech: bank.conf === "Documented" ? "Backed by published announcements, product documentation, or filings."
          : bank.conf === "Inferred" ? "Inferred from product behaviour and sector positioning; no direct disclosure."
          : "Representative estimate pending a documentation review." });

      var vsl = bank.conf === "Documented" ? 3 : bank.conf === "Inferred" ? 2 : 1;
      dims.push({ label: "Standards participation", level: vsl,
        tech: bank.conf === "Documented" ? "Active in NIST / IETF / sector working groups on post-quantum cryptography."
          : "Standards-body involvement not individually confirmed at snapshot." });

      dims.push({ label: "Sector reach & blast radius", level: 2,
        tech: bank.foot ? "Sector footprint: " + bank.foot + ". Its cryptographic choices propagate to every institution that consumes it — amplifying the impact of this rating."
          : "Provider type: " + bank.type + "." });
    }

    var band = bank.score >= 70 ? "Advanced" : bank.score >= 45 ? "In progress" : bank.score >= 25 ? "Early stage" : "Not evident";
    var sorted = dims.slice().sort(function (a, b) { return b.level - a.level; });
    var verdict = bank.name + "'s " + band + " rating (" + bank.score + "/100) is anchored by " +
      sorted[0].label.toLowerCase() + "; the main gap is " + sorted[sorted.length - 1].label.toLowerCase() +
      ". Overall evidence level: " + bank.conf + ".";
    return { dims: dims, verdict: verdict };
  }

  function buildRatingBasis(bank) {
    var rb = ratingBasis(bank);
    var COL = ["var(--fg-3)", "var(--warning)", "var(--info)", "var(--success)"];
    var WORD = ["Not assessed", "Limited", "Moderate", "Strong"];
    function bar(level) {
      var s = "";
      for (var i = 0; i < 3; i++) s += '<span class="lvl-seg" style="background:' + (i < level ? COL[level] : "var(--gray-200)") + '"></span>';
      return '<span class="lvl-bar">' + s + '</span>';
    }
    var rows = rb.dims.map(function (d) {
      return '<div class="rb-row"><div class="rb-row-head">' +
        '<span class="rb-label">' + esc(d.label) + '</span>' + bar(d.level) +
        '<span class="rb-level" style="color:' + COL[d.level] + '">' + WORD[d.level] + '</span></div>' +
        '<div class="rb-tech">' + esc(d.tech) + '</div></div>';
    }).join('');
    return '<div class="drawer-h">Rating basis — technical analysis</div>' +
      '<div class="rb-note">Four externally-observable signals are weighted into the 0–100 readiness score (see Methodology). Each is assessed below from the evidence available at snapshot.</div>' +
      '<div class="rb-list">' + rows + '</div>' +
      '<div class="rb-verdict">' + esc(rb.verdict) + '</div>';
  }

  function drawerHtml(bank) {
    var isVendor = bank.kind === "vendor";
    var tlsToneMap = { live: "good", partial: "mid", none: "bad", unknown: "na" };
    var pqcToneMap = { shipping: "good", roadmap: "mid", research: "warn", none: "na" };
    var sig = bank.signals || {};
    var roadmap = sig.roadmap || (isVendor
      ? ({ shipping: "PQC shipping in products", roadmap: "Public migration plan", research: "Research signals only", none: "None public" })[bank.pqc]
      : "None public");
    var standards = (sig.standards && sig.standards.length) ? sig.standards.join(" · ")
      : isVendor ? (bank.conf === "Documented" ? "Active in NIST / IETF / sector working groups" : "—")
      : (bank.conf === "Estimated" ? "FS-ISAC membership typical for this tier" : "—");
    var infra = sig.infra || bank.note || (isVendor ? bank.type : "Edge / platform: " + bank.edge);

    var roadmapTone = roadmap === "Public" || roadmap === "Public papers" ? "good"
      : roadmap.indexOf("signals") !== -1 || roadmap.indexOf("Parent") !== -1 || roadmap.indexOf("Internal") !== -1 ? "mid" : "na";

    var firstTile = isVendor
      ? signalTile(PQC_META[bank.pqc].icon, "Product PQC", PQC_META[bank.pqc].label, pqcToneMap[bank.pqc])
      : signalTile(TLS_META[bank.tls].icon, "Website TLS",
          bank.tls === "live" ? "Hybrid ML-KEM key exchange live"
          : bank.tls === "partial" ? "Hybrid-capable edge; not yet site-wide"
          : bank.tls === "none" ? "Classical key exchange only" : "Not assessed in this snapshot",
          tlsToneMap[bank.tls]);

    var profile = isVendor
      ? row("Revenue", '<span class="mono">' + fmtRev(bank.rev) + '</span> <span class="dim">approx., annual</span>') +
        row("Provider type", esc(bank.type)) +
        row("Headquarters", esc(bank.hq)) +
        row("Primary website", esc(bank.domain)) +
        (bank.foot ? row("Sector footprint", esc(bank.foot)) : '')
      : row("Total assets", '<span class="mono">' + fmtAssets(bank.assets) + '</span> <span class="dim">approx., Q1 2026</span>') +
        row("Category", esc(bank.cat)) +
        row("Ticker", bank.ticker && bank.ticker !== "—" ? '<span class="mono">' + esc(bank.ticker) + '</span>' : "Privately held / N.A.") +
        row("Headquarters", esc(bank.hq)) +
        row("Primary website", esc(bank.domain)) +
        row("Edge / platform", esc(bank.edge));

    var notes = (bank.infraNotes && bank.infraNotes.length)
      ? '<div class="drawer-h">Infrastructure &amp; program notes</div><ul class="drawer-notes">' +
        bank.infraNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>'
      : '';

    var news = (bank.news && bank.news.length)
      ? '<div class="drawer-h">Technology news</div><div style="display:grid">' +
        bank.news.map(function (n) {
          return '<div class="drawer-news-item"><span class="drawer-news-date">' + esc(n.d) + '</span>' +
            '<div><div class="drawer-news-title">' + esc(n.t) + '</div>' +
            '<div class="drawer-news-src">' + esc(n.s) + '</div></div></div>';
        }).join('') + '</div>'
      : '';

    var evidence = bank.conf === "Documented"
      ? "Assessment grounded in public announcements, filings, or published research."
      : bank.conf === "Inferred"
      ? "Assessment inferred from infrastructure choices and sector participation; no direct program disclosure."
      : "Representative assessment pending a live TLS scan and research pass. Treat as a placeholder, not a finding.";

    return '<div class="drawer-overlay" data-action="close-drawer">' +
      '<div class="drawer-panel" data-stop>' +
      '<div class="drawer-head">' +
      '<div class="drawer-head-main">' +
      '<div class="drawer-chips"><span class="drawer-rank">#' + String(bank.rank).padStart(2, "0") + '</span>' +
      readinessBadge(bank.status) + confChip(bank.conf) + '</div>' +
      '<h2 class="drawer-name">' + esc(bank.name) + '</h2>' +
      '<div class="drawer-sub">' + esc(bank.domain) + ' · ' + esc(bank.hq) + '</div>' +
      '</div>' +
      '<div class="drawer-scorebox">' +
      '<div class="drawer-score" style="color:' + scoreColor(bank.score) + '">' + bank.score + '</div>' +
      '<div class="drawer-score-label">Readiness</div>' +
      '<button class="drawer-close" data-action="close-drawer" aria-label="Close">' + icon("x", 20) + '</button>' +
      '</div></div>' +
      '<div class="drawer-body">' +
      '<p class="drawer-summary">' + esc(isVendor ? vendorSummary(bank) : instSummary(bank)) + '</p>' +
      '<div class="drawer-h">Readiness signals</div>' +
      '<div class="sig-grid">' +
      firstTile +
      signalTile("route", "Public roadmap", roadmap, roadmapTone) +
      signalTile("users", "Standards bodies", standards, standards === "—" ? "na" : "mid") +
      signalTile("server", "Infrastructure", infra, "mid") +
      '</div>' +
      buildRatingBasis(bank) +
      '<div class="drawer-h">' + (isVendor ? "Provider profile" : "Institution profile") + '</div>' +
      profile + notes + news +
      '<div class="drawer-evidence"><strong>Evidence: ' + esc(bank.conf) + '.</strong> ' + evidence + '</div>' +
      '</div></div></div>';
  }

  var root = null;

  window.openDrawer = function (bank) {
    root = root || document.getElementById("drawer-root");
    root.innerHTML = drawerHtml(bank);
  };

  window.closeDrawer = function () {
    root = root || document.getElementById("drawer-root");
    root.innerHTML = "";
  };

  window.isDrawerOpen = function () {
    root = root || document.getElementById("drawer-root");
    return root.innerHTML !== "";
  };
})();
