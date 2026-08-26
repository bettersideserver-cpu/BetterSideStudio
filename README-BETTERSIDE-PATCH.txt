BETTERSIDE — PATCHED BUILD
==========================

This is YOUR original build, untouched, plus new pieces added on top.
Only ONE line was changed in your own files:

  index.html  ->  <script defer src="./services-section/inject.js"></script>   (before </head>)

Everything else is additive:

  services-section/   the new UI (a compiled app) + inject.js, the patch script
  about/              new About page
  blog/               new Journal/Blog page

Upload the whole folder to your host exactly as it is. Nothing else to configure.


WHAT CHANGED ON THE SITE
------------------------
1. Work section — the "Ten projects, one standard." heading no longer collides with
   the image above it (CSS fix, injected).
2. Work section — the big lead visual is now a looping video.
3. Services — the old 6-item section is replaced with 5 services in your order:
   Sales Experience, 3D Animations, 3D Interactive Websites, Performance Marketing, SEO.
   Films has been dropped. Each card plays a looping clip, fitted so the video is
   never cropped. Desktop keeps the pinned sideways scroll; mobile swipes.
4. "START A PROJECT" (header + in-page) now opens an enquiry form:
   Project name, Project size, Type of work, Description, Name, Company, Contact number.
5. /studio — the middle content is replaced with new copy about determination and passion.
6. New /about/ and /blog/ pages, with About + Blog added to the header nav and footer index.
7. Pages are now properly connected. Every internal link (header logo, nav, footer)
   is resolved relative to wherever the site is served from, so Work / Services /
   Ecosystem / Studio / About / Blog / Start a project all work from any page and
   from a subfolder, not just from a domain root.
8. The DK / LT theme switch now works on the new About, Blog and Studio content, and
   the light theme is properly readable everywhere (card surfaces, media wells and
   form fields flip to light instead of staying black under dark text).
   It uses the same storage your site already uses (sn-theme), so the theme is
   shared: flip it anywhere and every page — including the new embedded sections —
   follows, and it survives a reload.


SWAPPING IN YOUR REAL VIDEOS
----------------------------
All clips are placeholders. Replace the files, keep the names and paths:

  services-section/videos/service-sales-experience.mp4
  services-section/videos/service-3d-animations.mp4
  services-section/videos/service-3d-interactive-website.mp4
  services-section/videos/service-performance-marketing.mp4
  services-section/videos/service-seo.mp4
  services-section/videos/work-lead.mp4        (big Work-section visual)
  services-section/videos/studio-loop.mp4      (studio page)

MP4 / H.264, no audio needed (they play muted). 16:9 or wider works best.
Blog and About images are placeholders too — files live in services-section/images/.


THE ENQUIRY FORM — ONE-TIME ACTIVATION
--------------------------------------
Your site is static (no server), so the form relays through FormSubmit to
info@betterside.in. The FIRST time anyone submits it, FormSubmit sends a
confirmation email to info@betterside.in — click the activate link once and every
submission after that lands in the inbox automatically. Do that submission
yourself right after going live so no real enquiry is lost.


NOTES
-----
- The new UI is loaded in isolated frames on purpose, so its stylesheet can never
  interfere with your existing design.
- Fonts load from Google Fonts, so the first paint needs an internet connection.
- If you ever want the original services section back, delete the one <script> line
  from index.html. The site returns to exactly what it was.
