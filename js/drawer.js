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
