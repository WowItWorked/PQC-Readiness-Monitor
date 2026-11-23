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
    live:    { label: "Hybrid live", c: "var(--success)", icon: "shield-check" },
    partial: { label: "Capable", c: "var(--info)", icon: "shield-half" },
    none:    { label: "Classical", c: "var(--danger)", icon: "shield-x" },
    unknown: { label: "Not assessed", c: "var(--fg-3)", icon: "shield-question" },
  };
  function tlsChip(tls) {
    var m = TLS_META[tls] || TLS_META.unknown;
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:' +
      m.c + ';white-space:nowrap">' + icon(m.icon, 15, m.c) + m.label + '</span>';
  }

  var PQC_META = {
    shipping: { label: "Shipping PQC", c: "var(--success)", icon: "package-check" },
    roadmap:  { label: "Public roadmap", c: "var(--info)", icon: "route" },
    research: { label: "Research only", c: "var(--warning)", icon: "flask-conical" },
    none:     { label: "None public", c: "var(--fg-3)", icon: "circle-dashed" },
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
    if (b.summary) return b.summary;
    var tlsTxt = {
      live: "Its primary website already negotiates hybrid post-quantum key exchange via its edge provider.",
      partial: "Its edge infrastructure supports hybrid post-quantum key exchange, though site-wide enablement has not been observed.",
      none: "Its public endpoints currently negotiate classical key exchange only.",
      unknown: "Its public TLS posture has not yet been assessed in this snapshot.",
    }[b.tls];
    var statusTxt = {
      "Advanced": "Public evidence indicates a mature, active quantum-safe program.",
      "In progress": "Public signals indicate active planning or early migration work.",
      "Early stage": "Limited public signals suggest awareness-stage activity, largely via sector bodies and infrastructure choices.",
      "Not evident": "No public post-quantum activity is evident; readiness will likely follow core and digital-banking vendor timelines.",
    }[b.status];
    return statusTxt + " " + tlsTxt + (b.note ? " " + b.note : "");
  }

  // Auto-summary for vendor records.
  function vendorSummary(v) {
    var pqcTxt = {
      shipping: "Post-quantum cryptography is available in products or services banks consume today.",
      roadmap: "A public migration plan exists, but PQC is not yet broadly shipping in its financial-sector products.",
      research: "Public activity is limited to research, pilots, or thought leadership — no product PQC timeline yet.",
      none: "No public post-quantum activity is evident; client institutions should raise PQC support in vendor due-diligence and renewals.",
    }[v.pqc];
    return v.note || pqcTxt;
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
  function fmtIso(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || "");
    return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : "";
  }
  function pqcFreshness() {
    var n = window.PQC_NEWS || {};
    return {
      tls: fmtIso((window.PQC_TLS || {}).scannedAt) || n.asOf || "—",
      ratings: n.ratingsReviewed || "—",
      intel: n.intelReviewed || "—",
    };
  }

  var BANNER_KEY = "pqc-banner-dismissed";
  function bannerDismissed() { try { return localStorage.getItem(BANNER_KEY) === "1"; } catch (e) { return false; } }
  function prototypeBanner() {
    if (bannerDismissed()) return '';
    return '<div class="proto-banner" role="note">' + icon("info", 15) +
      '<span><b>Prototype for demonstration.</b> Content has not been fully vetted and should not be relied on for decisions.</span>' +
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
