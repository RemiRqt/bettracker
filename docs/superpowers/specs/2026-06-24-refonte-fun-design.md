# Refonte "fun" de BetTracker — Design

Date : 2026-06-24

## Objectif

Rendre l'app plus sympathique et vivante, avec des animations, **sans changer le
code couleur** (dark slate + emerald). On porte les *mécaniques* ludiques de
l'app "Olympiades de Lulu" (néo-brutalisme léger) dans l'identité BetTracker
existante (Tailwind v4 + shadcn). On en profite pour repenser le graphe d'accueil.

## Principe directeur

Garder l'ADN BetTracker. Aucune nouvelle couleur de marque. Pas de lib
d'animation lourde (pas de framer-motion) : CSS + `requestAnimationFrame`, comme
Olympiades. Tout respecte `prefers-reduced-motion`.

## 1. Langage visuel (mécaniques portées)

- **Ombres dures décalées** — utilitaire `shadow-hard` (`Xpx Ypx 0 <couleur>`),
  en emerald/slate, sur les cartes et boutons "héros". Effet sticker/affiche.
- **Boutons tactiles** — `active:scale-95` + ombre physique `0 4px 0` qui
  s'enfonce au tap.
- **Légères rotations** — `rotate-[-1.5deg]` sur les éléments de célébration
  (badge "Gagné", médailles). Pas ailleurs.
- **Bordures marquées** — réservées aux cartes héros, pas partout.

À traduire en tokens/utilitaires Tailwind (theme `globals.css`), pas en copie du
CSS vanilla d'Olympiades.

## 2. Animations

- **Compteurs animés** — composant `RollingNumber` (count-up easeOutCubic ~600ms,
  garde la valeur si `prefers-reduced-motion`). Porté d'Olympiades. Appliqué aux
  stats du dashboard (capital, ROI, gains, etc.).
- **Célébrations** — confetti léger + pop/scale **uniquement quand un pari est
  validé "gagné"** (pas sur série gagnée, pas sur palier capital). Déclenché à la
  validation du résultat.
- **Graphe vivant** — tracé animé à l'ouverture, transition fluide entre périodes.
- **Micro-interactions** — press tactile sur boutons/cartes/tabs ; transitions de
  page (déjà `route-transition.tsx`).

## 3. Graphe d'accueil (#2)

### Périodes
`1M / 3M / Tout` — suppression du `1S` (1 semaine).

### Courbes
- **Dépôts** (basse) = cumul des dépôts **bruts** (ne monte qu'aux dépôts).
- **Valeur** (haute) = `capital en cours + encaissé cumulé`
  = `dépôts bruts + bénéfice total (paris + freebets)`.
  → Un retrait **ne fait plus chuter** la courbe (l'argent passe de "en compte"
  à "encaissé", total inchangé).
- **Zone** entre les deux = bénéfice total : **vert** si Valeur ≥ Dépôts, **rouge**
  sinon. C'est la lecture directe de "combien j'ai gagné en tout".

### Détails
- Marqueurs dépôt/retrait en points sur la timeline.
- Chip **"Encaissé : X€"** au-dessus du graphe (= retraits cumulés à date).
- Tooltip enrichi : capital en compte / encaissé / bénéfice.
- Reste lazy-loadé (acquis perf #4).

### Modèle de données (`getDashboardStats` → `capitalEvolution`)

Dans la timeline, suivre par jour :
- `runningDeposits` — cumul dépôts bruts
- `runningWithdrawals` — cumul retraits (= encaissé)
- `runningCapital` — bankroll = dépôts − retraits + gains paris + gains freebets

Snapshot quotidien :
- `deposits = runningDeposits`
- `encaisse = runningWithdrawals`
- `capital  = runningCapital`
- `valeur   = runningCapital + runningWithdrawals` (= `deposits + gains`)

`profit = valeur − deposits`. Couleur de la zone selon le signe du `profit` du
**dernier point de la période affichée** (zone entière d'une seule couleur :
vert si on finit gagnant, rouge sinon). Évite un dégradé par segment, complexe
en recharts.

## 4. Périmètre & séquencement

Application progressive. **Dashboard en premier** (vitrine) :
1. Graphe revu (courbes Valeur/Dépôts + zone + marqueurs + chip encaissé).
2. `RollingNumber` sur les stat cards.
3. Style des stat cards (ombres dures, press si cliquable).

Puis propagation : séries → freebets → profil (mêmes utilitaires + confetti sur
validation gagnante côté séries).

## Contraintes techniques

- Pas de nouvelle dépendance lourde. Confetti = implémentation légère CSS/RAF.
- Respect `prefers-reduced-motion` partout.
- Limites du repo : fichiers ≤ 300 lignes, composants ≤ 200, fonctions ≤ 30.
- Graphe reste un composant client lazy-loadé ; data calculée côté serveur.

## Hors périmètre

- Pas de refonte de la palette / passage en thème clair.
- Pas de célébration sur série gagnée ni paliers capital (pour l'instant).
- Pas de migration DB (le graphe se calcule sur les données existantes).
