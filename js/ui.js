/* PQC Readiness Monitor — shared UI primitives: domain chips, cards, summaries,
   formatters. Ported 1:1 from the design's shell so every view renders the same
   statuses, colors, and copy. */

(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
      (solid ? "var(--pnc-navy)" : "var(--fg-3)") + ';border:1px ' +
      (conf === "Estimated" ? "dashed" : "solid") + ' ' +
      (solid ? "var(--pnc-navy)" : "var(--line-2)") +
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

  Object.assign(window, {
    esc: esc, READINESS: READINESS, STATUS_ORDER: STATUS_ORDER,
    readinessBadge: readinessBadge, TLS_META: TLS_META, tlsChip: tlsChip,
    PQC_META: PQC_META, pqcChip: pqcChip, confChip: confChip,
    scoreColor: scoreColor, scoreCell: scoreCell, card: card,
    fmtAssets: fmtAssets, fmtRev: fmtRev,
    instSummary: instSummary, vendorSummary: vendorSummary,
  });
})();
