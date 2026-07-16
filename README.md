# Everdeck — landing page

Dark, premium landing page for **Everdeck**, an autonomous LLM-run SaaS platform
that operates like an entire founding team: live market analysis, fresh
business ideas daily, laid out as a color-coded mind map / idea deck.

Built with **React + Vite + TypeScript + Tailwind CSS + Framer Motion +
shadcn/ui**. The full design spec is in [SPEC.md](./SPEC.md).

## Commands

```bash
npm install
npm run dev        # dev server on http://localhost:5199
npm run build      # typecheck + production build
npm run assets     # regenerate PNG assets (logo, dashboard mock, quote, avatar)
node scripts/capture.mjs <outDir>   # headless verification screenshots
```

## Structure

- `src/components/sections/` — Hero (navbar, parallax video + dashboard),
  IdeaEngine (feature cards), IdeaMindMap (animated SVG idea deck),
  Testimonial (scroll-driven word reveal), FinalCta
- `src/components/ui/` — shadcn/ui primitives (Button, Card)
- `src/index.css` — HSL theme tokens (dark by default) + liquid-glass CSS
- `scripts/generate-assets.mjs` — renders the static PNGs from authored SVG
  via sharp

## Notes

- Fonts: Inter (400–700) and Instrument Serif (400 + italic) via Fontsource.
- The hero background video is loaded from an external CDN URL, anchored to
  the bottom of the fold at natural scale. The dashboard is a
  transparent-background PNG inside a CSS glass panel (`bg-black/45` +
  `backdrop-blur`) so the video shows through, cropped by the fold.
- Mind-map node centering is done through Framer Motion `x`/`y` motion values
  (not Tailwind translate classes) so it survives the animated `scale`.
