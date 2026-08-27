/**
 * BetterSide — site patch layer.
 *
 * Nothing in the original build is modified on disk. This one script is loaded from
 * index.html and, once the original React app has painted, it:
 *
 *   1. fixes the clipped "Ten projects, one standard." heading in the Work section
 *   2. swaps the old `section#services` for the new 5-service interactive section
 *   3. turns the lead Work visual into a looping video
 *   4. turns every "Start a project" CTA into an enquiry-form modal (emails the studio)
 *   5. replaces the middle of /studio with the determination + passion content
 *   6. adds About and Blog links to the header nav
 *
 * All new UI is rendered inside iframes served from ./services-section/ so the new
 * stylesheet can never leak into the original design, or the other way round.
 */
(function () {
  "use strict";

  var EMBED_BASE = "./services-section/";
  /** Bumped on every rebuild so browsers can never serve a stale embed from cache. */
  var BUILD = "20260827m";
  var MAX_WAIT_MS = 15000;
  /** Copy for the split lead block under the hero. Edit these three strings only. */
  var LEAD_COPY = {
    desc:
      "Cosmos Quensel a condo project in Canada, Kitchenr by Xeros Builders. This is a sales tool that help that help Xeros Builder to showcase their project aroundthe world, give access to viewrs to explore each appartments, bedroom, kitchen, loction and balcony view from their comfortable place.",
    cta: "EXPLORE PROJECT",
    href: "https://www.cosmosquesnel.ca/"
  };

  /**
   * What opens when a capability card in the services section is clicked.
   * Keys are matched against the card heading, lowercased. Only the services
   * listed here become clickable; the rest behave exactly as before.
   * Edit the labels, urls and video file names here — nothing else.
   */
  var SERVICE_DETAIL = {
    "sales experience": {
      lead: "Live sales experiences",
      kind: "links",
      items: [
        { label: "MDB The Lutyens", url: "https://www.mdbthelutyens.in" },
        { label: "CM Infinia Immersive", url: "https://www.cminfiniaimmersive.com" },
        { label: "Ananta Street", url: "https://bettersideserver-cpu.github.io/AnantaStreet/" }
      ]
    },
    "3d animations": {
      lead: "Walkthroughs",
      kind: "videos",
      items: [
        { label: "Walkthrough 01", file: "videos/walkthrough-01.mp4" },
        { label: "Walkthrough 02", file: "videos/walkthrough-02.mp4" }
      ]
    },
    "3d interactive websites": {
      lead: "Live interactive website",
      kind: "links",
      items: [{ label: "Gill Comer Aqui", url: "https://gillcomeraqui.com/" }]
    }
  };
  /** How many viewport heights of scrolling the pinned services section consumes. */
  var PIN_VH = 3.2;
  var PIN_MIN_WIDTH = 768;

  var started = Date.now();

  /**
   * Static hosts (and VS Code Live Server) can only serve /studio as a folder,
   * i.e. /studio/index.html. Their router only matches "/studio", so drop the
   * trailing slash before their app boots. This script is the first deferred
   * script in the document, so it always runs first.
   */
  (function normaliseStudioPath() {
    var path = window.location.pathname;
    if (/\/studio\/$/.test(path) || /\/studio\/index\.html$/.test(path)) {
      var clean = path.replace(/\/studio\/(index\.html)?$/, "/studio");
      try {
        window.history.replaceState(null, "", clean + window.location.hash);
      } catch (e) {
        /* ignore */
      }
    }
  })();

  /**
   * /studio is only a client-side route of their build — no file exists for it,
   * so a plain static host 404s on a real request. The About and Blog pages
   * therefore link to the root document with ?bs=studio, and we hand the route
   * to their router here, before it boots.
   */
  (function enterStudio() {
    if (window.__BS_PAGE__) return;
    if (!/[?&]bs=studio(&|$)/.test(window.location.search)) return;
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    var target = path.replace(/\/$/, "") + "/studio";
    try {
      window.history.replaceState(null, "", target);
    } catch (e) {
      /* ignore */
    }
  })();

  /** Resolve embed/asset URLs against the site root, so /studio and /about/ work too. */
  function base() {
    var el = document.querySelector('script[src*="services-section/inject.js"]');
    if (el) {
      var src = el.getAttribute("src") || "";
      return src.replace(/services-section\/inject\.js.*$/, "");
    }
    return "./";
  }
  var ROOT = base();
  var EMBED = ROOT + "services-section/";

  /* ------------------------------------------------------------------ styles */

  /**
   * One theme switch for the whole site. The original bundle and the embed
   * bundle ship two completely different controls (a boxy DK/LT box vs. a plain
   * "DK / LT" text row) but both expose aria-label="Switch to …", so that is the
   * selector. The two apps also name their colour tokens differently, hence the
   * var(--a, var(--b)) fallbacks.
   */
  var TOGGLE_CSS = [
    /* the track */
    'button[aria-label^="Switch to"]{position:relative!important;display:inline-flex!important;align-items:stretch!important;justify-content:flex-start!important;box-sizing:border-box!important;width:5.25rem!important;height:1.875rem!important;padding:.1875rem!important;gap:0!important;border-radius:999px!important;border:1px solid var(--hair,rgba(255,255,255,.16))!important;background:var(--ink-2,var(--ink-raise,rgba(255,255,255,.05)))!important;overflow:hidden!important;cursor:pointer!important;transition:border-color .25s ease,background .25s ease!important;opacity:1!important;visibility:visible!important;-webkit-tap-highlight-color:transparent}',
    'button[aria-label^="Switch to"]:hover{border-color:var(--flame,var(--flare,#ff5a1f))!important}',
    /* the sliding pill — first span in both builds. Sized to exactly half the
       track so it sits behind one label instead of clipping through it. */
    'button[aria-label^="Switch to"]>[data-bs-tgknob]{position:absolute!important;top:.1875rem!important;bottom:.1875rem!important;left:.1875rem!important;right:auto!important;width:calc(50% - .1875rem)!important;height:auto!important;margin:0!important;padding:0!important;border-radius:999px!important;background:var(--flame,var(--flare,#ff5a1f))!important;transform:translateX(0)!important;transition:transform .34s cubic-bezier(.4,0,.2,1)!important;z-index:0!important;pointer-events:none!important;font-size:0!important;color:transparent!important}',
    'html[data-theme=light] button[aria-label^="Switch to"]>[data-bs-tgknob]{transform:translateX(100%)!important}',
    /* the two labels, each owning half the track and centred on the pill.
       padding-left cancels the trailing letter-spacing so the ink is optically
       centred, not just box-centred. */
    'button[aria-label^="Switch to"]>[data-bs-tglabel]{position:relative!important;z-index:1!important;flex:1 1 50%!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;padding:0 0 0 .1em!important;margin:0!important;font-size:.5625rem!important;font-weight:600!important;line-height:1!important;letter-spacing:.1em!important;text-transform:uppercase!important;transition:color .25s ease!important}',
    /* active label reads on the flame pill, inactive one recedes */
    'button[aria-label^="Switch to"]>[data-bs-tglabel=dk]{color:#141414!important}',
    'button[aria-label^="Switch to"]>[data-bs-tglabel=lt]{color:var(--ash-dim,var(--bone-dim,rgba(244,241,234,.5)))!important}',
    'html[data-theme=light] button[aria-label^="Switch to"]>[data-bs-tglabel=dk]{color:var(--ash-dim,var(--bone-dim,rgba(20,20,20,.5)))!important}',
    'html[data-theme=light] button[aria-label^="Switch to"]>[data-bs-tglabel=lt]{color:#141414!important}',
    /* the embed build hides its switch below md — show it everywhere */
    'button[aria-label^="Switch to"].hidden{display:inline-flex!important}',
    /* anything else inside the switch (the embed build's "/" separator) is dropped */
    'button[aria-label^="Switch to"]>*:not([data-bs-tgknob]):not([data-bs-tglabel]){display:none!important}',

    /* ---------- normal OS cursor everywhere -------------------------------- */
    /* The build shipped a custom cursor follower (a dot that swelled into an
       orange bubble with a label). It is switched off in the bundle; these rules
       clean up after it so pointer feedback is the plain system cursor. */
    "html,body{cursor:auto!important}",
    "a,button,[role=button],summary,label[for],select,[data-cursor]{cursor:pointer!important}",
    "input,textarea,[contenteditable=true]{cursor:text!important}",
    ".cursor-default{cursor:auto!important}",
    "a[aria-disabled=true],button:disabled{cursor:not-allowed!important}",

    /* ---------- hero word swap: a masked slide-up reveal, no scramble ------- */
    "@keyframes bs-word-in{0%{opacity:0;transform:translateY(0.42em) skewY(2.5deg);filter:blur(6px)}55%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateY(0) skewY(0);filter:blur(0)}}",
    "[data-bs-heroword]{display:inline-block!important;will-change:transform,opacity,filter}",
    "[data-bs-heroword].bs-word-anim{animation:bs-word-in .82s cubic-bezier(.16,1,.3,1) both}",

    /* ---------- 16 — capability cards open their live work ------------------ */
    "[data-bs-svc]{cursor:pointer!important}",
    "[data-bs-svc] .bs-svc-open{display:inline-flex;align-items:center;gap:.5rem;margin-top:1rem;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--flare,#f04e23)}",
    ".bs-svc-modal{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:clamp(1rem,3vw,2.5rem);background:rgba(6,6,6,.88);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;transition:opacity .26s ease}",
    ".bs-svc-modal.is-open{opacity:1}",
    ".bs-svc-panel{position:relative;width:min(1100px,100%);max-height:86vh;overflow:auto;-webkit-overflow-scrolling:touch;padding:clamp(1.5rem,3vw,2.75rem);background:var(--ink-2,var(--ink-raise,#141414));border:1px solid var(--hair,rgba(255,255,255,.16))}",
    ".bs-svc-eyebrow{display:block;font-size:10px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--flare,var(--flame,#f04e23))}",
    ".bs-svc-title{margin:.75rem 0 0;font-size:clamp(1.6rem,3vw,2.6rem);line-height:1;letter-spacing:-.02em;text-transform:uppercase;color:var(--bone,#fff)}",
    ".bs-svc-close{position:absolute;top:clamp(.75rem,1.6vw,1.35rem);right:clamp(.75rem,1.6vw,1.35rem);display:inline-flex;align-items:center;gap:.5rem;padding:.55rem 1rem;border:1px solid var(--hair,rgba(255,255,255,.16));background:transparent;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--bone,#fff);cursor:pointer;transition:border-color .25s ease,color .25s ease}",
    ".bs-svc-close:hover{border-color:var(--flare,var(--flame,#f04e23));color:var(--flare,var(--flame,#f04e23))}",
    ".bs-svc-list{display:grid;grid-template-columns:1fr;gap:1px;margin-top:clamp(1.5rem,3vh,2.25rem);background:var(--hair,rgba(255,255,255,.16))}",
    "@media(min-width:768px){.bs-svc-list.is-links{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.bs-svc-list.is-videos{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    ".bs-svc-link{display:flex;flex-direction:column;gap:.5rem;padding:clamp(1.1rem,2vw,1.6rem);background:var(--ink,#0b0b0b);text-decoration:none;transition:background .25s ease}",
    ".bs-svc-link:hover{background:var(--card,rgba(255,255,255,.04))}",
    ".bs-svc-link b{font-size:clamp(1rem,1.4vw,1.25rem);font-weight:600;letter-spacing:-.01em;color:var(--bone,#fff)}",
    ".bs-svc-link span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--bone-dim,var(--ash,#a3a3a3));word-break:break-all}",
    ".bs-svc-link em{font-style:normal;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--flare,var(--flame,#f04e23))}",
    ".bs-svc-clip{display:flex;flex-direction:column;gap:.75rem;padding:clamp(1.1rem,2vw,1.6rem);background:var(--ink,#0b0b0b)}",
    ".bs-svc-clip video{width:100%;height:auto;display:block;background:#000;border:1px solid var(--hair,rgba(255,255,255,.16))}",
    ".bs-svc-clip span{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--bone-dim,var(--ash,#a3a3a3))}",
    "html.bs-svc-lock,body.bs-svc-lock{overflow:hidden!important}",
  ].join("\n");

  /**
   * The two builds ship two different switch markups: the home bundle renders
   * [knob, "Dk", "Lt"] while the embed bundle (About / Blog) renders
   * ["DK", "/", "LT"] with no knob at all. Tag the parts here so one stylesheet
   * can draw the same pill on every page instead of guessing at child order.
   */
  function patchToggle(doc) {
    if (!doc) return;
    var btns = doc.querySelectorAll('button[aria-label^="Switch to"]');
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      var kids = btn.children;
      var knob = null;
      var j;
      /* an existing empty span is the home build's knob; reuse it */
      for (j = 0; j < kids.length; j++) {
        if (kids[j].hasAttribute("data-bs-tgknob")) { knob = kids[j]; break; }
      }
      if (!knob) {
        for (j = 0; j < kids.length; j++) {
          if (!(kids[j].textContent || "").trim()) { knob = kids[j]; break; }
        }
      }
      if (!knob) {
        knob = doc.createElement("span");
        knob.setAttribute("aria-hidden", "true");
        btn.insertBefore(knob, btn.firstChild);
      }
      if (!knob.hasAttribute("data-bs-tgknob")) knob.setAttribute("data-bs-tgknob", "1");

      for (j = 0; j < kids.length; j++) {
        var el = kids[j];
        if (el === knob) continue;
        var t = (el.textContent || "").trim().toLowerCase();
        var want = t === "dk" || t === "dark" ? "dk" : (t === "lt" || t === "light" ? "lt" : null);
        if (want) {
          if (el.getAttribute("data-bs-tglabel") !== want) el.setAttribute("data-bs-tglabel", want);
        } else if (el.hasAttribute("data-bs-tglabel")) {
          el.removeAttribute("data-bs-tglabel");
        }
      }
    }
  }

  /** Mirror the switch design into every same-origin iframe (embeds, modal). */
  function styleFrame(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.head) return;
      var tag = doc.getElementById("bs-toggle-styles");
      if (!tag) {
        tag = doc.createElement("style");
        tag.id = "bs-toggle-styles";
        tag.textContent = TOGGLE_CSS;
        doc.head.appendChild(tag);
      }
      patchToggle(doc);
    } catch (e) {
      /* cross-origin or not ready — the next sync retries */
    }
  }

  function styleFrames() {
    var frames = document.querySelectorAll("[data-bs-injected] iframe, .bs-modal iframe");
    for (var i = 0; i < frames.length; i++) styleFrame(frames[i]);
  }

  function injectStyles() {
    if (document.getElementById("bs-patch-styles")) return;
    var css = [
      TOGGLE_CSS,
      /* 6 — mobile work rail: a swipeable deck instead of 10 stacked images */
      "@media(max-width:767px){",
      "  [data-bs-workrail]{display:flex!important;grid-template-columns:none!important;gap:1rem!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:1.25rem!important;margin-left:0;margin-right:0}",
      "  [data-bs-workrail]::-webkit-scrollbar{display:none}",
      "  [data-bs-workrail]>*{flex:0 0 78%!important;scroll-snap-align:center!important;transition:opacity .35s ease,transform .35s ease;opacity:.42;transform:scale(.94)}",
      "  [data-bs-workrail]>*.bs-live{opacity:1;transform:scale(1)}",
      "}",
      /* 18 — marquee ribbon: one row only, and a shorter one */
      "[data-bs-ribbon]{padding-top:clamp(.55rem,1.1vh,.9rem)!important;padding-bottom:clamp(.55rem,1.1vh,.9rem)!important}",
      "[data-bs-ribbon]>*:nth-child(n+2){display:none!important}",
      "[data-bs-ribbon]>*:first-child{margin-top:0!important}",
      "[data-bs-ribbon] *{font-size:clamp(.7rem,1.15vw,1rem)!important;line-height:1.25!important}",
      /* 15 — lead block split in two: film on one side, project copy on the other */
      "[data-bs-lead]{display:grid;grid-template-columns:1fr;width:100%;background:var(--ink,#0b0b0b);border-bottom:1px solid var(--hair,#262626)}",
      "@media(min-width:768px){[data-bs-lead]{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}}",
      ".bs-lead-media{position:relative;overflow:hidden;background:#000;min-height:clamp(260px,44vh,400px)}",
      "@media(min-width:768px){.bs-lead-media{min-height:clamp(480px,74vh,780px)}}",
      ".bs-lead-media video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}",
      ".bs-lead-tag{position:absolute;z-index:2;left:clamp(1rem,2vw,1.75rem);top:clamp(1rem,2vw,1.75rem);font-size:.625rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#fff;text-shadow:0 1px 12px rgba(0,0,0,.55)}",
      ".bs-lead-copy{display:flex;flex-direction:column;justify-content:center;gap:clamp(.85rem,1.5vh,1.35rem);padding:clamp(2.25rem,4vw,4rem);background:var(--ink-2,#141414);border-top:1px solid var(--hair,#262626)}",
      "@media(min-width:768px){.bs-lead-copy{border-top:0;border-left:1px solid var(--hair,#262626)}}",
      ".bs-lead-idx{font-size:.625rem;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--flame,#e9622b)}",
      ".bs-lead-title{margin:0;font-size:clamp(2rem,3.6vw,3.5rem);line-height:.98;letter-spacing:-.02em;text-transform:uppercase;color:var(--bone,#fff)}",
      ".bs-lead-meta{margin:0;font-size:.6875rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ash-dim,#6b6b6b)}",
      ".bs-lead-desc{margin:0;max-width:36ch;font-size:clamp(.875rem,.95vw,1rem);line-height:1.7;color:var(--ash,#a3a3a3)}",
      ".bs-lead-cta{display:inline-flex;align-items:center;gap:.65rem;align-self:flex-start;margin-top:.35rem;padding:.85rem 1.6rem;border:1px solid var(--flame,#e9622b);border-radius:999px;font-size:.6875rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--flame,#e9622b);text-decoration:none;transition:background .25s ease,color .25s ease}",
      ".bs-lead-cta:hover{background:var(--flame,#e9622b);color:#141414}",
      ".bs-lead-cta i{font-style:normal;transition:transform .25s ease}",
      ".bs-lead-cta:hover i{transform:translateX(4px)}",
      ".bs-railmeta{display:flex;align-items:center;gap:.75rem;padding:0 0 clamp(3rem,8vh,6rem)}",
      ".bs-railmeta .bs-railcount{font-size:.6875rem;letter-spacing:.22em;text-transform:uppercase;color:var(--flame,#ff5a1f);white-space:nowrap}",
      ".bs-railmeta .bs-railbar{position:relative;flex:1 1 auto;height:1px;background:var(--hair,rgba(255,255,255,.16))}",
      ".bs-railmeta .bs-railbar i{position:absolute;left:0;top:-1px;height:3px;background:var(--flame,#ff5a1f);transition:width .3s ease,transform .3s ease}",
      "@media(min-width:768px){.bs-railmeta{display:none}}",
      /* 1 — the clipped section heading: give the display type room to breathe */
      "#work .section-title,#work h2.section-title{line-height:1.04!important;padding-top:.08em;padding-bottom:.14em;overflow:visible!important}",
      "#work .shell{padding-top:clamp(5rem,11vh,9rem)!important}",
      "#work .section-title span{display:inline-block;overflow:visible!important}",
      /* the block above the heading must not bleed into it */
      "#work>div:first-child{margin-bottom:clamp(1.5rem,3vh,3rem)}",
      /* 4 — enquiry modal */
      ".bs-modal{position:fixed;inset:0;z-index:2147483000;display:block;background:rgba(6,6,6,.86);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .28s ease}",
      ".bs-modal.is-open{opacity:1}",
      ".bs-modal iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent}",
      ".bs-modal-lock{overflow:hidden!important}",
      /* 5 — the "Made with Runable" badge baked into their compiled bundle */
      "[data-runable-badge]{display:none!important}",
    ].join("\n");
    var style = document.createElement("style");
    style.id = "bs-patch-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------------- services */

  function buildServices(original) {
    original.removeAttribute("id");
    original.setAttribute("data-bs-replaced", "true");
    original.style.display = "none";

    var pinned = window.innerWidth >= PIN_MIN_WIDTH;

    var wrap = document.createElement("section");
    wrap.id = "services";
    wrap.setAttribute("data-bs-injected", "services");
    wrap.style.cssText =
      "position:relative;background:" + surface() + ";width:100%;overflow-anchor:none;";

    var sticky = document.createElement("div");
    sticky.style.cssText = "position:relative;width:100%;overflow-anchor:none;";

    var frame = document.createElement("iframe");
    frame.src = EMBED + "?embed=services&v=" + BUILD + (pinned ? "&pin=1" : "");
    frame.title = "BetterSide capabilities";
    frame.loading = "eager";
    frame.setAttribute("scrolling", "no");
    frame.style.cssText =
      "display:block;width:100%;height:100vh;border:0;background:" + surface() + ";";

    sticky.appendChild(frame);
    wrap.appendChild(sticky);
    original.parentNode.insertBefore(wrap, original);

    function applyLayout() {
      if (pinned) {
        wrap.style.height = PIN_VH * 100 + "vh";
        sticky.style.position = "sticky";
        sticky.style.top = "0";
        sticky.style.height = "100vh";
        sticky.style.overflow = "hidden";
        frame.style.height = "100vh";
      } else {
        wrap.style.height = "auto";
        sticky.style.position = "relative";
        sticky.style.top = "auto";
        sticky.style.height = "auto";
        sticky.style.overflow = "visible";
      }
    }
    applyLayout();

    function send(message) {
      if (frame.contentWindow) frame.contentWindow.postMessage(message, "*");
    }

    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "bs-services-ready") {
        send({ type: "bs-services-mode", pinned: pinned });
        pushProgress();
        return;
      }

      if (data.type === "bs-services-height" && !pinned) {
        var h = Number(data.height);
        if (!isFinite(h) || h < 320) return;
        frame.style.height = Math.ceil(h) + "px";
      }
    });

    var queued = false;
    function pushProgress() {
      if (!pinned) return;
      var rect = wrap.getBoundingClientRect();
      var span = rect.height - window.innerHeight;
      if (span <= 0) return;
      var p = -rect.top / span;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      send({ type: "bs-services-progress", progress: p });
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        pushProgress();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      var next = window.innerWidth >= PIN_MIN_WIDTH;
      if (next !== pinned) {
        pinned = next;
        applyLayout();
        send({ type: "bs-services-mode", pinned: pinned });
      }
      pushProgress();
    });

    /**
     * The embed sets `overflow:hidden` on its own <html> while pinned, so wheel
     * and touch gestures over the iframe die inside it and never reach this
     * page: the pin appeared to stall and bounce backwards. Same-origin, so we
     * bridge the gestures straight into the parent scroller.
     */
    function wireGestureBridge() {
      if (!pinned) return;
      var doc;
      try {
        doc = frame.contentDocument;
      } catch (e) {
        return;
      }
      if (!doc || doc.__bsGesture) return;
      doc.__bsGesture = true;

      /* Deltas are accumulated and applied once per frame. Applying every raw
         wheel event immediately fought the browser's own scroll animation and
         made the pin stutter (steps of 10px next to steps of 400px). */
      var pendingY = 0;
      var flushing = false;
      function flush() {
        flushing = false;
        var dy = pendingY;
        pendingY = 0;
        if (!dy) return;
        window.scrollBy({ top: dy, left: 0, behavior: "instant" });
      }
      doc.addEventListener(
        "wheel",
        function (event) {
          if (!pinned || doc.__bsSvcOpen) return;
          pendingY += event.deltaY;
          if (!flushing) {
            flushing = true;
            requestAnimationFrame(flush);
          }
          event.preventDefault();
        },
        { passive: false }
      );

      var lastY = null;
      doc.addEventListener(
        "touchstart",
        function (event) {
          lastY = event.touches && event.touches.length ? event.touches[0].clientY : null;
        },
        { passive: true }
      );
      doc.addEventListener(
        "touchmove",
        function (event) {
          if (!pinned || lastY === null || doc.__bsSvcOpen) return;
          if (!event.touches || !event.touches.length) return;
          var y = event.touches[0].clientY;
          window.scrollBy(0, lastY - y);
          lastY = y;
          if (event.cancelable) event.preventDefault();
        },
        { passive: false }
      );
      doc.addEventListener(
        "touchend",
        function () {
          lastY = null;
        },
        { passive: true }
      );
    }

    /**
     * 16 — the capability cards listed in SERVICE_DETAIL become clickable and
     * open their live work (websites or walkthrough clips) in a panel inside
     * the embed. Cards not listed are left completely untouched.
     */
    function wireServiceCards() {
      var doc;
      try {
        doc = frame.contentDocument;
      } catch (e) {
        return false;
      }
      if (!doc || !doc.body) return false;

      var cards = doc.querySelectorAll(".services-rail > div");
      if (!cards.length) return false;
      var wired = 0;

      for (var i = 0; i < cards.length; i++) {
        (function (card) {
          if (card.getAttribute("data-bs-svc") !== null) {
            wired++;
            return;
          }
          var head = card.querySelector("h3");
          if (!head) return;
          var key = (head.innerText || "").replace(/\s+/g, " ").trim().toLowerCase();
          var detail = SERVICE_DETAIL[key];
          if (!detail) return;

          card.setAttribute("data-bs-svc", key);
          wired++;

          var hint = card.querySelector(".bs-svc-open");
          if (!hint) {
            /* re-label the card's own "VIEW WORK" row so the click is obvious */
            var labels = card.querySelectorAll("span, div");
            for (var j = 0; j < labels.length; j++) {
              var t = (labels[j].textContent || "").trim().toLowerCase();
              if (t === "view work") {
                labels[j].textContent =
                  detail.kind === "videos" ? "VIEW WALKTHROUGHS" : "VIEW LIVE WORK";
                break;
              }
            }
          }

          card.addEventListener("click", function (event) {
            var link = event.target && event.target.closest ? event.target.closest("a") : null;
            if (link) return;
            event.preventDefault();
            openServiceDetail(doc, head, detail);
          });
        })(cards[i]);
      }
      return wired > 0;
    }

    function openServiceDetail(doc, head, detail) {
      closeServiceDetail(doc);

      var modal = doc.createElement("div");
      modal.className = "bs-svc-modal";

      var panel = doc.createElement("div");
      panel.className = "bs-svc-panel";

      var close = doc.createElement("button");
      close.type = "button";
      close.className = "bs-svc-close";
      close.textContent = "CLOSE ✕";
      panel.appendChild(close);

      var eyebrow = doc.createElement("span");
      eyebrow.className = "bs-svc-eyebrow";
      eyebrow.textContent = detail.lead || "SELECTED WORK";
      panel.appendChild(eyebrow);

      var title = doc.createElement("h4");
      title.className = "bs-svc-title";
      title.textContent = (head.innerText || "").replace(/\s+/g, " ").trim();
      panel.appendChild(title);

      var list = doc.createElement("div");
      list.className = "bs-svc-list " + (detail.kind === "videos" ? "is-videos" : "is-links");

      (detail.items || []).forEach(function (item) {
        if (detail.kind === "videos") {
          var clip = doc.createElement("div");
          clip.className = "bs-svc-clip";
          var video = doc.createElement("video");
          video.setAttribute("controls", "");
          video.setAttribute("playsinline", "");
          video.setAttribute("preload", "metadata");
          video.muted = true;
          video.loop = true;
          try {
            video.src = new URL(item.file, doc.baseURI).href;
          } catch (e) {
            video.src = item.file;
          }
          clip.appendChild(video);
          var cap = doc.createElement("span");
          cap.textContent = item.label;
          clip.appendChild(cap);
          list.appendChild(clip);
          var playing = video.play();
          if (playing && playing.catch) playing.catch(function () {});
        } else {
          var a = doc.createElement("a");
          a.className = "bs-svc-link";
          a.href = item.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          var b = doc.createElement("b");
          b.textContent = item.label;
          var url = doc.createElement("span");
          url.textContent = item.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
          var go = doc.createElement("em");
          go.textContent = "OPEN SITE →";
          a.appendChild(b);
          a.appendChild(url);
          a.appendChild(go);
          list.appendChild(a);
        }
      });

      panel.appendChild(list);
      modal.appendChild(panel);
      doc.body.appendChild(modal);
      doc.__bsSvcOpen = true;

      close.addEventListener("click", function () {
        closeServiceDetail(doc);
      });
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeServiceDetail(doc);
      });
      doc.addEventListener("keydown", function onKey(event) {
        if (event.key === "Escape") {
          closeServiceDetail(doc);
          doc.removeEventListener("keydown", onKey);
        }
      });

      requestAnimationFrame(function () {
        modal.classList.add("is-open");
      });
    }

    function closeServiceDetail(doc) {
      doc.__bsSvcOpen = false;
      var open = doc.querySelectorAll(".bs-svc-modal");
      for (var i = 0; i < open.length; i++) {
        var node = open[i];
        node.classList.remove("is-open");
        (function (n) {
          setTimeout(function () {
            if (n.parentNode) n.parentNode.removeChild(n);
          }, 260);
        })(node);
      }
    }

    frame.addEventListener("load", function () {
      send({ type: "bs-services-mode", pinned: pinned });
      wireGestureBridge();
      wireServiceCards();
      styleFrame(frame);
      pushProgress();
    });

    [200, 700, 1600].forEach(function (ms) {
      setTimeout(function () {
        send({ type: "bs-services-mode", pinned: pinned });
        wireGestureBridge();
      wireServiceCards();
        styleFrame(frame);
        pushProgress();
      }, ms);
    });
  }

  function findServices() {
    var live = document.querySelector('[data-bs-injected="services"]');
    if (live && live.isConnected) return null;
    var el = document.querySelector("section#services");
    if (el && el.getAttribute("data-bs-injected")) return null;
    if (el) return el;
    var sections = document.querySelectorAll("main section");
    for (var i = 0; i < sections.length; i++) {
      var t = (sections[i].textContent || "").toUpperCase();
      if (t.indexOf("CAPABILITIES") !== -1 && t.indexOf("SCROLL SIDEWAYS") !== -1) {
        return sections[i];
      }
    }
    return null;
  }

  /* ------------------------------------------------------- work lead visual */

  function leadVideo(poster) {
    var video = document.createElement("video");
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("aria-hidden", "true");
    if (poster) video.poster = poster;

    var source = document.createElement("source");
    source.src = ROOT + "services-section/videos/work-lead.mp4";
    source.type = "video/mp4";
    video.appendChild(source);
    return video;
  }

  /**
   * Splits the lead block under the hero into two panes: the film on one side,
   * the project name / meta / description / explore button on the other.
   * The original well is hidden, never removed, so the change is reversible and
   * React can keep re-creating its own node without fighting us.
   */
  function patchWorkLead() {
    var work = document.querySelector("#work");
    if (!work) return false;

    var live = work.querySelector("[data-bs-lead]");
    if (live && live.isConnected) return true;

    var img = work.querySelector('img[src*="project-01"]');
    if (!img) return false;

    var well = img;
    while (well && well.parentElement !== work) well = well.parentElement;
    if (!well) return false;

    /* Read the original caption before anything is hidden. */
    var lines = (well.innerText || "")
      .split("\n")
      .map(function (l) {
        return l.replace(/\s*·\s*$/, "").trim();
      })
      .filter(function (l) {
        return l.length > 0;
      });
    var tag = lines[0] || "SELECTED WORK";
    var title = lines[1] || "";
    var meta = lines[2] || "";

    var block = document.createElement("div");
    block.setAttribute("data-bs-lead", "");

    var media = document.createElement("div");
    media.className = "bs-lead-media";
    var video = leadVideo(img.getAttribute("src") || "");
    media.appendChild(video);
    var label = document.createElement("span");
   
    label.textContent = tag;
    media.appendChild(label);

    var copy = document.createElement("div");
    copy.className = "bs-lead-copy";

    var idx = document.createElement("span");
    idx.className = "bs-lead-idx";
    idx.textContent = tag;
    copy.appendChild(idx);

    var h = document.createElement("h3");
    h.className = "bs-lead-title";
    h.textContent = title;
    copy.appendChild(h);

    if (meta) {
      var m = document.createElement("p");
      m.className = "bs-lead-meta";
      m.textContent = meta;
      copy.appendChild(m);
    }

    var desc = document.createElement("p");
    desc.className = "bs-lead-desc";
    desc.textContent = LEAD_COPY.desc;
    copy.appendChild(desc);

    var cta = document.createElement("a");
    cta.className = "bs-lead-cta";
    cta.href = LEAD_COPY.href;
    cta.textContent = LEAD_COPY.cta;
    var arrow = document.createElement("i");
    arrow.textContent = "→";
    cta.appendChild(arrow);
    copy.appendChild(cta);

    block.appendChild(media);
    block.appendChild(copy);

    work.insertBefore(block, well);
    well.style.display = "none";

    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () {});
    return true;
  }

  /* ------------------------------------------------------------- studio page */

  function patchStudio() {
    if (!/\/studio\/?$/.test(window.location.pathname)) return false;
    var main = document.querySelector("main");
    if (!main) return false;
    /* Their router re-renders /studio on client-side navigation, which throws the
       injected block away. Trust the live node, never a stale attribute. */
    var live = document.querySelector('[data-bs-injected="studio"]');
    if (live && live.isConnected) return true;
    if (main.getAttribute("data-bs-studio") === "done") main.removeAttribute("data-bs-studio");

    // The middle block is the tall wrapper between the hero section and the footer.
    var kids = [].slice.call(main.children);
    var middle = null;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.tagName === "HEADER" || el.tagName === "FOOTER") continue;
      var t = (el.textContent || "").toUpperCase();
      if (t.indexOf("WHO WE ARE") !== -1 || t.indexOf("WHAT WE BELIEVE") !== -1) {
        middle = el;
        break;
      }
    }
    if (!middle) return false;
    main.setAttribute("data-bs-studio", "done");
    patchStudioHero(main, middle);

    middle.setAttribute("data-bs-replaced", "true");
    middle.style.display = "none";

    var wrap = document.createElement("div");
    wrap.setAttribute("data-bs-injected", "studio");
    wrap.style.cssText = "position:relative;width:100%;background:" + surface() + ";";

    var frame = document.createElement("iframe");
    frame.src = EMBED + "?embed=studio&v=" + BUILD;
    frame.title = "BetterSide — what drives the studio";
    frame.loading = "eager";
    frame.setAttribute("scrolling", "no");
    frame.style.cssText =
      "display:block;width:100%;height:1400px;border:0;background:" + surface() + ";";
    wrap.appendChild(frame);
    middle.parentNode.insertBefore(wrap, middle);

    function fit() {
      try {
        var doc = frame.contentDocument;
        if (!doc || !doc.body) return;
        var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
        if (h > 320) frame.style.height = Math.ceil(h) + "px";
      } catch (e) {
        /* cross-origin — keep the fallback height */
      }
    }
    frame.addEventListener("load", fit);
    [300, 900, 1800, 3000].forEach(function (ms) {
      setTimeout(fit, ms);
    });
    window.addEventListener("resize", fit);

    /* The embed also reports its own height, which is exact — no dead gap. */
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || typeof data !== "object" || data.type !== "bs-studio-height") return;
      if (event.source !== frame.contentWindow) return;
      var h = Number(data.height);
      if (!isFinite(h) || h < 320) return;
      frame.style.height = Math.ceil(h) + "px";
    });
    return true;
  }

  /**
   * Their compiled /studio hero states two facts that are wrong: "2 countries"
   * (it is three) and a team headcount (which must never be published). We can
   * only reach it through the DOM, so rewrite the leaf text nodes in place.
   */
  function patchStudioHero(main, middle) {
    var kids = [].slice.call(main.children);
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el === middle || el.tagName === "HEADER" || el.tagName === "FOOTER") continue;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = [];
      var n;
      while ((n = walker.nextNode())) nodes.push(n);
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        var raw = (node.nodeValue || "").trim();
        if (!raw) continue;
        var up = raw.toUpperCase();
        if (/^2\s*COUNTRIES$/.test(up)) {
          node.nodeValue = node.nodeValue.replace(/2/, "3");
        } else if (/IN-?HOUSE$/.test(up) && /^\d/.test(up)) {
          node.nodeValue = node.nodeValue.replace(/^\s*\d+\s*/, "");
          node.nodeValue = "10+ Projects";
        } else if (/^TEAM$/.test(up)) {
          node.nodeValue = "Delivered";
        }
      }
    }
  }

  /* -------------------------------------------------------------------- theme */

  /** The original build stores the theme in localStorage and mirrors it on <html>. */
  function currentTheme() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    try {
      return window.localStorage.getItem("sn-theme") === "light" ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  }

  /** Panel colour behind the injected iframes, matched to their --ink-2 token. */
  function surface() {
    return currentTheme() === "light" ? "#ebe7df" : "#141414";
  }

  /** Push the active theme into every injected iframe and repaint the wrappers. */
  function syncTheme() {
    var theme = currentTheme();
    var paint = surface();
    var wraps = document.querySelectorAll("[data-bs-injected]");
    for (var i = 0; i < wraps.length; i++) wraps[i].style.background = paint;
    var frames = document.querySelectorAll("[data-bs-injected] iframe, .bs-modal iframe");
    for (var j = 0; j < frames.length; j++) {
      frames[j].style.background = paint;
      try {
        frames[j].contentWindow.postMessage({ type: "bs-theme", theme: theme }, "*");
      } catch (e) {
        /* not ready yet — the next sync catches it */
      }
      styleFrame(frames[j]);
    }
  }

  function watchTheme() {
    if (document.documentElement.getAttribute("data-bs-theme-watch") === "done") return;
    document.documentElement.setAttribute("data-bs-theme-watch", "done");
    new MutationObserver(syncTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("storage", function (e) {
      if (e.key === "sn-theme") syncTheme();
    });
    // The embeds report their own toggle back up.
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || d.type !== "bs-theme-request") return;
      if (d.theme !== "light" && d.theme !== "dark") return;
      try {
        window.localStorage.setItem("sn-theme", d.theme);
      } catch (err) {
        /* ignore */
      }
      document.documentElement.setAttribute("data-theme", d.theme);
      document.documentElement.style.colorScheme = d.theme;
      syncTheme();
    });
    [400, 1200, 2400].forEach(function (ms) {
      setTimeout(syncTheme, ms);
    });
  }

  /* ------------------------------------------------------------- link repair */

  /**
   * The compiled build hard-codes absolute links ("/", "/#work", "/studio").
   * Those only resolve when the site sits exactly at a domain root, so every
   * page stops linking to the others under a subfolder or a local preview.
   * Rewrite them against ROOT, which is derived from this script's own URL.
   */
  function patchLinks() {
    var anchors = document.querySelectorAll("a[href]");
    var touched = false;
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (a.getAttribute("data-bs-link") === "done") continue;
      var raw = a.getAttribute("href") || "";
      if (raw.charAt(0) !== "/" || raw.charAt(1) === "/") continue;
      var rest = raw.slice(1);
      var target;
      if (rest === "" ) target = ROOT;
      else if (rest.charAt(0) === "#") target = ROOT + rest;
      else if (/^studio\/?$/.test(rest)) target = ROOT + "studio/";
      else if (/^(about|blog)\/?$/.test(rest)) target = ROOT + rest.replace(/\/?$/, "/");
      else target = ROOT + rest;
      a.setAttribute("href", target);
      a.setAttribute("data-bs-link", "done");
      touched = true;
    }
    return touched;
  }

  /* ---------------------------------------------------------------- nav links */

  /**
   * Every place the site lists its pages: the desktop header nav, the mobile
   * menu panel (a plain div, not a <nav>) and the footer link list. About and
   * Blog have to appear in all of them, or they are invisible on phones.
   */
  function navContainers() {
    var out = [];

    function push(el) {
      if (!el || out.indexOf(el) !== -1) return;
      /* only containers that really are a page list */
      var links = el.querySelectorAll("a");
      var hasStudio = false;
      var hasOther = false;
      for (var i = 0; i < links.length; i++) {
        var t = (links[i].textContent || "").trim();
        if (/^studio$/i.test(t)) hasStudio = true;
        else if (/^(work|services|ecosystem)$/i.test(t)) hasOther = true;
      }
      if (hasStudio && hasOther) out.push(el);
    }

    var navs = document.querySelectorAll("header nav");
    for (var i = 0; i < navs.length; i++) push(navs[i]);

    /* the mobile menu panel and the footer list hold their Studio link in a
       div or a <li>, so climb one level when the anchor is wrapped */
    var anchors = document.querySelectorAll("header a, footer a");
    for (var j = 0; j < anchors.length; j++) {
      var t = (anchors[j].textContent || "").trim();
      if (!/^studio$/i.test(t)) continue;
      var holder = anchors[j].parentNode;
      if (holder && holder.children.length < 2 && holder.parentNode) holder = holder.parentNode;
      push(holder);
    }
    return out;
  }

  function patchNav() {
    var lists = navContainers();
    var added = false;
    for (var i = 0; i < lists.length; i++) {
      var nav = lists[i];
      if (nav.getAttribute("data-bs-nav") === "done") {
        /* A re-render can keep the <nav> but discard our clones. */
        if (nav.querySelector('a[data-bs-added="1"]')) continue;
        nav.removeAttribute("data-bs-nav");
      }
      // Pages rendered by the new build already carry these links.
      if (nav.querySelector('a[href*="about"]')) {
        nav.setAttribute("data-bs-nav", "done");
        continue;
      }
      var anchors = nav.querySelectorAll("a");
      var template = null;
      var neutral = null;
      for (var j = 0; j < anchors.length; j++) {
        var text = (anchors[j].textContent || "").trim();
        if (/studio/i.test(text)) template = anchors[j];
        /* "Ecosystem" is a hash link, so it is never the highlighted page. */
        if (/ecosystem/i.test(text)) neutral = anchors[j];
        else if (!neutral && /^work$/i.test(text)) neutral = anchors[j];
      }
      if (!template) continue;
      /* Clone the styling from a link that is NOT the current page, otherwise
         About and Blog inherit the active colour + underline from Studio. */
      var styleSource = neutral || template;
      nav.setAttribute("data-bs-nav", "done");

      [
        { label: "Blog", href: ROOT + "blog/" },
        { label: "About", href: ROOT + "about/" },
      ].forEach(function (link) {
        var a = styleSource.cloneNode(true);
        a.setAttribute("href", link.href);
        a.setAttribute("data-bs-added", "1");
        a.setAttribute("data-bs-link", "done");
        a.removeAttribute("aria-current");
        a.removeAttribute("data-active");
        deactivate(a);
        setText(a, link.label);
        if (template.parentNode === nav) {
          nav.insertBefore(a, template.nextSibling);
        } else if (template.parentNode) {
          var holder = template.parentNode.cloneNode(false);
          holder.appendChild(a);
          template.parentNode.parentNode.insertBefore(holder, template.parentNode.nextSibling);
        }
        added = true;
      });
    }
    return added;
  }

  /**
   * Strip whatever marks a nav link as "current page": their build swaps the
   * text colour to --flame and grows the underline span to w-full.
   */
  function deactivate(root) {
    var nodes = [root].concat([].slice.call(root.querySelectorAll("*")));
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cls = el.getAttribute("class");
      if (!cls) continue;
      var next = cls
        .split(/\s+/)
        .filter(function (name) {
          return name && name !== "text-[var(--flame)]" && name !== "text-[var(--flare)]";
        })
        .map(function (name) {
          return name === "w-full" ? "w-0" : name;
        })
        .join(" ");
      if (next !== cls) el.setAttribute("class", next);
    }
    root.removeAttribute("aria-current");
  }

  /** Replace the deepest text of a cloned link without losing its markup/animation spans. */
  function setText(root, label) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      if ((walker.currentNode.nodeValue || "").trim()) nodes.push(walker.currentNode);
    }
    if (!nodes.length) {
      root.textContent = label;
      return;
    }
    nodes.forEach(function (n, i) {
      n.nodeValue = i === 0 ? label : label;
    });
  }

  /* ------------------------------------------------------------- form modal */

  var modal = null;

  function openForm() {
    if (modal) {
      modal.classList.add("is-open");
      document.documentElement.classList.add("bs-modal-lock");
      return;
    }
    modal = document.createElement("div");
    modal.className = "bs-modal";
    modal.setAttribute("data-bs-injected", "form");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    var frame = document.createElement("iframe");
    frame.src = EMBED + "?embed=form&v=" + BUILD;
    frame.title = "Start a project with BetterSide";
    frame.setAttribute("allowtransparency", "true");
    modal.appendChild(frame);

    document.body.appendChild(modal);
    document.documentElement.classList.add("bs-modal-lock");
    requestAnimationFrame(function () {
      modal.classList.add("is-open");
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeForm();
    });
  }

  function closeForm() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("bs-modal-lock");
    setTimeout(function () {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      modal = null;
    }, 300);
  }

  function wireForm() {
    document.addEventListener(
      "click",
      function (event) {
        var el = event.target;
        while (el && el !== document.body) {
          if (el.nodeType === 1) {
            var label = (el.textContent || "").trim();
            var flagged = el.getAttribute && el.getAttribute("data-bs-open-form") === "true";
            var isCta =
              flagged ||
              ((el.tagName === "A" || el.tagName === "BUTTON") &&
                /^start a project$/i.test(label));
            if (isCta) {
              event.preventDefault();
              event.stopPropagation();
              openForm();
              return;
            }
          }
          el = el.parentNode;
        }
      },
      true,
    );

    window.addEventListener("message", function (event) {
      var data = event.data;
      if (data && typeof data === "object" && data.type === "bs-form-close") closeForm();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeForm();
    });
  }

  /* ---------------------------------------------------- marquee ribbon (18) */

  /**
   * The ribbon under the hero shipped as two scrolling rows of the same phrases
   * (the second one dimmed to 30%). Tag the section so the stylesheet can drop
   * the duplicate row and make the remaining one shorter. Text is untouched.
   */
  function patchRibbon() {
    var sections = document.querySelectorAll("section");
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.id) continue;
      var txt = (s.textContent || "").toLowerCase();
      if (txt.indexOf("no purple skies") === -1 && txt.indexOf("films that travel") === -1) continue;
      if (s.getAttribute("data-bs-ribbon") !== "1") s.setAttribute("data-bs-ribbon", "1");
      return true;
    }
    return false;
  }

  /* ------------------------------------------------ hero word reveal (fix 1b) */

  /**
   * The compiled hero cycled its word with a character-scramble effect that read
   * as noise. The bundle now swaps the word in one clean step (the
   * reduced-motion branch), and this re-plays a masked slide-up reveal on every
   * swap, so the change is legible instead of jittery.
   */
  function patchHeroWord() {
    var hero = document.querySelector("main h1, header h1, h1");
    if (!hero) return false;
    var span = hero.querySelector('span[style*="ligatures"]') ||
      hero.querySelector("span.text-\\[var\\(--flame\\)\\]");
    if (!span) {
      var spans = hero.querySelectorAll("span");
      for (var i = 0; i < spans.length; i++) {
        var c = spans[i].className;
        if (typeof c === "string" && c.indexOf("--flame") !== -1) {
          span = spans[i];
          break;
        }
      }
    }
    if (!span) return false;
    if (span.getAttribute("data-bs-heroword") === "1") return true;
    span.setAttribute("data-bs-heroword", "1");

    function play() {
      span.classList.remove("bs-word-anim");
      /* force a reflow so the animation restarts on an identical class */
      void span.offsetWidth;
      span.classList.add("bs-word-anim");
    }

    new MutationObserver(function () {
      play();
    }).observe(span, { childList: true, characterData: true, subtree: true });

    play();
    return true;
  }

  /* ------------------------------------------------- mobile work deck (fix 4) */

  /**
   * On phones the "Ten projects, one standard." block rendered as ten stacked
   * 4:3 images — a long, dull vertical dump. Same markup, turned into a
   * horizontal snap deck with a counter and progress bar. The desktop sibling
   * (div.hidden.md:block) is left completely alone.
   */
  function patchWorkMobile() {
    var work = document.querySelector("#work");
    if (!work) return false;

    var live = work.querySelector("[data-bs-workrail]");
    if (live && live.isConnected && live.children.length) return true;

    var nodes = work.querySelectorAll("div");
    var rail = null;
    for (var i = 0; i < nodes.length; i++) {
      var cls = nodes[i].className;
      if (typeof cls !== "string") continue;
      if (cls.indexOf("md:hidden") === -1) continue;
      if (cls.indexOf("shell") === -1 && cls.indexOf("grid-cols-1") === -1) continue;
      if (nodes[i].children.length < 3) continue;
      rail = nodes[i];
      break;
    }
    if (!rail) return false;

    rail.setAttribute("data-bs-workrail", "1");

    var total = rail.children.length;
    var meta = rail.nextElementSibling;
    if (!meta || meta.className !== "bs-railmeta") {
      meta = document.createElement("div");
      meta.className = "bs-railmeta";
      meta.innerHTML =
        '<span class="bs-railcount">01 / ' +
        (total < 10 ? "0" + total : total) +
        '</span><span class="bs-railbar"><i></i></span>';
      rail.parentNode.insertBefore(meta, rail.nextSibling);
    }
    var count = meta.querySelector(".bs-railcount");
    var bar = meta.querySelector(".bs-railbar i");

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function update() {
      var mid = rail.scrollLeft + rail.clientWidth / 2;
      var active = 0;
      for (var k = 0; k < rail.children.length; k++) {
        var card = rail.children[k];
        var c = card.offsetLeft + card.offsetWidth / 2;
        if (c <= mid + card.offsetWidth / 2) active = k;
      }
      for (var j = 0; j < rail.children.length; j++) {
        rail.children[j].classList.toggle("bs-live", j === active);
      }
      if (count) count.textContent = pad(active + 1) + " / " + pad(total);
      if (bar) {
        var span = rail.scrollWidth - rail.clientWidth;
        var p = span > 0 ? rail.scrollLeft / span : 0;
        bar.style.width = Math.max(8, Math.round(p * 100)) + "%";
      }
    }

    if (!rail.__bsWired) {
      rail.__bsWired = true;
      var queued = false;
      rail.addEventListener(
        "scroll",
        function () {
          if (queued) return;
          queued = true;
          requestAnimationFrame(function () {
            queued = false;
            update();
          });
        },
        { passive: true }
      );
      window.addEventListener("resize", update);
    }
    update();
    return true;
  }

  /* ------------------------------------------------------------------- boot */

  var didHeroWord = false;
  var didWorkMobile = false;
  var didServices = false;
  var didWork = false;
  var didStudio = false;
  var didNav = false;
  var didRibbon = false;

  var ticking = false;

  function tick() {
    ticking = true;
    injectStyles();

    if (!didServices) {
      var services = findServices();
      if (services) {
        buildServices(services);
        didServices = true;
      }
    }
    if (!didWork) didWork = patchWorkLead();
    if (!didHeroWord) didHeroWord = patchHeroWord();
    if (!didWorkMobile) didWorkMobile = patchWorkMobile();
    if (!didStudio) didStudio = patchStudio();
    if (!didRibbon) didRibbon = patchRibbon();
    if (!didNav) didNav = patchNav();
    patchLinks();
    patchToggle(document);
    syncTheme();
    styleFrames();

    var onStudio = /\/studio\/?$/.test(window.location.pathname);
    var complete = didNav && (onStudio ? didStudio : didServices && didWork);
    if (complete || Date.now() - started > MAX_WAIT_MS) {
      ticking = false;
      return;
    }
    requestAnimationFrame(function () {
      setTimeout(tick, 80);
    });
  }

  /**
   * Their nav links are client-side routes: clicking "Studio" swaps the page
   * without a reload, so React tears down every node this script injected and
   * mounts the original markup again. Restart the patch pass on every route
   * change, and on any later re-render, so the patches can never be lost.
   */
  function restart() {
    didServices = false;
    didWork = false;
    didHeroWord = false;
    didWorkMobile = false;
    didStudio = false;
    didNav = false;
    didRibbon = false;
    started = Date.now();
    if (!ticking) tick();
  }

  function watchRoutes() {
    var last = window.location.pathname + window.location.hash;

    function check() {
      var now = window.location.pathname + window.location.hash;
      if (now === last) return;
      last = now;
      restart();
    }

    ["pushState", "replaceState"].forEach(function (name) {
      var original = window.history[name];
      if (typeof original !== "function") return;
      window.history[name] = function () {
        var out = original.apply(this, arguments);
        setTimeout(check, 0);
        setTimeout(check, 120);
        return out;
      };
    });

    window.addEventListener("popstate", function () {
      setTimeout(check, 0);
      setTimeout(check, 120);
    });
    window.addEventListener("hashchange", check);
    document.addEventListener(
      "click",
      function () {
        setTimeout(check, 0);
        setTimeout(check, 200);
        setTimeout(check, 600);
      },
      true
    );
    setInterval(check, 500);
  }

  /** A re-render can drop the injected nodes without changing the URL. */
  function watchRenders() {
    var queued = false;
    var observer = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      setTimeout(function () {
        queued = false;
        var onStudio = /\/studio\/?$/.test(window.location.pathname);
        var missing = onStudio
          ? !document.querySelector('[data-bs-injected="studio"]')
          : !document.querySelector('[data-bs-injected="services"]');
        var navGone = !document.querySelector('header nav a[data-bs-added="1"]');
        if (missing || navGone) restart();
      }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    injectStyles();
    watchTheme();
    wireForm();
    watchRoutes();
    watchRenders();
    tick();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();