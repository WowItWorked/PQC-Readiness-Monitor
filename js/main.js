/* PQC Readiness Monitor — shell, router, and event wiring. */

(function () {
  var PREFS_KEY = "pqc-monitor-prefs";

  function loadPrefs() {
    var defaults = { density: "comfortable", scoreStyle: "bar", showConfidence: true };
    try {
      var saved = JSON.parse(localStorage.getItem(PREFS_KEY));
      return Object.assign(defaults, saved || {});
    } catch (e) { return defaults; }
  }

  var state = {
    active: "overview",
    query: "",
    statusFilter: "All",
    instCat: "All",
    vendorStatusFilter: "All",
    vendorType: "All",
    viewoptsOpen: false,
    isMobile: false, // set by detectDevice() before first render
    intel: {
      standards:  { sort: "newest", q: "", page: 1 },
      guidance:   { sort: "newest", q: "", page: 1 },
      sector:     { sort: "newest", q: "", page: 1 },
      vendornews: { sort: "newest", q: "", page: 1 },
    },
    trends: { cohort: "inst", entity: null },
    prefs: loadPrefs(),
  };

  // Device recognition: the dashboard presents the full desktop application on
  // larger screens and a mobile-optimized view on phones/small tablets. Width
  // is the primary signal; a coarse pointer (touch) nudges borderline devices
  // toward the mobile view. Re-evaluated on resize and orientation change.
  var MOBILE_MQ = window.matchMedia("(max-width: 860px)");
  var COARSE_MQ = window.matchMedia("(pointer: coarse)");
  function computeIsMobile() {
    return MOBILE_MQ.matches || (COARSE_MQ.matches && window.innerWidth <= 1024);
  }
  function detectDevice() {
    state.isMobile = computeIsMobile();
    var app = document.querySelector(".app");
    if (app) {
      app.classList.toggle("is-mobile", state.isMobile);
      app.classList.toggle("is-desktop", !state.isMobile);
    }
  }

  var VIEWS = {
    overview:     { title: "PQC Readiness Overview", crumb: "Monitor" },
    institutions: { title: "Top 100 Institutions", crumb: "Monitor" },
    vendors:      { title: "Top 100 Third Parties", crumb: "Monitor" },
    standards:    { title: "Standards & Policy", crumb: "Intelligence" },
    guidance:     { title: "Implementation Guidance", crumb: "Intelligence" },
    sector:       { title: "Financial Sector News", crumb: "Intelligence" },
    vendornews:   { title: "Third-Party News", crumb: "Intelligence" },
    trends:       { title: "Readiness Trends", crumb: "Monitor" },
    methodology:  { title: "Methodology", crumb: "Reference" },
  };

  var NAV_GROUPS = [
    { label: "Monitor", items: [
      ["overview", "Overview", "layout-dashboard"],
      ["institutions", "Institutions", "landmark"],
      ["vendors", "Third Parties", "boxes"],
      ["trends", "Readiness Trends", "trending-up"],
    ]},
    { label: "Intelligence", items: [
      ["standards", "Standards & Policy", "scale"],
      ["guidance", "Implementation Guidance", "map"],
      ["sector", "Sector News", "newspaper"],
      ["vendornews", "Third-Party News", "rss"],
    ]},
    { label: "Reference", items: [
      ["methodology", "Methodology", "book-open"],
    ]},
  ];

  /* ---- Shell -------------------------------------------------------------- */
  function navHtml() {
    return NAV_GROUPS.map(function (g) {
      return '<div class="nav-group"><div class="nav-group-label">' + esc(g.label) + '</div>' +
        g.items.map(function (it) {
          var on = state.active === it[0];
          return '<a class="nav-item' + (on ? ' active' : '') + '" data-view="' + it[0] + '">' +
            icon(it[2], 18) + esc(it[1]) + '</a>';
        }).join('') + '</div>';
    }).join('');
  }

  function shellHtml() {
    return '<div class="app">' +
      '<aside class="sidebar">' +
      '<div class="sidebar-head"><span class="logo">' +
      '<span class="logo-roundel"><span></span></span>' +
      '<span class="logo-text"><span>Financial Sector</span><span>PQC Readiness</span></span>' +
      '</span></div>' +
      '<nav class="sidebar-nav" id="nav"></nav>' +
      '<div class="sidebar-foot">Snapshot compiled ' + esc(window.PQC_NEWS.asOf) +
      '. Assessments from public signals — see Methodology.</div>' +
      '</aside>' +
      '<div class="main-col">' +
      '<header class="topbar">' +
      '<button class="nav-toggle" data-action="toggle-nav" aria-label="Open menu">' + icon("menu", 20) + '</button>' +
      '<div class="topbar-titles"><div class="topbar-crumb" id="crumb"></div>' +
      '<div class="topbar-title" id="title"></div></div>' +
      '<span class="asof-chip">' + icon("calendar", 14, "var(--fg-3)") + 'Data as of ' + esc(window.PQC_NEWS.asOf) + '</span>' +
      '<div class="search-wrap">' + icon("search", 17) +
      '<input class="search-input" id="global-search" placeholder="Search institutions…"></div>' +
      '</header>' +
      '<main class="main-scroll" id="main"></main>' +
      '</div>' +
      '<div class="nav-backdrop" data-action="close-nav"></div>' +
      '</div>';
  }

  function renderChrome() {
    document.getElementById("nav").innerHTML = navHtml();
    var v = VIEWS[state.active];
    document.getElementById("crumb").textContent = v.crumb;
    document.getElementById("title").textContent = v.title;
    var main = document.querySelector(".main-col");
    if (main) main.setAttribute("data-screen-label", v.title);
  }

  function renderMain() {
    var main = document.getElementById("main");
    var data = window.INSTITUTIONS;
    var vendorData = window.VENDORS;
    switch (state.active) {
      case "overview": main.innerHTML = renderOverview(data); break;
      case "institutions": main.innerHTML = renderInstitutions(data, {
        query: state.query, statusFilter: state.statusFilter, cat: state.instCat,
        prefs: state.prefs, voOpen: state.viewoptsOpen, isMobile: state.isMobile }); break;
      case "vendors": main.innerHTML = renderVendors(vendorData, {
        query: state.query, statusFilter: state.vendorStatusFilter, type: state.vendorType,
        prefs: state.prefs, voOpen: state.viewoptsOpen, isMobile: state.isMobile }); break;
      case "standards":
      case "guidance":
      case "sector":
      case "vendornews":
        main.innerHTML = renderIntelSection(state.active, state.intel[state.active]);
        break;
      case "trends": main.innerHTML = renderTrends(state.trends); break;
      case "methodology": main.innerHTML = renderMethodology(); break;
    }
    main.scrollTop = 0;
  }

  function setNav(open) {
    var app = document.querySelector(".app");
    if (app) app.classList.toggle("nav-open", open);
  }

  function navigate(view) {
    state.active = view;
    state.viewoptsOpen = false;
    setNav(false); // close the mobile menu after choosing a destination
    renderChrome();
    renderMain();
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs)); } catch (e) { /* private mode */ }
  }

  function findInst(name) {
    return window.INSTITUTIONS.find(function (b) { return b.name === name; });
  }
  function findVendor(name) {
    return window.VENDORS.find(function (v) { return v.name === name; });
  }

  /* ---- Events ------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var nav = e.target.closest("[data-view]");
    if (nav) { navigate(nav.getAttribute("data-view")); return; }

    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");

    switch (action) {
      case "toggle-nav":
        setNav(!document.querySelector(".app").classList.contains("nav-open"));
        break;
      case "close-nav":
        setNav(false);
        break;
      case "pick-status":
        state.statusFilter = el.getAttribute("data-status");
        navigate("institutions");
        break;
      case "inst-status":
        state.statusFilter = el.getAttribute("data-status");
        renderMain();
        break;
      case "vendor-status":
        state.vendorStatusFilter = el.getAttribute("data-status");
        renderMain();
        break;
      case "open-inst": {
        var b = findInst(el.getAttribute("data-name"));
        if (b) openDrawer(b);
        break;
      }
      case "open-vendor": {
        var v = findVendor(el.getAttribute("data-name"));
        if (v) openDrawer(v);
        break;
      }
      case "close-drawer":
        // Overlay closes only on a direct backdrop click; the × always closes.
        if (el.classList.contains("drawer-overlay") && e.target.closest(".drawer-panel")) return;
        closeDrawer();
        break;
      case "trends-cohort":
        state.trends.cohort = el.getAttribute("data-cohort");
        renderMain();
        break;
      case "intel-page": {
        var psec = el.getAttribute("data-section");
        state.intel[psec].page = parseInt(el.getAttribute("data-page"), 10) || 1;
        updateIntelList(psec);
        var listEl = document.getElementById("intel-list");
        if (listEl) listEl.scrollIntoView({ block: "start", behavior: "smooth" });
        break;
      }
      case "intel-refresh": {
        var sec = el.getAttribute("data-section");
        refreshFeeds(sec, updateIntelView);
        updateIntelStatus(sec); // show the "checking…" status immediately
        el.disabled = true;
        break;
      }
      case "set-pref":
        state.prefs[el.getAttribute("data-pref")] = el.getAttribute("data-value");
        state.viewoptsOpen = true;
        savePrefs();
        renderMain();
        break;
    }
  });

  document.addEventListener("change", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    switch (el.getAttribute("data-action")) {
      case "inst-cat":
        state.instCat = el.value;
        renderMain();
        break;
      case "vendor-type":
        state.vendorType = el.value;
        renderMain();
        break;
      case "trends-entity":
        state.trends.entity = el.value;
        renderMain();
        break;
      case "intel-sort": {
        var sec = el.getAttribute("data-section");
        state.intel[sec].sort = el.value;
        state.intel[sec].page = 1; // re-sorting returns to the first page
        updateIntelList(sec);
        break;
      }
      case "toggle-evidence":
        state.prefs.showConfidence = el.checked;
        state.viewoptsOpen = true;
        savePrefs();
        renderMain();
        break;
    }
  });

  // Keep the View popover's open state across re-renders ('toggle' doesn't bubble — capture it).
  document.addEventListener("toggle", function (e) {
    if (e.target.classList && e.target.classList.contains("viewopts")) {
      state.viewoptsOpen = e.target.open;
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isDrawerOpen()) closeDrawer();
  });

  // Live filtering as the reader types in a feed's search box.
  document.addEventListener("input", function (e) {
    var el = e.target.closest('[data-action="intel-search"]');
    if (!el) return;
    var sec = el.getAttribute("data-section");
    state.intel[sec].q = el.value;
    state.intel[sec].page = 1; // filtering returns to the first page
    updateIntelList(sec);
  });

  // Partial updates so feed refresh and typing never steal focus or scroll.
  function updateIntelList(sec) {
    if (state.active !== sec) return;
    var list = document.getElementById("intel-list");
    if (list) list.innerHTML = renderIntelList(sec, state.intel[sec]);
  }
  function updateIntelStatus(sec) {
    if (state.active !== sec) return;
    var status = document.getElementById("feed-status");
    if (!status) return;
    status.textContent = intelStatusText(sec);
    status.className = "feed-status" + (window.FEEDS[sec].status === "loading" ? " loading" : "");
    var btn = document.querySelector('[data-action="intel-refresh"]');
    if (btn) btn.disabled = window.FEEDS[sec].status === "loading";
  }
  function updateIntelView(sec) {
    var main = document.getElementById("main");
    var y = main.scrollTop;
    updateIntelStatus(sec);
    updateIntelList(sec);
    main.scrollTop = y;
  }

  /* ---- Boot ---------------------------------------------------------------- */
  document.getElementById("app").innerHTML = shellHtml();
  detectDevice();
  renderChrome();
  renderMain();

  // Re-evaluate the device class on viewport/orientation change and re-render
  // when crossing the desktop/mobile boundary so the layout swaps cleanly.
  function onViewportChange() {
    var was = state.isMobile;
    detectDevice();
    if (state.isMobile !== was) {
      setNav(false);
      renderMain();
    }
  }
  if (MOBILE_MQ.addEventListener) {
    MOBILE_MQ.addEventListener("change", onViewportChange);
    COARSE_MQ.addEventListener("change", onViewportChange);
  } else if (MOBILE_MQ.addListener) {
    MOBILE_MQ.addListener(onViewportChange); // older Safari
    COARSE_MQ.addListener(onViewportChange);
  }
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("orientationchange", onViewportChange);

  // Check every intelligence section's trusted live sources on page load.
  refreshAllFeeds(updateIntelView);

  document.getElementById("global-search").addEventListener("input", function (e) {
    state.query = e.target.value;
    if (state.query && state.active !== "institutions" && state.active !== "vendors") {
      navigate("institutions");
    } else {
      renderMain();
    }
  });
})();
