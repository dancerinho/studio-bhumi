# Studio Bhumi

Plain static HTML/CSS/JavaScript with a dependency-free Node build. Node version is pinned to 24.19.0. `src/` is authored source; `dist/` is generated, ignored by Git, and must never be edited or committed.

- Page templates: `src/pages/`; shared static menu/footer/social/price markup: `src/partials/`.
- Browser interactions: `src/assets/site.js`, `editoriale.js`, `percorso-live.js`, `map-consent.js`; responsive styling: existing CSS in `src/assets/`.
- Only the five approved content areas belong in `content/` and `.pages.yml`: prices, studio opening ranges, events/news, home notice, global contacts/links. Do not expose layout, classes, templates, code, policies or instructor photos to CMS editors.
- Run `npm run build`, `npm run check`, `npm test`; `npm run dev` builds then serves. No dependency installation is required.
- Preserve the current design, CSS, original logo/photos, 16 pages, existing URLs, metadata and Cookie redirect. No invented events, prices or testimonials. Prices/opening ranges/legal policies need owner confirmation before launch.
- Keep the fixed top navigation, existing desktop links and hamburger behavior, and booking CTA on mobile. Shared content must be in built HTML for SEO, never fetched by client scripts.
- Escape every CMS string, validate URLs, and fail the build clearly on malformed/missing data. Revalidate CMS keys against the official docs before adding options.
- Use local fonts. No third-party network request on initial load, analytics or cookies. Google Maps loads only after an explicit visitor action. Browser geolocation is requested only on a directions click; coordinates are sent to Google Maps after browser permission and are not stored. The short informational map note must remain.
- CMS uploads: JPG/JPEG/WebP static, at most 600000 bytes and 1600×1000 pixels; only `content/uploads/` is exposed to editors. Never replace named instructor photos with stock people.
- 55 minutes and maximum 5 people remain outside CMS, in `src/partials/price-gruppo.html`, `src/pages/orari.html`, `src/pages/studio.html`.
- `scripts/pages.mjs` drives robots/sitemap. Do not add noindex or robots headers. Do not add `_redirects` until the owner supplies historic URLs.
- New production: Cloudflare Pages Git integration, `npm run build`, output `dist`, pinned Node, owner-configured `SITE_URL`. No Direct Upload automation or secrets in Git.
- Work only on `codex/pages-cms` during this migration; do not touch main, push, deploy or merge without an explicit later request. Keep commits small and separate; fonts/maps changes must be separate from CMS migration.
- Do not touch or stage the untracked root files `index.html`, `script.js`, `styles.css`.
- `.openai/hosting.json` identifies the existing private Sites project and points to built `dist`. Preserve it; a clean checkout needs a build before any Sites preview can read that output. Do not create another Sites project. Never commit credentials.