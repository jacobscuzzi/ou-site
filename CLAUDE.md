# où frontend

Mobile-first web app that recommends bars in Paris. Source of the site served at oup.wtf.
Bun, Vite, React, TypeScript strict, MapLibre, MSW mock.

The API contract lives in the backend repo (`infra-oup`, `docs/specs/search-api.md`).
`src/api/types.ts` must match it exactly. Never change a contract from here without being asked.

## Rules
- Plain CSS with variables, no Tailwind, no component library, no state library.
- Every colour, radius, spacing, blur and shadow value comes from a token in
  `src/styles/tokens.css`. No hard-coded values in components.
- Accent is `--pink` (#D3227A). Use it sparingly: primary actions, prices, map pins, active states.
- Layout is a centred column, max-width 430px on phones and 1120px from 768px up. Design target is 390x844.
- Components never import mock data directly. All data goes through `src/api/client.ts`.
  `VITE_USE_MOCK=true` serves the MSW mock; `false` talks to `VITE_API_URL`.
- Small components, English in code, almost no comments, no emoji anywhere.

## Deploy
The VPS clones this repo to `/srv/ou-site`. `infra-oup/hosticloud/infra/scripts/deploy.sh`
pulls it and the compose `frontend` service builds the Dockerfile here into the `static/app` volume.

## Commits
Short, lowercase, prefixed by area (`frontend:`), one line. Never mention Claude, Claude Code,
Anthropic or AI. No trailers or attribution lines. Commit locally; the user pushes.
