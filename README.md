# OUP frontend

Application publique servie sur `oup.wtf` : une carte de Paris où chaque point est un bar, et une
recherche en langage naturel qui numérote les bars qui correspondent. Bun + Vite + React,
TypeScript strict, MapLibre GL, CSS simple avec des variables (`src/styles/tokens.css`). Le contrat
de l'API est dans `docs/specs/search-api.md` du dépôt `infra-oup`, les types dans
`src/api/types.ts` le suivent à l'identique.

## Ce que montre l'application

L'écran principal est la carte. Elle affiche un point par bar de la base. Les bars les mieux
notés sont mis en avant. Un bouton permet de se localiser.

Deux états, sur la même carte :

- **Explorer** (aucune recherche) : la feuille liste les bars les mieux notés dans la zone visible.
  Quatre filtres (ouvert maintenant, terrasse, danse, bière pas chère) restreignent la liste et les
  points.
- **Résultats** (après une recherche) : les résultats sont numérotés sur la carte et listés dans la
  feuille. Charger plus ajoute des pages. En explorer, une ligne de la liste ou un point de la carte ouvre l'aperçu du bar, avec un bouton retour ; en résultats, une carte de la liste sélectionne le bar sans ouvrir d'aperçu.

Sur téléphone, la feuille est une fenêtre en bas d'écran, à trois hauteurs (réduite, mi-hauteur,
pleine). À partir de 768px, c'est un panneau à gauche.

### Look de la carte

Le fond est CARTO Voyager, recoloré au chargement avec les tokens `--map-*` (`src/map/theme.ts`) ; le métro
vient de `public/metro.json` (Île-de-France Mobilités, open data), chargé à la première activation par
`src/map/metro.ts` et coupé par un bouton rond, dont le choix est gardé dans `localStorage`. Les meilleurs bars
sont des bulles photo qui respirent (`src/map/bubble.ts`) : numérotées en résultats, six au plus en explorer.

### Repli sans carte

Si le navigateur n'a pas WebGL (la création de la carte échoue), si le style de la carte ne charge pas
dans les 10 secondes, ou si le code de la carte ne se charge pas, l'application passe en mode sans carte : page d'accueil avec des suggestions de recherche et
liste de résultats. La recherche reste disponible, les bars ne sont pas chargés pour la carte.

Les bars de la carte sont chargés au démarrage. En cas d'échec (réponse vide ou erreur), l'appli
réessaie jusqu'à six fois, toutes les 5 secondes, puis propose un bouton « réessayer » dans la feuille.

### Retiré

Avec le passage à la carte d'entrée, ont disparu : l'ancienne carte en fenêtre (`MapView`), la mini-carte
(`MiniMap`), l'image de fond `public/map-paris.jpg` et le bloc d'accueil du mode carte.

## Dev local

```sh
bun install
bun run dev        # mock MSW, aucun backend requis
```

`bun run build` vérifie les types (`tsc --noEmit`) puis écrit `dist/`. `bun run preview` sert ce build.

## Mock ou vrai backend

Un seul interrupteur, `VITE_USE_MOCK`, inliné dans le bundle au build :

| Fichier           | Chargé par          | Valeur                             |
|-------------------|---------------------|------------------------------------|
| `.env`            | `dev`, `preview`    | `true` : MSW sert `src/mocks/`     |
| `.env.production` | `build`             | `false` : requêtes vers `/api/*`   |

`VITE_API_URL` vide veut dire même origine ; en prod Caddy proxifie `/api/*` vers le Go.
Renseigner une URL absolue seulement si le front est servi ailleurs que le backend.

Les quatre appels passent par `src/api/client.ts` :

- `searchBars` : `GET /api/search?q=`
- `moreBars` : `GET /api/search/:id/more?page=`
- `fetchBars` : `GET /api/bars` (points de la carte)
- `fetchBar` : `GET /api/bars/:id` (fiche détaillée)

- Dev contre la stack locale (`infra/`, Caddy sur `:8000`) : `VITE_USE_MOCK=false bun run dev`.
  Le serveur Vite proxifie `/api` vers `http://localhost:8000`, ou vers `API_PROXY` si défini.
- Build de démo sans backend : `VITE_USE_MOCK=true bun run build`. Le mock tourne aussi en
  production, avec un repli en page si le service worker ne contrôle pas l'onglet.

Le mock (`src/mocks/`) répond aux quatre appels à partir de `bars.json`. La recherche classe les bars
par thème selon les mots de la requête (`themes.json`) : 5 résultats à la première page, puis 10 par page.

## Build Docker

Le Dockerfile fait `bun install --frozen-lockfile` puis `bun run build`, et l'étape finale copie
`dist/` dans `/dist` avant de lancer `publish.sh`. Le script copie ce dossier dans le volume `static`
(`/out/$OUT_DIR`, avec `OUT_DIR=app`) et s'arrête ; Caddy sert le résultat. Rien n'est lu au runtime.
