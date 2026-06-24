# Page Styleguide — charte graphique vivante (gatée)

**Date** : 2026-06-24
**Route** : `/styleguide` (groupe `(app)`, gatée sur `ADMIN_EMAILS` = rranquet@gmail.com)
**But** : référence visuelle de toute la charte, données mockées, pour itérer le design écran par écran. Chaque élément porte un **numéro stable et visible** (`#NN`) → feedback ciblé (« modifie 42, augmente la police »).

## Architecture

```
src/app/(app)/styleguide/page.tsx        gate email (redirect("/") sinon) → StyleguideClient
src/components/styleguide/
  item.tsx              <Item id label hint> + <Section anchor n title> (wrappers numérotés)
  colors-section.tsx    1–26
  typography-section.tsx 30–37
  buttons-section.tsx   40–54
  badges-section.tsx    70–76
  cards-section.tsx     80–86
  forms-section.tsx     100–107
  feedback-section.tsx  120–127
  motion-section.tsx    140–146
  styleguide-client.tsx nav d'ancres sticky + assemblage
```

Numéros alloués par tranches **avec trous** : insérer un élément ne renumérote pas les autres.

## Registre des numéros (number → élément)

### 1. Couleurs & tokens
1 background · 2 foreground · 3 card · 4 card-foreground · 5 popover · 6 primary · 7 primary-fg · 8 secondary · 9 secondary-fg · 10 muted · 11 muted-fg · 12 accent · 13 accent-fg · 14 destructive · 15 destructive-fg · 16 border · 17 input · 18 ring · 19–23 chart-1..5 · 24 radius (sm/md/lg) · 25 shadow-hard · 26 shadow-hard-sm

### 2. Typographie
30 police Poppins · 31 titre 2xl · 32 titre lg · 33 corps base · 34 sm · 35 xs · 36 muted-foreground · 37 graisses

### 3. Boutons
40 default · 41 secondary · 42 outline · 43 ghost · 44 destructive · 45 link · 46 sm · 47 default(size) · 48 lg · 49 icon · 50 avec icône · 51 disabled · 52 loading · 53 full width · 54 groupe d'actions

### 4. Badges & statuts
70 default · 71 secondary · 72 destructive · 73 outline · 74 statut en_cours · 75 statut gagnée · 76 statut abandonnée

### 5. Cards & médias
80 card basique · 81 card + footer · 82 card sticker (shadow-hard) · 83 sticker sm · 84 stat card (RollingNumber) · 85 card cliquable · 86 TeamLogo (sm/md/lg)

### 6. Formulaires & données
100 input · 101 input number · 102 input disabled · 103 label + champ · 104 select · 105 separator · 106 tabs · 107 table

### 7. Feedback & overlays
120 dialog · 121 confirm default · 122 confirm destructive · 123 toast succès · 124 toast erreur · 125 dropdown menu · 126 skeleton lignes · 127 skeleton card

### 8. Mouvement & mécaniques
140 RollingNumber € · 141 RollingNumber % · 142 RollingNumber int · 143 press tactile · 144 confetti · 145 ombre dure au survol · 146 transition couleur

## Suite

Une fois le langage visuel calé ici, on propage écran par écran : dashboard → series → calendar → freebets → profile. Le styleguide reste la source de vérité.
