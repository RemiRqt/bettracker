# Refonte design v2 — feedback Rémi (à coder d'un coup)

Pass de feedback page par page. **On collecte tout ici, puis implémentation groupée** (pas de deploy par page cette fois).

## Global — Navbar (bottom nav mobile)
- Bottom nav en **floating** : détachée des bords, **coins arrondis**, look moderne (pill flottante + ombre/blur).
- **Indicateur de fond actif qui se déplace** (slide) vers l'onglet de la page active lors de la navigation (pill emerald animée en translateX, sans lib lourde).
- Garder les 5 entrées actuelles. Header desktop : inchangé pour l'instant.

## Global — Modals / popups
- **Revoir le style des modals** (DialogContent) : look popup plus moderne et à la charte, cohérent sur toutes les dialogs (créer équipe, créer pari, nouvelle série, éditer pari, freebet…). Coins arrondis, bordure/accent charte, padding propre.
- **Référence de style** = le formulaire **"placer un pari freebet"** (FreebetBetForm). Reprendre son style pour TOUS les popups de saisie.

## Global — Boutons (ombre)
- Étendre l'**ombre sticker** à **tous** les boutons d'action, pas seulement `bg-primary/secondary/destructive`. Notamment les boutons amber ("Placer le pari", "Ajouter" freebet, etc.) → ombre **amber assortie** (cf. stats card freebet) plutôt qu'emerald.

## Global — Type de pari "Autre" (texte libre)
- Ajouter un type de pari **"Autre"** qui ouvre un **champ texte libre** (libellé custom), en plus de Victoire/Défaite/Buteur.
- À la **création d'une équipe** (dialog Équipes) **et** à la création de série (`series-form`, modal Paris) pour cohérence.
- Stockage : le libellé custom va dans `bet_type` (déjà affiché en fallback `BET_TYPES[x] ?? x`) → pas de migration DB nécessaire a priori.

## Global — RollingNumber
- Doit **se relancer (count-up depuis 0) à chaque chargement / navigation** de page (actuellement n'anime que sur changement de valeur). Respecter `prefers-reduced-motion`.

## Dashboard
- **Bug** : l'ombre `shadow-hard` de la hero card est **coupée à droite** par le padding/overflow de la page → à corriger (donner de la place à l'ombre, ne pas la clipper).
- **Les 4 lignes de tuiles** (Total Mise/Gains/Rendement · Mise en cours/Gains potentiels · En cours/Gagné/Perdu · Cote moy/Mise moy) → **dans un expand repliable "Plus de stats"**. Par défaut : hero + graphe seulement. (Implique de rendre la page scrollable quand l'expand est ouvert + donner une hauteur fixe au graphe.)
- **Graphe** : OK, inchangé.

## Équipes (/series)
- **Recherche** → repliée derrière une **icône loupe** placée **à gauche du bouton +** (header). Clic loupe → révèle le champ de recherche. Plus de barre toujours visible.
- **Sélecteur de sport** → retiré de l'expand, **déplacé sur le logo** : clic sur le logo/icône de l'équipe ouvre une **modal de modification** (contenant le sélecteur de sport). → créer une modal "Modifier l'équipe".
- **Bouton "Nouvelle série"** → déplacé **en haut de l'expand**, affiché si la **dernière série n'est plus en cours** (= pas de série active).
- **Liste des séries dans l'expand** : n'afficher que **la série la plus récente** par défaut + un expand **"voir plus"** pour révéler les séries plus anciennes.

## Freebets
- **Bouton d'ajout** : carré comme les autres (taille `h-9 w-9` cohérente).
- **Formulaire "placer un pari freebet"** : ne plus l'afficher inline → un **bouton qui ouvre le formulaire dans un popup** (dialog).
- Ce **style de formulaire** = référence générale pour les popups de saisie (cf. Global — Modals).
- **Ombre sticker** sur le bouton "Placer le pari" et les autres boutons (amber → ombre amber).

## Paris (/series/new)
- RAS de spécifique (feedback transverse seulement : modals, type "Autre").

## Calendar
- **Header** : enlever le **compteur de matchs**. Bouton **refresh** → style carré comme les boutons d'ajout (`h-9 w-9 rounded-lg`). **Sortir l'icône + le mot "Calendrier" de la card** → titre `h1` simple en haut (cohérent avec les autres pages, pas de header en card). Garder la ligne "dernière mise à jour" en petit/muted.
- **Logo championnat** (league) : plus **grand** + **fond** (tuile arrondie) pour le rendre visible.
- **Centrer les dates** (headers de groupe) sur la page.
- **FixtureCard équipes** : logos clubs plus **grands**, **nom de l'équipe en dessous** (layout vertical : logo au-dessus / nom dessous ; 2 colonnes équipe + "VS" au milieu).

## Profile
- **Supprimer la carte balance** (hero). Mettre **dépôt + retrait** (et solde net) en **compact sous le header profil** (plus de grande card).
- **Carte notification** : améliorer le style + **retirer les textes descriptifs** ("recevoir chaque jour…", etc.).
- **"Équipes suivies" → "Mes équipes"** : afficher par défaut **les favoris**, + **expand "voir plus"** pour les autres. Bouton **+** (carré) **à droite** du titre "Mes équipes" (pour ajouter une équipe).
- **Transaction** : sortir le formulaire inline → **popup** (dialog) via un bouton **"Ajouter une transaction"** (style popup de référence).

## Series detail (/series/[id])
- _(à remplir)_
