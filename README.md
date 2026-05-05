# todate

Timeline web app for dated moments and ranges: tags, **school-year** scheduling, optional **Google Drive** backup, and **light/dark** themes. Data stays in the browser unless you export or sync.

**Live:** [irfan-f.github.io/todate](https://irfan-f.github.io/todate/) · **Repo:** [github.com/irfan-f/todate](https://github.com/irfan-f/todate)

## Stack

- React 19, TypeScript, Vite 7  
- Tailwind CSS 4 (`@tailwindcss/vite`)  
- Vitest + Testing Library for unit tests  
- Local-first storage with JSON export/import

## Run locally

```bash
npm install
npm run dev
```

Optional: load bundled sample data in dev (requires a `sampleData` module at the path used in `App.tsx`):

```bash
npm run dev:sample
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run dev:sample` | Dev with `VITE_SAMPLE_DATA=true` |
| `npm run build` | Typecheck + production build (`base: /todate/`) |
| `npm run preview` | Serve `dist/` |
| `npm run test` / `npm run test:run` | Vitest |
| `npm run lint` | ESLint |

## Deploy

Production builds use `base: '/todate/'` for GitHub Pages under the `/todate/` path.

## Backlog (ideas)

- Update time entry so it is not forced to be a full date; improve year handling  
- Improve dataset controls on small screens  
- Make Drive integration “full circle”  
- Birth date feature  
- Milestones checkbox (e.g. 1 yr / 2 yr life)  
- Multiselect  
- Easier delete flow for todate  
