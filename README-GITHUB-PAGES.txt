BETTERSIDE — GITHUB PAGES / LOCAL PREVIEW BUILD
===============================================

Use this folder for:
  • GitHub Pages (any repo name, including username.github.io/my-repo/)
  • VS Code Live Server on your own PC
  • any host where the site does NOT sit at the root of the domain

Everything in it uses relative paths, so images and styles load no matter
which folder the site ends up in. That was the GitHub Pages problem: the
old build looked for images at /images/..., which on GitHub Pages points at
username.github.io/images/... instead of username.github.io/my-repo/images/...

GITHUB PAGES — WHAT TO DO
-------------------------
1. Put the CONTENTS of this folder in the repo (index.html at the top level
   of the repo, or inside a /docs folder).
2. Repo → Settings → Pages → Source: "Deploy from a branch",
   branch: main, folder: / (root) or /docs to match step 1.
3. Wait ~1 minute, then open the URL GitHub shows.

404.html is included on purpose — it is a copy of index.html and is what
makes yoursite/studio work when someone refreshes on that page. Keep it.

Do not double-click index.html to preview it. Browsers block that for modern
sites and you get a blank page. Use Live Server, or push it to Pages.

LOCAL PREVIEW
-------------
Unzip, open the folder in VS Code, right-click index.html →
"Open with Live Server".
