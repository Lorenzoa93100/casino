# Casino Games — GitHub Pages

## Objectif
Site de jeux de casino éducatifs/ludiques, 100% statique, hébergé sur GitHub Pages.
URL finale : `https://lorenzoa93100.github.io/casino-games`

## Stack
- React 18 + Vite
- GitHub Pages (branche `gh-pages`)
- GitHub Actions pour le déploiement automatique au push sur `main`
- CSS-in-JS (styles inline dans les composants) — pas de Tailwind

## Structure
```
casino-games/
├── .github/workflows/deploy.yml   # CI/CD → gh-pages automatique
├── public/
├── src/
│   ├── games/
│   │   └── poker/PokerApp.jsx     # App poker complète
│   ├── App.jsx                    # Menu d'accueil + router
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js                 # base: '/casino-games/' obligatoire
└── package.json
```

## Commandes
```bash
npm run dev      # Développement local
npm run build    # Build de production → dist/
npm run preview  # Prévisualiser le build
```

## Design system
- Background : `#0a0a1a`
- Accent or : `#c9a227`
- Texte principal : `#e2e8f0`
- Texte secondaire : `#64748b`
- Surface : `#0f0f23`
- Bordures : `#1e1e3a`
- Fonts : DM Sans (corps) + DM Serif Display (titres) — Google Fonts

## Jeux
| Jeu | Statut | Fichier |
|-----|--------|---------|
| Poker | ✅ Disponible | `src/games/poker/PokerApp.jsx` |
| Blackjack | 🔜 À faire | `src/games/blackjack/BlackjackApp.jsx` |
| Autres | 🔜 À définir | — |

## Poker (fait)
4 onglets : Mains · Positions · Glossaire · Quiz
- 10 combinaisons avec cartes visuelles et probabilités
- 6 positions avec explication
- 15 termes de glossaire searchables
- 5 questions de quiz avec score

## Ajouter un nouveau jeu
1. Créer `src/games/<nom>/<Nom>App.jsx`
2. Ajouter l'entrée dans le tableau `GAMES` dans `src/App.jsx`
3. Changer `status: 'coming-soon'` en `status: 'available'`
4. Ajouter le `import` et le `case` dans `App.jsx`

## Déploiement
Le push sur `main` déclenche automatiquement le workflow GitHub Actions qui :
1. Build le projet (`npm run build`)
2. Pousse le dossier `dist/` sur la branche `gh-pages`

### Config GitHub (une seule fois)
Settings du repo → Pages → Source → **GitHub Actions**

## Contraintes
- Tout client-side : pas de fetch vers un serveur
- `base: '/casino-games/'` dans `vite.config.js` est critique pour GitHub Pages
- Scores/progression → `localStorage` si nécessaire plus tard
