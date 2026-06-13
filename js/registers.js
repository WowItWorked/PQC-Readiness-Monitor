/* PQC Readiness Monitor — registers: Institutions (top 100 banks) and
   Third Parties (top 100 providers). Filter pills, category/type select,
   live search, click-through rows, and a View popover (density, score style,
   evidence column — the production translation of the prototype's Tweaks). */

(function () {
  var CATS = ["All", "G-SIB", "Super-regional", "Regional", "Custodian", "Card / consumer",
    "Brokerage", "Digital bank", "Foreign-owned", "Credit union"];

  function catMatch(b, cat) {
    if (cat === "All") return true;
    if (cat === "Regional") return b.cat.indexOf("Regional") === 0;
    if (cat === "Custodian") return b.cat.indexOf("Custodian") === 0;
    if (cat === "Card / consumer") return b.cat.indexOf("Card") === 0 || b.cat === "Consumer / insurance";
    return b.cat === cat || b.cat.indexOf(cat) === 0;
  }

  function statusPills(current, action) {
    return ["All"].concat(STATUS_ORDER).map(function (f) {
      return '<button class="pill-btn' + (current === f ? ' active' : '') +
        '" data-action="' + action + '" data-status="' + esc(f) + '">' + esc(f) + '</button>';
    }).join('');
  }

  function viewOpts(prefs, open) {
    function seg(name, options, current) {
      return '<div class="viewopts-seg">' + options.map(function (o) {
        return '<button data-action="set-pref" data-pref="' + name + '" data-value="' + o +
          '"' + (current === o ? ' class="active"' : '') + '>' + o + '</button>';
      }).join('') + '</div>';
    }
    return '<details class="viewopts"' + (open ? ' open' : '') + '>' +
      '<summary>' + icon("sliders-horizontal", 15) + 'View</summary>' +
      '<div class="viewopts-panel">' +
      '<div class="viewopts-row"><span class="viewopts-label">Density</span>' + seg("density", ["comfortable", "compact"], prefs.density) + '</div>' +
      '<div class="viewopts-row"><span class="viewopts-label">Score style</span>' + seg("scoreStyle", ["bar", "number"], prefs.scoreStyle) + '</div>' +
      '<label class="viewopts-toggle">Evidence column<input type="checkbox" data-action="toggle-evidence"' +
      (prefs.showConfidence ? ' checked' : '') + '></label>' +
      '</div></details>';
  }

  // Mobile card: one tappable card per row, replacing the wide desktop table.
  function scorePill(score) {
    return '<span class="reg-card-score" style="background:' + scoreColor(score) + '">' + score + '</span>';
  }
  function regCard(action, item, lines, chips) {
    return '<div class="reg-card" data-action="' + action + '" data-name="' + esc(item.name) + '">' +
      '<div class="reg-card-top">' +
      '<span class="reg-card-rank">' + String(item.rank).padStart(2, "0") + '</span>' +
      '<span class="reg-card-name">' + esc(item.name) + '</span>' +
      scorePill(item.score) + '</div>' +
      '<div class="reg-card-meta">' + lines + '</div>' +
      '<div class="reg-card-chips">' + chips + '</div></div>';
  }

  /* ---- Institutions register --------------------------------------------- */
  window.renderInstitutions = function (data, opts) {
    var q = (opts.query || "").trim().toLowerCase();
    var rows = data.filter(function (b) {
      return (opts.statusFilter === "All" || b.status === opts.statusFilter) &&
        catMatch(b, opts.cat) &&
        (!q || b.name.toLowerCase().indexOf(q) !== -1 || b.domain.indexOf(q) !== -1 ||
          b.hq.toLowerCase().indexOf(q) !== -1 || (b.ticker || "").toLowerCase() === q);
    });
    var showConf = opts.prefs.showConfidence;
    var scoreMode = opts.prefs.scoreStyle;
    var compact = opts.prefs.density === "compact";

    var catOptions = CATS.map(function (c) {
      return '<option value="' + esc(c) + '"' + (opts.cat === c ? ' selected' : '') + '>' +
        (c === "All" ? "All categories" : esc(c)) + '</option>';
    }).join('');

    var body = rows.map(function (b) {
      return '<tr data-action="open-inst" data-name="' + esc(b.name) + '">' +
        '<td class="cell-rank">' + String(b.rank).padStart(2, "0") + '</td>' +
        '<td><div class="cell-name">' + esc(b.name) + '</div>' +
        (!compact ? '<div class="cell-meta">' + esc(b.domain) + ' · ' + esc(b.hq) + '</div>' : '') + '</td>' +
        '<td class="cell-fig">' + fmtAssets(b.assets) + '</td>' +
        '<td class="cell-cat">' + esc(b.cat) + '</td>' +
        '<td>' + tlsChip(b.tls) + '</td>' +
        '<td>' + readinessBadge(b.status) + '</td>' +
        '<td>' + scoreCell(b.score, scoreMode) + '</td>' +
        (showConf ? '<td>' + confChip(b.conf) + '</td>' : '') +
        '</tr>';
    }).join('');
    if (!rows.length) {
      body = '<tr><td colspan="' + (showConf ? 8 : 7) + '" class="cell-empty">No institutions match. Boring, in the best way.</td></tr>';
    }

    var listing;
    if (opts.isMobile) {
      listing = rows.length
        ? '<div class="reg-cards">' + rows.map(function (b) {
            return regCard("open-inst", b,
              esc(b.domain) + ' · ' + esc(b.hq),
              readinessBadge(b.status) +
              '<span class="reg-tag">' + esc(b.cat) + '</span>' +
              '<span class="reg-tag mono">' + fmtAssets(b.assets) + '</span>' +
              tlsChip(b.tls) + (showConf ? confChip(b.conf) : ''));
          }).join('') + '</div>'
        : '<div class="feed-empty">No institutions match. Boring, in the best way.</div>';
    } else {
      listing = '<div class="table-card"><table class="register-table' + (compact ? ' compact' : '') + '">' +
        '<thead><tr><th style="width:56px">#</th><th>Institution</th><th class="num" style="width:120px">Assets</th>' +
        '<th style="width:130px">Category</th><th style="width:128px">Web TLS</th><th style="width:118px">Readiness</th>' +
        '<th style="width:' + (scoreMode === "bar" ? 112 : 64) + 'px">Score</th>' +
        (showConf ? '<th style="width:106px">Evidence</th>' : '') +
        '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    return '<div class="register">' +
      '<div class="register-toolbar">' + statusPills(opts.statusFilter, "inst-status") +
      '<span class="spacer"></span>' +
      '<select class="select-ctl" data-action="inst-cat">' + catOptions + '</select>' +
      '<span class="register-count">' + rows.length + ' of ' + data.length + '</span>' +
      viewOpts(opts.prefs, opts.voOpen) +
      '</div>' +
      listing +
      '<div class="register-footnote">Assets are approximate (Q1 2026). Rows marked <strong>Estimated</strong> are ' +
      'representative assessments pending a verification pass — see Methodology.</div>' +
      '</div>';
  };

  /* ---- Third Parties register --------------------------------------------- */
  window.renderVendors = function (data, opts) {
    var q = (opts.query || "").trim().toLowerCase();
    var types = ["All"].concat(Array.from(new Set(data.map(function (v) { return v.type; }))));
    var rows = data.filter(function (v) {
      return (opts.statusFilter === "All" || v.status === opts.statusFilter) &&
        (opts.type === "All" || v.type === opts.type) &&
        (!q || v.name.toLowerCase().indexOf(q) !== -1 || v.domain.indexOf(q) !== -1 ||
          v.type.toLowerCase().indexOf(q) !== -1);
    });
    var showConf = opts.prefs.showConfidence;
    var scoreMode = opts.prefs.scoreStyle;
    var compact = opts.prefs.density === "compact";

    var typeOptions = types.map(function (c) {
      return '<option value="' + esc(c) + '"' + (opts.type === c ? ' selected' : '') + '>' +
        (c === "All" ? "All provider types" : esc(c)) + '</option>';
    }).join('');

    var body = rows.map(function (v) {
      return '<tr data-action="open-vendor" data-name="' + esc(v.name) + '">' +
        '<td class="cell-rank">' + String(v.rank).padStart(2, "0") + '</td>' +
        '<td><div class="cell-name">' + esc(v.name) + '</div>' +
        (!compact ? '<div class="cell-meta">' + esc(v.domain) + ' · ' + esc(v.hq) + '</div>' : '') + '</td>' +
        '<td class="cell-cat">' + esc(v.type) + '</td>' +
        '<td class="cell-fig">' + fmtRev(v.rev) + '</td>' +
        '<td>' + pqcChip(v.pqc) + '</td>' +
        '<td>' + readinessBadge(v.status) + '</td>' +
        '<td>' + scoreCell(v.score, scoreMode) + '</td>' +
        (showConf ? '<td>' + confChip(v.conf) + '</td>' : '') +
        '</tr>';
    }).join('');
    if (!rows.length) {
      body = '<tr><td colspan="' + (showConf ? 8 : 7) + '" class="cell-empty">No providers match. Boring, in the best way.</td></tr>';
    }

    var listing;
    if (opts.isMobile) {
      listing = rows.length
        ? '<div class="reg-cards">' + rows.map(function (v) {
            return regCard("open-vendor", v,
              esc(v.domain) + ' · ' + esc(v.hq),
              readinessBadge(v.status) +
              '<span class="reg-tag">' + esc(v.type) + '</span>' +
              '<span class="reg-tag mono">' + fmtRev(v.rev) + '</span>' +
              pqcChip(v.pqc) + (showConf ? confChip(v.conf) : ''));
          }).join('') + '</div>'
        : '<div class="feed-empty">No providers match. Boring, in the best way.</div>';
    } else {
      listing = '<div class="table-card"><table class="register-table' + (compact ? ' compact' : '') + '">' +
        '<thead><tr><th style="width:56px">#</th><th>Provider</th><th style="width:160px">Type</th>' +
        '<th class="num" style="width:104px">Revenue</th><th style="width:140px">Product PQC</th>' +
        '<th style="width:118px">Readiness</th>' +
        '<th style="width:' + (scoreMode === "bar" ? 112 : 64) + 'px">Score</th>' +
        (showConf ? '<th style="width:106px">Evidence</th>' : '') +
        '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    return '<div class="register">' +
      '<div class="register-toolbar">' + statusPills(opts.statusFilter, "vendor-status") +
      '<span class="spacer"></span>' +
      '<select class="select-ctl" data-action="vendor-type">' + typeOptions + '</select>' +
      '<span class="register-count">' + rows.length + ' of ' + data.length + '</span>' +
      viewOpts(opts.prefs, opts.voOpen) +
      '</div>' +
      listing +
      '<div class="register-footnote">Revenue is approximate annual revenue, company-wide unless a segment is the ' +
      'relevant unit. Readiness here means PQC support in the products and services financial institutions consume.</div>' +
      '</div>';
  };
})();
