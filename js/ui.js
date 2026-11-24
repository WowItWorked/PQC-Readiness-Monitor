/* PQC Readiness Monitor — shared UI primitives: domain chips, cards, summaries,
   formatters. Ported 1:1 from the design's shell so every view renders the same
   statuses, colors, and copy. */

(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Working-link resolver for news/article items. Prefers an explicit verified
  // url; else maps a recognized source to its official section; else falls back
  // to a search for the exact headline (always resolves to the source). Every
  // article therefore has a working hyperlink.
  var NEWS_SOURCE = {
    "AWS Security Blog": "https://aws.amazon.com/blogs/security/",
    "AWS": "https://aws.amazon.com/security/post-quantum-cryptography/",
    "Microsoft Security": "https://www.microsoft.com/en-us/security/blog/",
    "Microsoft": "https://www.microsoft.com/en-us/security/blog/",
    "Google Security": "https://cloud.google.com/blog/products/identity-security",
    "Google Quantum AI": "https://quantumai.google/",
    "Google": "https://cloud.google.com/security/resources/post-quantum-cryptography",
    "IBM": "https://www.ibm.com/quantum/blog",
    "Cloudflare": "https://blog.cloudflare.com/tag/post-quantum/",
    "Cloudflare Radar": "https://blog.cloudflare.com/tag/post-quantum/",
    "Akamai": "https://www.akamai.com/blog",
    "Thales": "https://cpl.thalesgroup.com/encryption/post-quantum-crypto-agility",
    "DigiCert": "https://www.digicert.com/tls-ssl/post-quantum-cryptography",
    "DTCC": "https://www.dtcc.com/news",
    "Mastercard": "https://www.mastercard.com/news/",
    "BIS / Swift": "https://www.bis.org/about/bisih/topics/cyber_security/leap.htm",
    "BIS / Finextra": "https://www.bis.org/about/bisih/topics/cyber_security/leap.htm",
    "weforum.org": "https://www.weforum.org/publications/",
    "The Quantum Insider": "https://thequantuminsider.com/",
    "NIST": "https://csrc.nist.gov/projects/post-quantum-cryptography",
    "NIST CSRC": "https://csrc.nist.gov/projects/post-quantum-cryptography",
    "SandboxAQ": "https://www.sandboxaq.com/",
  };
  function newsUrl(item) {
    // Only http(s) links are ever rendered — a feed field like "javascript:…"
    // would otherwise become a clickable script URL.
    if (item && item.url && /^https?:\/\//i.test(item.url)) return item.url;
    var s = item && item.s ? String(item.s) : "";
    if (NEWS_SOURCE[s]) return NEWS_SOURCE[s];
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return "https://" + s; // domain-style source
    var q = ((item && (item.t || item.title)) || "") + (s ? " " + s : "");
    return "https://duckduckgo.com/?q=" + encodeURIComponent(q.trim());
  }

  var READINESS = {
    "Advanced":    { c: "var(--success)", bg: "var(--success-bg)", line: "var(--success-line)" },
    "In progress": { c: "var(--info)", bg: "var(--info-bg)", line: "var(--info-line)" },
    "Early stage": { c: "var(--warning)", bg: "var(--warning-bg)", line: "var(--warning-line)" },
    "Not evident": { c: "var(--danger)", bg: "var(--danger-bg)", line: "var(--danger-line)" },
  };
  var STATUS_ORDER = ["Advanced", "In progress", "Early stage", "Not evident"];

  function readinessBadge(status) {
    var s = READINESS[status] || READINESS["Early stage"];
    return '<span style="font-size:12px;font-weight:600;color:' + s.c + ';background:' + s.bg +
      ';border:1px solid ' + s.line + ';padding:2px 9px;border-radius:var(--radius-pill);white-space:nowrap">' +
      esc(status) + '</span>';
  }

  var TLS_META = {
    live:    { label: "Quantum-safe", c: "var(--success)", icon: "shield-check" },
    partial: { label: "Ready, not on", c: "var(--info)", icon: "shield-half" },
    none:    { label: "Not yet", c: "var(--danger)", icon: "shield-x" },
    unknown: { label: "Not checked", c: "var(--fg-3)", icon: "shield-question" },
  };
  function tlsChip(tls) {
    var m = TLS_META[tls] || TLS_META.unknown;
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:' +
      m.c + ';white-space:nowrap">' + icon(m.icon, 15, m.c) + m.label + '</span>';
  }

  var PQC_META = {
    shipping: { label: "Available now", c: "var(--success)", icon: "package-check" },
    roadmap:  { label: "Plan published", c: "var(--info)", icon: "route" },
    research: { label: "Research only", c: "var(--warning)", icon: "flask-conical" },
    none:     { label: "No public plan", c: "var(--fg-3)", icon: "circle-dashed" },
  };
  function pqcChip(pqc) {
    var m = PQC_META[pqc] || PQC_META.none;
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:' +
      m.c + ';white-space:nowrap">' + icon(m.icon, 15, m.c) + m.label + '</span>';
  }

  function confChip(conf) {
    var solid = conf === "Documented";
    return '<span style="font-size:11px;font-weight:600;color:' +
      (solid ? "var(--brand-ink)" : "var(--fg-3)") + ';border:1px ' +
      (conf === "Estimated" ? "dashed" : "solid") + ' ' +
      (solid ? "var(--brand-ink)" : "var(--line-2)") +
      ';padding:1px 8px;border-radius:var(--radius-pill);white-space:nowrap">' + esc(conf) + '</span>';
  }

  function scoreColor(score) {
    return score >= 70 ? "var(--success)" : score >= 45 ? "var(--info)"
      : score >= 25 ? "var(--warning)" : "var(--danger)";
  }

  function scoreCell(score, mode) {
    mode = mode || "bar";
    var bar = mode === "bar"
      ? '<span style="width:52px;height:5px;border-radius:3px;background:var(--gray-100);overflow:hidden;display:inline-block">' +
        '<span style="display:block;width:' + score + '%;height:100%;border-radius:3px;background:' + scoreColor(score) + '"></span></span>'
      : '';
    return '<span style="display:inline-flex;align-items:center;gap:8px">' +
      '<span style="font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--fg-1);width:24px;text-align:right">' +
      score + '</span>' + bar + '</span>';
  }

  // card({title, sub, pad, style}, innerHtml)
  function card(opts, inner) {
    opts = opts || {};
    var pad = opts.pad != null ? opts.pad : "20px";
    var head = "";
    if (opts.title) {
      head += '<div class="card-title" style="margin-bottom:' + (opts.sub ? "2px" : "14px") + '">' + esc(opts.title) + '</div>';
    }
    if (opts.sub) head += '<div class="card-sub">' + esc(opts.sub) + '</div>';
    return '<div class="card" style="padding:' + pad + (opts.style ? ';' + opts.style : '') + '">' + head + inner + '</div>';
  }

  function fmtAssets(a) {
    return a >= 1000 ? "$" + (a / 1000).toFixed(2).replace(/0$/, "") + "T" : "$" + Math.round(a) + "B";
  }

  function fmtRev(r) {
    return r >= 1 ? "$" + (r % 1 ? r.toFixed(1) : r) + "B" : "$" + Math.round(r * 1000) + "M";
  }

  // Auto-summary for compact institution records.
  function instSummary(b) {
    var tlsTxt = {
      live: "Its main website already uses quantum-safe encryption, typically provided through its hosting or cloud provider.",
      partial: "Its hosting provider supports quantum-safe encryption, but it has not yet been switched on across the website.",
      none: "Its main website does not yet use quantum-safe encryption.",
      unknown: "Its website has not yet been checked.",
    }[b.tls];
    var statusTxt = {
      "Advanced": "Public evidence shows a well-established program to prepare for quantum-safe security.",
      "In progress": "Public evidence shows active planning or early upgrade work.",
      "Early stage": "There is limited public evidence — mostly industry-group membership and technology choices rather than a stated plan.",
      "Not evident": "We found no public evidence of preparation. Its timing will likely depend on its main technology providers.",
    }[b.status];
    return statusTxt + " " + tlsTxt;
  }

  // Auto-summary for vendor records.
  function vendorSummary(v) {
    var pqcTxt = {
      shipping: "Quantum-safe protection is already available in products or services financial institutions use today.",
      roadmap: "The provider has published an upgrade plan, but quantum-safe protection is not yet widely available in the products banks use.",
      research: "Public activity is limited to research or pilots — there is no product timeline yet.",
      none: "We found no public plan. Clients should ask about quantum-safe support in due diligence and contract renewals.",
    }[v.pqc];
    return pqcTxt;
  }

  function logoMark() {
    return '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">' +
      '<path d="M16 2 28.1 9v14L16 30 3.9 23V9Z" fill="var(--brand-accent)"/>' +
      '<g stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.9">' +
      '<path d="M10 12.5h12M8.5 19.5h15M10 12.5l-1.5 7M16 12.5l-1.5 7M22 12.5l1.5 7"/></g>' +
      '<g fill="#fff"><circle cx="10" cy="12.5" r="1.9"/><circle cx="16" cy="12.5" r="1.9"/><circle cx="22" cy="12.5" r="1.9"/>' +
      '<circle cx="8.5" cy="19.5" r="1.9"/><circle cx="14.5" cy="19.5" r="1.9"/><circle cx="23.5" cy="19.5" r="1.9"/></g></svg>';
  }

  // How current each input is. The TLS scan runs daily; curated ratings and the
  // standards/guidance baseline change only on a research pass — never conflate them.
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function fmtIso(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || "");
    return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : "";
  }
  function pqcFreshness() {
    var n = window.PQC_NEWS || {};
    // Ratings date = the most recent research pass recorded on the data itself.
    var latest = "";
    (window.INSTITUTIONS || []).concat(window.VENDORS || []).forEach(function (e) {
      if (e.researched && e.researched > latest) latest = e.researched;
    });
    var researched = latest ? MONTH_NAMES[+latest.slice(5, 7) - 1] + " " + latest.slice(0, 4) : "";
    return {
      tls: fmtIso((window.PQC_TLS || {}).scannedAt) || n.asOf || "—",
      ratings: researched || n.ratingsReviewed || "—",
      intel: n.intelReviewed || "—",
    };
  }

  var BANNER_KEY = "pqc-banner-dismissed";
  function bannerDismissed() { try { return localStorage.getItem(BANNER_KEY) === "1"; } catch (e) { return false; } }
  function prototypeBanner() {
    if (bannerDismissed()) return '';
    return '<div class="proto-banner" role="note">' + icon("info", 15) +
      '<span><b>Prototype for demonstration.</b> This information has not been fully verified and should not be the basis for decisions.</span>' +
      '<button class="proto-dismiss" data-action="dismiss-banner" aria-label="Dismiss notice">' + icon("x", 15) + '</button></div>';
  }
  function dismissBanner() {
    try { localStorage.setItem(BANNER_KEY, "1"); } catch (e) { /* private mode */ }
    document.querySelectorAll(".proto-banner").forEach(function (el) { el.remove(); });
  }

  Object.assign(window, {
    logoMark: logoMark, pqcFreshness: pqcFreshness, fmtIso: fmtIso,
    prototypeBanner: prototypeBanner, dismissBanner: dismissBanner,
    esc: esc, READINESS: READINESS, STATUS_ORDER: STATUS_ORDER,
    readinessBadge: readinessBadge, TLS_META: TLS_META, tlsChip: tlsChip,
    PQC_META: PQC_META, pqcChip: pqcChip, confChip: confChip,
    scoreColor: scoreColor, scoreCell: scoreCell, card: card,
    fmtAssets: fmtAssets, fmtRev: fmtRev,
    instSummary: instSummary, vendorSummary: vendorSummary,
    newsUrl: newsUrl,
  });
})();
