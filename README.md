# Horizons

**Une PWA mobile-first pour gérer vos objectifs — court, moyen et long terme. 100% hors-ligne, 100% privée, 0 backend.**

Horizons stocke tout sur votre appareil (localStorage) et fonctionne parfaitement en mode avion. Aucune donnée ne quitte jamais votre téléphone.

---

## ✨ Fonctionnalités

- **3 horizons** : objectifs **Court** (< 3 mois), **Moyen** (3-12 mois) et **Long** terme (> 1 an)
- **Sous-tâches** : chaque objectif peut être découpé en tâches cochant une progression
- **Statuts** : À faire → En cours → Terminé (avancement auto selon les sous-tâches cochées)
- **Échéances** : date limite optionnelle, rappels « aujourd'hui », « demain », retards signalés
- **Accueil** : vue d'ensemble, objectifs en cours, échéances imminentes
- **Stats** : taux d'accomplissement global et par horizon, répartition par statut, sous-tâches
- **Mode sombre** : suit le système, réglable (Système / Clair / Sombre), sans flash au chargement
- **Import / Export JSON** : sauvegarde et restauration de vos données en un fichier
- **Reset complet** : efface toutes les données locales (avec confirmation)
- **PWA installable** : ajout à l'écran d'accueil, icônes adaptatives, mise à jour automatique

## 🏗️ Architecture

| Outil | Rôle |
| --- | --- |
| **React 19 + Vite 8** | Interface, développement et build |
| **Tailwind CSS v4** | Design system (design tokens, mode sombre par classe) |
| **Zustand 5** | État global (sélecteurs ciblés = re-rendus minimaux) |
| **localStorage** | Persistance exclusive, clé versionnée `horizons:goals:v1` |
| **vite-plugin-pwa** | Manifest + Service Worker (Workbox), navigateFallback |

### Points clés

- **`src/store/persistence.js`** — couche de persistance : load/save sécurisé (JSON corrompu → fallback sans crash), écritures **debouncées** (250 ms) pour ne pas bloquer le thread principal, flush au `beforeunload`, **synchronisation entre onglets** via l'événement `storage`.
- **`src/store/goalsStore.js`** — store Zustand : CRUD, progression déduite des sous-tâches, normalisation des données au chargement, statut auto.
- **`src/hooks/useTheme.js`** — préférence de thème persistée (`system`/`light`/`dark`) + script anti-flash dans `index.html`.
- **`src/lib/io.js`** — import/export JSON (fichier `horizons-export-AAAA-MM-JJ.json`).

### Structure

```
src/
├── components/
│   ├── layout/     BottomNav, AppShell
│   ├── goals/      GoalTabs, GoalCard, GoalList, GoalForm
│   ├── stats/      Ring, StatsBars
│   └── ui/         Button, Checkbox, Sheet, EmptyState, ...
├── hooks/          useTheme, useInstallPrompt
├── lib/            constants, format (dates fr), io
├── pages/          Home, Horizons, Stats, Settings
└── store/          goalsStore, persistence
```

## 🚀 Lancer le projet

```bash
npm install       # installer les dépendances
npm run dev       # développement (HMR)
npm run build     # build production + génération PWA (dist/)
npm run preview   # tester la PWA (Service Worker actif)
npm run lint      # oxlint
```

> **Tester hors-ligne** : `npm run build && npm run preview`, ouvrir l'app une fois, couper le réseau, recharger → tout fonctionne.

## 🌐 GitHub Pages

Le déploiement est **automatisé** par un workflow GitHub Actions (`.github/workflows/deploy.yml`). Chaque push sur `main` reconstruit l'app et publie `dist/` sur Pages.

### Configuration une fois (réglages du dépôt)

1. **Settings → Pages** → Source : **GitHub Actions**
2. Le workflow s'occupe du reste → l'app est en ligne à
   `https://<votre-compte>.github.io/Horizons/`

Le build utilise `base: './'` : tous les chemins (assets, manifest, Service Worker) sont relatifs, l'app fonctionne sous un sous-répertoire sans réglage supplémentaire. Un `404.html` renvoie les routes inconnues vers l'app (fallback SPA).

## 🔒 Confidentialité

- Aucune requête réseau : l'app **ne quitte jamais l'appareil** hors services statiques d'hébergement.
- Les données vivent dans `localStorage` (≈5 Mo de texte — des dizaines de milliers d'objectifs).
- Exportez régulièrement via **Réglages → Exporter** pour sauvegarder vos données.

## 📄 Licence

Projet personnel — voir le contenu du dépôt.