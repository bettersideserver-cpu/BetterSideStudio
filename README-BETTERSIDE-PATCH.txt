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
9. Hero headline — the character-scramble on the cycling word is gone. The word
   now swaps in one clean masked slide-up reveal (blur + rise, 0.8s) and holds
   for 3.4 seconds, so it reads as type instead of noise.
10. Services (desktop) — the pinned sideways scroll no longer stalls or jumps
   backwards. Wheel and touch gestures made over the section are now passed
   through to the page, and browser scroll-anchoring is switched off on the
   pinned wrapper, so the section advances 0 -> 100% and then releases the page
   to the next section normally.
11. Theme switch — one single pill design used identically on every page and
   inside every embedded section, including About, Blog, Studio and the enquiry
   form. It is a proper two-segment control: the flame pill fills exactly half
   the track and sits behind the active label (DK or LT), which reads dark on
   orange, while the inactive label recedes. It is also visible on mobile now.
12. Custom cursor removed. The build shipped its own cursor (a white dot that
   swelled into a big orange bubble with a word like "View" or "Light" in it).
   It is gone — you now get the normal system cursor everywhere: an arrow on
   plain areas, a hand on links and buttons, a text caret in form fields.
13. Work section on phones — "Ten projects, one standard." is no longer ten
   images stacked vertically. It is a swipeable horizontal deck: one card at a
   time, the off-centre cards dim back, with a "04 / 09" counter and a progress
   bar underneath.
14. Fixed: that phone deck was leaking onto desktop. Its CSS was not limited to
   small screens, so above 768px it overrode the build's own "hidden on
   desktop" rule and drew the same projects a second time as two huge cards
   below the "hover to expand" strip. The deck styles now apply only below
   768px. Desktop shows the original strip and nothing else; phones are
   unchanged. No image or video path was touched.
15. The lead block under the hero is now split into two panes: the film plays on
   the left, and on the right sit the project name, its location/meta line, a
   short description and an "EXPLORE PROJECT" button. On phones the two panes
   stack (film on top, copy under it). Project name and meta are read live from
   your own build, so editing them in the bundle still updates this block.
   TO EDIT THE DESCRIPTION OR THE BUTTON: open services-section/inject.js and
   change the LEAD_COPY block near the top of the file (line 23) — "desc" is the
   paragraph, "cta" the button label, "href" where the button goes (currently
   #work). Nothing else needs touching. The video path is unchanged:
   services-section/videos/work-lead.mp4
16. Services section — three capability cards now open their live work when
   clicked (the other two are untouched and behave exactly as before):
     SALES EXPERIENCE      -> three websites: mdbthelutyens.in,
                              cminfiniaimmersive.com, and the Ananta Street
                              GitHub page. They open in a new tab.
     3D ANIMATIONS         -> two walkthrough players. Both clips are
                              PLACEHOLDERS — replace the files, keep the names:
                                services-section/videos/walkthrough-01.mp4
                                services-section/videos/walkthrough-02.mp4
     3D INTERACTIVE WEBSITES -> gillcomeraqui.com
   The panel opens inside the services section; close it with the CLOSE button,
   the Esc key, or by clicking the dark area around it. The cards' own "VIEW
   WORK" label now reads "VIEW LIVE WORK" / "VIEW WALKTHROUGHS" so it is clear
   they are clickable.
   TO EDIT THE LINKS OR ADD MORE: open services-section/inject.js and change the
   SERVICE_DETAIL block near the top of the file (around line 33). Each entry is
   just a label plus a url (or a video file name).
17. Fixed the scroll stutter in the services section. While the section is
   pinned, wheel movement over it is forwarded to the page; it used to be
   applied on every single wheel event, which fought the browser's own scroll
   animation and produced uneven jumps (a 10px step next to a 400px step).
   Deltas are now collected and applied once per frame, so the sideways travel
   is even: measured in equal 220px steps with the rail advancing ~124px each
   step, start to finish. Scrolling is also suspended while a card panel is
   open, so the panel scrolls instead of the page.


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
