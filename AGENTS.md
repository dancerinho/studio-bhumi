# Studio Bhumi

The site is plain static HTML, CSS and JavaScript. Edit `dist/` directly; it is authored source, not generated output. No framework or dependency installation is required.

- Shared header, hamburger menu, footer and directions: `dist/assets/site.js`.
- Shared responsive styling: `dist/assets/site.css`.
- Run `npm run dev` (Node 20+) and `npm run check`.
- Keep the fixed top navigation with three desktop links and a hamburger menu; preserve the booking CTA on mobile.
- Use the original logo and studio photographs in `dist/assets/`. Do not substitute stock people for named instructors.
- Prices, schedules and legal policies still need owner confirmation before a public launch. Do not invent current events, testimonials or prices.
- Geolocation is requested only on an explicit directions click and coordinates are sent to Google Maps with the visitor's consent.
- `.openai/hosting.json` identifies the existing private Sites project. Do not create another Sites project. Never commit credentials.
