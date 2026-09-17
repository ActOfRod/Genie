<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Genie project notes

- Rocket Money–style household finance app. Next.js static export, deployed to GitHub Pages by `.github/workflows/publish-pages.yml` on every push to `main` (live at https://actofrod.github.io/Genie/).
- Storage and auth are **Supabase** — project ref `ylwmselditykrhzfzrxx` (name: GenieSpend). See `supabase/README.md` for schema, RLS, CLI linking (`supabase link --project-ref ylwmselditykrhzfzrxx`), and auth notes. Migrations are in `supabase/migrations/` and have already been applied.
- App login credentials are intentionally not recorded in this repo.
- Run `npm test` (Vitest) and `npm run lint` before pushing. `GITHUB_PAGES=true npm run build` reproduces the Pages build locally.
