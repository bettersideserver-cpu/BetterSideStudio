BETTERSIDE — WEBSITE UPLOAD FOLDER
==================================

This folder IS the finished website. No compiling, no build step.

WHAT TO UPLOAD
--------------
Upload the CONTENTS of this folder (index.html, assets/, images/, etc.)
into your host's web root — usually a folder called public_html/ or www/.
Do NOT upload the folder itself as a subfolder, or your site will end up
at yoursite.com/betterside/ instead of yoursite.com.

Turn on "show hidden files" in your FTP / File Manager so that the
.htaccess file gets uploaded too. It matters (see below).

IMPORTANT — DO NOT JUST DOUBLE-CLICK index.html
-----------------------------------------------
Opening index.html straight from your computer (a file:/// address) will
always show a blank page. That is normal for modern websites — the browser
blocks the files from loading over file:///. It is not a broken build.

To view it on your own machine, use the separate zip named
"betterside-local-preview" with VS Code Live Server. This folder here is
for the real host.

DEEP LINKS (/studio)
--------------------
The site has two pages: / and /studio. On most hosts a visitor who reloads
directly on /studio gets a 404 unless the server is told to serve
index.html for unknown paths. Included here:

  .htaccess    -> Apache / cPanel / Hostinger / GoDaddy. Automatic.
  _redirects   -> Netlify. Automatic.

Vercel and Cloudflare Pages handle this on their own — nothing to do.
Nginx: add   try_files $uri /index.html;   to the location block.

WORDPRESS / WIX / SQUARESPACE
-----------------------------
This is a standalone site, not a theme or plugin. You cannot paste it into
WordPress. Either point your domain at this site instead, or host it on a
subdomain such as studio.yourdomain.com.

EASIEST OPTION
--------------
Runable can publish this site and attach your domain directly from the
platform — no zip, no FTP, and updates go live in one click.
