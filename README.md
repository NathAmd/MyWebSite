# Styloxis

Static personal/professional site for styloxis.be.

## Structure

- `index.html` — main one-page site: positioning, professional skills, technical stack, engineering practices, CV preview and contact.
- `cv.html` — structured, printable CV.
- `project.html` — bilingual technical skills page kept at its legacy URL, with noindex preserved.
- `game/mmo/index.html` — noindexed archived page that redirects attention back to the main site.
- `css/` — global, homepage and CV styles.
- `script/main.js` — small progressive enhancement script for reveal animations and header state.
- `sitemap.xml` — indexed public URLs only.
- `robots.txt` — sitemap discovery.

Pages that are meant to be shared directly but not referenced from the main navigation should use:

```html
<meta name="robots" content="noindex, follow" />
```

Do not rely on `robots.txt` alone for private or non-indexed pages. Use real protection for genuinely private content.