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
  var BUILD = "20260826d";
  var MAX_WAIT_MS = 15000;
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

  function injectStyles() {
    if (document.getElementById("bs-patch-styles")) return;
    var css = [
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
    wrap.style.cssText = "position:relative;background:" + surface() + ";width:100%;";

    var sticky = document.createElement("div");
    sticky.style.cssText = "position:relative;width:100%;";

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

    frame.addEventListener("load", function () {
      send({ type: "bs-services-mode", pinned: pinned });
      pushProgress();
    });

    [200, 700, 1600].forEach(function (ms) {
      setTimeout(function () {
        send({ type: "bs-services-mode", pinned: pinned });
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

  function patchWorkVisual() {
    var img = document.querySelector('#work img[src*="project-01"]');
    if (!img || img.getAttribute("data-bs-video") === "done") return false;
    img.setAttribute("data-bs-video", "done");

    var well = img.parentElement;
    if (!well) return false;
    if (getComputedStyle(well).position === "static") well.style.position = "relative";

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
    video.poster = img.getAttribute("src") || "";
    video.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;";

    var source = document.createElement("source");
    source.src = ROOT + "services-section/videos/work-lead.mp4";
    source.type = "video/mp4";
    video.appendChild(source);

    well.appendChild(video);
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

  function patchNav() {
    var lists = document.querySelectorAll("header nav");
    var added = false;
    for (var i = 0; i < lists.length; i++) {
      var nav = lists[i];
      if (nav.getAttribute("data-bs-nav") === "done") {
        /* A re-render can keep the <nav> but discard our clones. */
        if (nav.querySelector('a[data-bs-added="1"]')) continue;
        nav.removeAttribute("data-bs-nav");
      }
      // Pages rendered by the new build already carry these links.
      if (nav.querySelector('a[href*="about/"]')) {
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

  /* ------------------------------------------------------------------- boot */

  var didServices = false;
  var didWork = false;
  var didStudio = false;
  var didNav = false;

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
    if (!didWork) didWork = patchWorkVisual();
    if (!didStudio) didStudio = patchStudio();
    if (!didNav) didNav = patchNav();
    patchLinks();
    syncTheme();

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
    didStudio = false;
    didNav = false;
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
