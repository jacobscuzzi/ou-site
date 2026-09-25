# OUP frontend

Application publique servie sur `oup.wtf` : une requête en langage naturel, une liste de bars
classés, une carte. Bun + Vite + React, TypeScript strict, CSS simple avec des variables
(`src/styles/tokens.css`). Le contrat de l'API est dans `docs/specs/search-api.md`, les types
dans `src/api/types.ts` le suivent à l'identique.

## Dev local

```sh
bun install
bun run dev        # mock MSW, aucun backend requis
```

`bun run build` vérifie les types puis écrit `dist/`. `bun run preview` sert ce build.

## Mock ou vrai backend

Un seul interrupteur, `VITE_USE_MOCK`, inliné dans le bundle au build :

| Fichier           | Chargé par          | Valeur                             |
|-------------------|---------------------|------------------------------------|
| `.env`            | `dev`, `preview`    | `true` : MSW sert `src/mocks/`     |
| `.env.production` | `build`             | `false` : requêtes vers `/api/*`   |

`VITE_API_URL` vide veut dire même origine ; en prod Caddy proxifie `/api/*` vers le Go.
Renseigner une URL absolue seulement si le front est servi ailleurs que le backend.

- Dev contre la stack locale (`infra/`, Caddy sur `:8000`) : `VITE_USE_MOCK=false bun run dev`.
  Le serveur Vite proxifie `/api` vers `http://localhost:8000`, ou vers `API_PROXY` si défini.
- Build de démo sans backend : `VITE_USE_MOCK=true bun run build`. Le mock tourne aussi en
  production, avec un repli en page si le service worker ne contrôle pas l'onglet.

Le mock (`src/mocks/`) répond à `/api/search` et `/api/search/:id/more` avec les bars de
`bars.json`, classés par thème selon les mots de la requête (`themes.json`), 5 puis 10 par page.

## Build Docker

Le conteneur construit `dist/` puis le copie dans le volume `static` (`OUT_DIR=app`) et
s'arrête ; Caddy sert le résultat. Rien n'est lu au runtime.
