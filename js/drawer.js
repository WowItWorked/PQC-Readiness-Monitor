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
      var edge = bank.edge || "its hosting provider";
      var dom = bank.domain;
      var tlsMap = {
        live:    [3, "Its main website already uses quantum-safe encryption, so information sent to and from the site is protected against being decrypted by future quantum computers.",
          "Primary site negotiates hybrid post-quantum key exchange — X25519MLKEM768 (X25519 + ML-KEM-768, FIPS 203) — via " + edge + ". Data in transit on the public endpoint already resists harvest-now-decrypt-later capture."],
        partial: [2, "Its hosting provider supports quantum-safe encryption, but it has not yet been switched on across the website.",
          "Edge/CDN provider (" + edge + ") supports hybrid ML-KEM key exchange, but site-wide negotiation on " + dom + " was not confirmed."],
        none:    [1, "Its main website still relies only on today's encryption, which future quantum computers are expected to break.",
          dom + " negotiates classical key exchange (ECDHE / RSA) only — no post-quantum protection for data in transit was observed."],
        unknown: [0, "This website has not been checked yet.",
          "Public TLS posture for " + dom + " is pending a live X25519MLKEM768 handshake test."],
      };
      var t = tlsMap[bank.tls] || tlsMap.unknown;
      var tlsPlain = t[1], tlsTech = t[2];
      if (bank.tlsObserved) {
        tlsPlain += " Confirmed by our automated check" + (bank.tlsScanned ? " on " + fmtIso(bank.tlsScanned) : "") + ".";
        tlsTech += " Observed directly by an automated TLS handshake, not assumed.";
      }
      dims.push({ label: "Website encryption", level: t[0], plain: tlsPlain, tech: tlsTech });

      var rm = (sig.roadmap || "").toString(), rml = rm.toLowerCase(), pl, pp, pt;
      if (rml.indexOf("public") >= 0) {
        pl = 3; pp = "The institution has publicly described a program to prepare for quantum-safe security.";
        pt = "Public disclosure of a quantum-safe program (" + rm + ").";
      } else if (/signal|parent|internal|program|pilot|paper/.test(rml)) {
        pl = 2; pp = "There are indirect signs of a program — for example pilots, research, or statements by a parent company.";
        pt = "Indirect program evidence (" + rm + ").";
      } else {
        pl = bank.conf === "Estimated" ? 0 : 1;
        pp = "We found no public description of a program. This area is rated using what is typical for an institution of its size.";
        pt = "No public PQC program disclosure was located; scored from sector-baseline expectations for the tier.";
      }
      if (bank.infraNotes && bank.infraNotes.length) pt += " Corroborated by " + bank.infraNotes.length + " documented program detail(s) listed below.";
      dims.push({ label: "Public commitment", level: pl, plain: pp, tech: pt });

      var st = sig.standards || [], sl, sp, stt;
      if (st.length) {
        sl = bank.conf === "Documented" ? 3 : 2;
        sp = "Takes part in industry or government groups working on the transition (" + st.length + " identified).";
        stt = "Participation evidenced in: " + st.join(", ") + ".";
      } else {
        sl = bank.conf === "Estimated" ? 1 : 0;
        sp = "We found no confirmed participation in industry working groups on this topic.";
        stt = "No specific standards-body participation evidenced; FS-ISAC membership is typical for this tier but unconfirmed.";
      }
      dims.push({ label: "Industry participation", level: sl, plain: sp, tech: stt });

      var el = (bank.edge || "").toLowerCase(), il;
      if (/cloudflare|aws|azure|google|in-house|thought machine/.test(el)) il = 3;
      else if (/akamai|multi-cdn|fastly/.test(el)) il = 2;
      else if (/fiserv|jack henry|fis|temenos|finastra|mixed/.test(el)) il = 1;
      else il = 2;
      var ip = il === 3 ? "Its technology choices make upgrading comparatively straightforward."
        : il === 2 ? "Its technology providers support upgrading, but part of the work depends on them."
        : "It relies heavily on a core banking provider, so its timing largely depends on that provider's plans.";
      var inf = sig.infra || bank.note || ("Edge / platform: " + (bank.edge || "mixed") + ".");
      if (/fiserv|jack henry|\bfis\b/.test(el)) inf += " Reliance on a third-party core processor means PQC timing is largely inherited from that vendor's roadmap.";
      dims.push({ label: "Ability to upgrade", level: il, plain: ip, tech: inf });
    } else {
      var pqcMap = {
        shipping: [3, "Quantum-safe protection is already available in products financial institutions use today."],
        roadmap:  [2, "The provider has published an upgrade plan, but quantum-safe protection is not yet widely available in its financial-sector products."],
        research: [1, "Activity is limited to research or pilots; there is no product timeline yet."],
        none:     [0, "We found no public plan. Clients should ask about quantum-safe support in due diligence and renewals."],
      };
      var p = pqcMap[bank.pqc] || pqcMap.none;
      dims.push({ label: "Quantum-safe products", level: p[0], plain: p[1], tech: bank.note || "" });

      var cl = (bank.pqc === "shipping" || bank.pqc === "roadmap")
        ? (bank.conf === "Documented" ? 3 : 2)
        : (bank.conf === "Documented" ? 2 : 1);
      dims.push({ label: "Published plans and commitments", level: cl,
        plain: bank.conf === "Documented" ? "Backed by the provider's own announcements, product documentation, or filings."
          : bank.conf === "Inferred" ? "Inferred from how its products behave and its position in the market; the provider has not stated it directly."
          : "A placeholder estimate until we review the provider's documentation.", tech: "" });

      var vsl = bank.conf === "Documented" ? 3 : bank.conf === "Inferred" ? 2 : 1;
      dims.push({ label: "Industry participation", level: vsl,
        plain: bank.conf === "Documented" ? "Active in standards and industry groups shaping quantum-safe security."
          : "Involvement in standards and industry groups has not been individually confirmed.",
        tech: bank.conf === "Documented" ? "Active in NIST / IETF / sector working groups on post-quantum cryptography." : "" });

      dims.push({ label: "Reach across the sector", level: 2,
        plain: "Many financial institutions depend on this provider, so its choices affect the readiness of all of them." +
          (bank.foot ? " " + bank.foot + "." : ""),
        tech: "Provider type: " + bank.type + "." });
    }

    var band = window.PQC_SCORE.band(bank.score);
    var sorted = dims.slice().sort(function (a, b) { return b.level - a.level; });
    var verdict = bank.name + " is rated " + band + " (" + bank.score + " out of 100). Its strongest area is " +
      sorted[0].label.toLowerCase() + "; the area most in need of progress is " + sorted[sorted.length - 1].label.toLowerCase() +
      ". Evidence level: " + bank.conf + ".";
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
        '<div class="rb-plain">' + esc(d.plain) + '</div>' +
        (d.tech ? '<details class="rb-tech-wrap"><summary>Technical detail</summary><div class="rb-tech">' + esc(d.tech) + '</div></details>' : '') +
        '</div>';
    }).join('');
    return '<div class="drawer-h">Why this rating</div>' +
      '<div class="rb-note">The score combines four areas we can see from the outside. Each is rated below in plain terms, with technical detail available for specialists.</div>' +
      '<div class="rb-verdict">' + esc(rb.verdict) + '</div>' +
      '<div class="rb-list">' + rows + '</div>';
  }

  // Due-diligence prompts for third-party risk and procurement, tailored to
  // what the provider has (or has not) made public.
  // The researchers' own wording, kept verbatim below the plain summary, with
  // the least familiar abbreviations spelled out.
  var EXPAND = [[/\bHNDL\b/g, "harvest-now-decrypt-later"], [/\bQKD\b/g, "quantum key distribution (QKD)"],
    [/\bCBOMs?\b/g, "cryptographic bill of materials"], [/\bHSMs?\b/g, "hardware security module (HSM)"]];
  function researchNotes(bank) {
    var parts = [bank.summary, bank.note].filter(Boolean);
    if (!parts.length) return '';
    var text = parts.join(" ");
    EXPAND.forEach(function (e) { text = text.replace(e[0], e[1]); });
    return '<div class="drawer-h">Research notes</div><p class="drawer-research">' + esc(text) + '</p>';
  }

  function vendorQuestions(v) {
    var q = {
      shipping: ["Which of the specific products and services we use already have quantum-safe protection switched on?",
        "Is it on by default, or do we need to request or configure it?",
        "What is your timeline for the products we use that are not yet covered?"],
      roadmap: ["When will quantum-safe protection be available in the products we use? Can you share dates?",
        "Will the upgrade require changes or testing on our side?",
        "Can you commit to these dates in our contract or service levels?"],
      research: ["Do you have a plan, with dates, for quantum-safe protection in the products we use?",
        "Who in your organization owns that plan?",
        "How will you keep us informed as it develops?"],
      none: ["Are you preparing for quantum-safe security? Is there a plan we can review?",
        "Which of your products and services rely on encryption that will need upgrading?",
        "Would you agree to a contractual commitment to share a plan by a set date?"],
    }[v.pqc] || [];
    if (!q.length) return '';
    return '<div class="drawer-h">Questions to raise with this provider</div>' +
      '<ul class="drawer-questions">' + q.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }

  function drawerHtml(bank) {
    var isVendor = bank.kind === "vendor";
    var tlsToneMap = { live: "good", partial: "mid", none: "bad", unknown: "na" };
    var pqcToneMap = { shipping: "good", roadmap: "mid", research: "warn", none: "na" };
    var sig = bank.signals || {};
    var roadmap = String(sig.roadmap || (isVendor
      ? ({ shipping: "Quantum-safe products available", roadmap: "Upgrade plan published", research: "Research only", none: "None public" })[bank.pqc]
      : "None public") || "None public");
    var ROADMAP_PLAIN = { "Public": "Publicly announced", "Public papers": "Published research", "None public": "Nothing public yet" };
    var roadmapShown = ROADMAP_PLAIN[roadmap] || roadmap;
    var standards = (sig.standards && sig.standards.length) ? sig.standards.join(" · ")
      : isVendor ? (bank.conf === "Documented" ? "Active in NIST / IETF / sector working groups" : "—")
      : (bank.conf === "Estimated" ? "FS-ISAC membership typical for this tier" : "—");
    var infra = isVendor ? bank.type : "Hosted with " + (bank.edge || "mixed providers");

    var roadmapTone = roadmap === "Public" || roadmap === "Public papers" ? "good"
      : roadmap.indexOf("signals") !== -1 || roadmap.indexOf("Parent") !== -1 || roadmap.indexOf("Internal") !== -1 ? "mid" : "na";

    var firstTile = isVendor
      ? signalTile((PQC_META[bank.pqc] || PQC_META.none).icon, "Quantum-safe products", (PQC_META[bank.pqc] || PQC_META.none).label, pqcToneMap[bank.pqc])
      : signalTile((TLS_META[bank.tls] || TLS_META.unknown).icon, "Website encryption",
          bank.tls === "live" ? "Quantum-safe encryption in use"
          : bank.tls === "partial" ? "Available but not switched on"
          : bank.tls === "none" ? "Not yet quantum-safe" : "Not checked yet",
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
        row("Hosting / platform", esc(bank.edge));

    var notes = (bank.infraNotes && bank.infraNotes.length)
      ? '<div class="drawer-h">Program notes</div><ul class="drawer-notes">' +
        bank.infraNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>'
      : '';

    var news = (bank.news && bank.news.length)
      ? '<div class="drawer-h">Related news</div><div style="display:grid">' +
        bank.news.map(function (n) {
          return '<div class="drawer-news-item"><span class="drawer-news-date">' + esc(n.d) + '</span>' +
            '<div><div class="drawer-news-title"><a href="' + esc(newsUrl(n)) +
            '" target="_blank" rel="noopener">' + esc(n.t) + '</a></div>' +
            '<div class="drawer-news-src">' + esc(n.s) + '</div></div></div>';
        }).join('') + '</div>'
      : '';

    var evidence = bank.conf === "Documented"
      ? "This rating is based on the organization's own public announcements, filings, or published research."
      : bank.conf === "Inferred"
      ? "This rating is inferred from the organization's technology choices and industry participation; it has not described a program directly."
      : "This is a placeholder estimate until we research the organization in detail. Treat it as a starting point, not a finding.";

    return '<div class="drawer-overlay" data-action="close-drawer">' +
      '<div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' +
      '<div class="drawer-head">' +
      '<div class="drawer-head-main">' +
      '<div class="drawer-chips"><span class="drawer-rank">#' + String(bank.rank).padStart(2, "0") + '</span>' +
      readinessBadge(bank.status) + confChip(bank.conf) + '</div>' +
      '<h2 class="drawer-name" id="drawer-title">' + esc(bank.name) + '</h2>' +
      '<div class="drawer-sub">' + esc(bank.domain) + ' · ' + esc(bank.hq) + '</div>' +
      '</div>' +
      '<div class="drawer-scorebox">' +
      '<div class="drawer-score" style="color:' + scoreColor(bank.score) + '">' + bank.score + '</div>' +
      '<div class="drawer-score-label">Score</div>' +
      '<button class="drawer-close" data-action="close-drawer" aria-label="Close">' + icon("x", 20) + '</button>' +
      '</div></div>' +
      '<div class="drawer-body">' +
      '<p class="drawer-summary">' + esc(isVendor ? vendorSummary(bank) : instSummary(bank)) + '</p>' +
      '<div class="drawer-h">At a glance</div>' +
      '<div class="sig-grid">' +
      firstTile +
      signalTile("route", "Public plan", roadmapShown, roadmapTone) +
      signalTile("users", "Industry groups", standards, standards === "—" ? "na" : "mid") +
      signalTile("server", "Technology", infra, "mid") +
      '</div>' +
      buildRatingBasis(bank) +
      researchNotes(bank) +
      (isVendor ? vendorQuestions(bank) : '') +
      '<div class="drawer-h">' + (isVendor ? "About the provider" : "About the institution") + '</div>' +
      profile + notes + news +
      '<div class="drawer-evidence"><strong>Evidence: ' + esc(bank.conf) + '.</strong> ' + evidence + '</div>' +
      '</div></div></div>';
  }

  var root = null;

  var returnFocus = null;

  window.openDrawer = function (bank) {
    root = root || document.getElementById("drawer-root");
    if (!root.innerHTML) returnFocus = document.activeElement;
    root.innerHTML = drawerHtml(bank);
    var close = root.querySelector(".drawer-close");
    if (close) close.focus();
  };

  window.closeDrawer = function () {
    root = root || document.getElementById("drawer-root");
    root.innerHTML = "";
    // Return focus to the row that opened the drawer (if it still exists).
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  };

  // Keep Tab cycling inside the open drawer.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !root || !root.innerHTML) return;
    var f = root.querySelectorAll('a[href], button, [tabindex="0"]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  window.isDrawerOpen = function () {
    root = root || document.getElementById("drawer-root");
    return root.innerHTML !== "";
  };
})();
