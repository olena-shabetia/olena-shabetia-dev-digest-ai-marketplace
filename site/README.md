# Catalog site

React + Vite app published to GitHub Pages. Spec: [../docs/SITE-SPEC.md](../docs/SITE-SPEC.md). Design mockups: [design/](design/).

```bash
cd site
npm ci
npm run dev        # builds the index, then starts Vite
npm test           # search and install-builder unit tests
npm run build      # index + type-check + production bundle in dist/
```

- `../scripts/build-index.mjs` walks `plugins/*` and writes `public/index.json` and `public/feed.xml`. It exits non-zero on a malformed plugin. Use `--root <dir> --out <dir>` to point it at another tree.
- `src/search.ts` holds query parsing (stop words, type words) and MiniSearch; `src/install.ts` resolves dependencies for the install builder. Both are covered by tests.
- Routing is hash-based (`#/...`) because Pages has no SPA fallback. The app makes no requests to third-party origins: fonts are bundled, images in markdown are dropped.
- `pages.yml` copies `design/` into `dist/` after the build; Vite itself never touches it.
