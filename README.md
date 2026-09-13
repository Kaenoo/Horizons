# Horizons

**Une PWA mobile-first pour gérer vos objectifs — court, moyen et long terme. 100% hors-ligne, 100% privée, 0 backend.**

Horizons stocke tout sur votre appareil (localStorage) et fonctionne parfaitement en mode avion. Aucune donnée ne quitte jamais votre téléphone.

---

## ✨ Fonctionnalités

- **3 horizons** : objectifs **Court** (< 3 mois), **Moyen** (3-12 mois) et **Long** terme (> 1 an)
- **Sous-tâches** : chaque objectif peut être découpé en tâches cochant une progression
- **Statuts** : À faire → En cours → Terminé (avancement auto selon les sous-tâches cochées)
- **Échéances** : date limite optionnelle, rappels « aujourd'hui », « demain », retards signalés
- **Rappels** : un rappel par objectif (date + heure), récurrences Aucune / Jour / Semaine / Mois / Année, toast intra-app, notifications système tant que l'app est ouverte
- **Notifications push (optionnel)** : via Supabase, rappels livrés même app fermée — dont iPhone installé (iOS 16.4+, PWA écran d'accueil)
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
- **`src/store/goalsStore.js`** — store Zustand : CRUD, progression déduite des sous-tâches, normalisation des données au chargement, statut auto, rappel (`reminder`) normalisé et avancement de la prochaine occurrence.
- **`src/lib/recurrence.js`** — calcul des récurrences (clamp de fin de mois : 31 janv. → 28/29 févr.) et avancement vers la prochaine occurrence.
- **`src/hooks/useReminderScheduler.js`** — moteur local : scan ~15 s, loi `.showNotification()` + toast intra-app, puis `advanceReminder`. Saut des notifications OS quand le push Supabase est actif (anti-doublon).
- **`src/lib/push.js` + `src/hooks/usePushReminders.js`** — couche push optionnelle (REST pur Supabase, aucune dépendance) : abonnement Web Push (`pushManager.subscribe`, VAPID), sync debouncée des rappels.
- **`src/sw.js`** — Service Worker (Workbox, mode `injectManifest`) : pré-cache + handlers `push` → `showNotification` et `notificationclick` → focus/ouvrir l'app.
- **`src/hooks/useTheme.js`** — préférence de thème persistée (`system`/`light`/`dark`) + script anti-flash dans `index.html`.
- **`src/lib/io.js`** — import/export JSON (fichier `horizons-export-AAAA-MM-JJ.json`).

### Structure

```
src/
├── components/
│   ├── layout/     BottomNav, AppShell
│   ├── goals/      GoalTabs, GoalCard, GoalList, GoalForm
│   ├── stats/      Ring, StatsBars
│   └── ui/         Button, Checkbox, Sheet, EmptyState, Switch, ReminderToast, ...
├── hooks/          useTheme, useInstallPrompt, useReminderScheduler, usePushReminders
├── lib/            constants, format (dates fr), io, recurrence, notify, push
├── pages/          Home, Horizons, Stats, Settings
└── store/          goalsStore, persistence

supabase/           (optionnel — push)
├── migrations/     tables push_subscriptions + reminder_jobs (RLS fermée)
└── functions/      push-subscribe, push-unsubscribe, push-upsert-jobs, send-reminders
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

## 🔔 Notifications push (optionnel, Supabase)

Sans configuration, l'app garde son comportement **100% hors-ligne** (notification
système uniquement quand l'app est ouverte sur Android/desktop). Pour des rappels livrés **app fermée**
(y compris sur **iPhone**, app installée sur l'écran d'accueil, iOS 16.4+) :

1. **Projet** : créez un projet gratuit sur [supabase.com](https://supabase.com).
2. **Déploiement** :
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <votre-ref>     # dans supabase/
   supabase db push                                    # migration + tables
   supabase functions deploy push-subscribe push-unsubscribe push-upsert-jobs send-reminders
   ```
3. **Secrets** (jamais dans le client) :
   ```bash
   npx web-push generate-vapid-keys                    # génère publier + privée
   supabase secrets set VAPID_PUBLIC_KEY=<publique>
   supabase secrets set VAPID_PRIVATE_KEY=<privée>
   supabase secrets set VAPID_SUBJECT=mailto:votre@email.fr
   ```
4. **Cron** (toutes les minutes, gratuit) — dans le SQL Editor :
   ```sql
   select cron.schedule(
     'horizons-send-reminders', '* * * * *',
     $$
     select net.http_post(
       url := 'https://<votre-ref>.supabase.co/functions/v1/send-reminders',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
       ),
       body := '{}'
     );
     $$
   );
   ```
5. **Dans l'app** (Réglages → Notifications) : renseignez l'**URL du projet**, la **clé anon** et la
   **clé publique VAPID**, puis « Activer les notifications ».

> iPhone : iOS 16.4+ et app **ajoutée à l'écran d'accueil** (PWA standalone), puis ouverte depuis son
> icône. Le contenu des rappels (titres + horaires) transite alors par Supabase vers le service de
> push Apple. Sans cette option, rien ne quitte l'appareil.
>
> Changer la clé VAPID : désactivez puis réactivez les notifications dans Réglages — l'app recrée
> alors l'abonnement (et purge l'ancien sur Supabase). Si rien n'arrive, vérifiez le SQL cron
> (`horizons-send-reminders`), les secrets `VAPID_*`, et que `send-reminders` répond `{"ok":true}`.

## 🔒 Confidentialité

- Aucune requête réseau : l'app **ne quitte jamais l'appareil** hors services statiques d'hébergement.
- Les données vivent dans `localStorage` (≈5 Mo de texte — des dizaines de milliers d'objectifs).
- Exportez régulièrement via **Réglages → Exporter** pour sauvegarder vos données.

## 📄 Licence

Projet personnel — voir le contenu du dépôt.