# Takely

Studio IA de pubs vidéo et de contenus : **photo produit + une phrase → pub vidéo montée avec voix off, en 32 langues**, plus les outils génériques (texte/image → vidéo, génération et retouche d'images).

## Ce que fait l'app

| Écran | Rôle |
|---|---|
| `/` | Landing (FR / EN / ES / DE, détection automatique) |
| `/login` | Connexion par lien magique (Supabase Auth) |
| `/app` | Studio : onglets **Pub produit**, **Vidéo**, **Image** |
| `/app/ads/[id]` | Suivi de production d'une pub en direct, puis lecteur + téléchargement |
| `/app/library` | Toutes les générations |
| `/app/billing` | Abonnements mensuels + recharges ponctuelles (Stripe Checkout, portail client) |

### Pipeline « Pub produit »

1. **Scénario** : Claude regarde la photo + le brief et écrit le découpage (1 plan / 5 s), les éléments à garder identiques, la voix off dans la langue choisie et le style de musique (`src/lib/planner.ts`).
2. **Images de référence** : pour chaque plan, FLUX Kontext remet en scène le produit dans le décor du plan, au bon format.
3. **Tournage** : chaque image est animée en clip de 5 s (Kling 2.5 Turbo Pro image→vidéo).
4. **Voix off** (ElevenLabs multilingue) et **musique** (CassetteAI), en parallèle du tournage.
5. **Montage** sur notre serveur avec ffmpeg (`src/lib/assemble.ts`) : plans coupés bout à bout, voix off par-dessus, musique baissée en dessous, fondus d'entrée et de sortie.
6. **Déclinaisons** : la vidéo est recadrée automatiquement dans les autres formats possibles (une pub 9:16 sort aussi en 4:5 et 1:1 ; une 16:9 sort aussi en 1:1).

Les étapes 1 à 4 passent par la file d'attente fal.ai ; chaque étape terminée déclenche la suivante via webhook (`/api/webhooks/fal`). En local, la page de suivi interroge fal toutes les 6 s. Un montage interrompu est relancé automatiquement après 6 minutes, un job bloqué plus de 30 minutes est annulé et remboursé.

Les crédits sont débités au lancement et **remboursés automatiquement** si une étape échoue (seule l'écriture du scénario reste due). Si la voix off ou la musique échoue, la pub est livrée sans cette piste.

Garde-fous : 3 pubs en production et 6 générations simultanées au maximum par compte.

### Test du pipeline

```bash
npm run test:pipeline
```

Simule une base de données et fal.ai, mais fait le vrai montage ffmpeg : pub de 15 s avec voix + musique et 3 formats, échec d'un plan (remboursement unique), échec de la voix off (pub quand même livrée), pub de 30 s sans son.

## Mise en route

1. **Supabase** : ajoutez l'intégration Supabase dans Vercel. Les migrations s'appliquent toutes seules à chaque build (`scripts/migrate.mts`, via `POSTGRES_URL_NON_POOLING`). Sans cette variable, collez `supabase/setup.sql` dans le SQL Editor. Dans Authentication › URL Configuration, mettez l'adresse du site en Site URL. Dans Authentication › URL Configuration, ajoutez `https://VOTRE-DOMAINE/auth/callback` (et `http://localhost:3000/auth/callback`).
2. **Clés** : copiez `.env.example` en `.env.local` et remplissez-le (Supabase, fal.ai, Anthropic, Stripe, `WEBHOOK_SECRET`).
3. **Stripe** (voir la section Stripe ci-dessous) : `npm run stripe:setup`, puis le webhook.
4. Lancez :

```bash
npm install
npm run dev
```

5. **Déploiement** : Vercel (import du dépôt GitHub, mêmes variables d'environnement, `NEXT_PUBLIC_APP_URL` = votre domaine). Le montage a besoin de fonctions de 300 s : activez Fluid Compute (par défaut sur les nouveaux projets) ou passez en plan Pro.

## Stripe

Intégration revue selon les bonnes pratiques Stripe (plugin officiel) :

- **Catalogue** : un Product par offre et par recharge, un Price par Product retrouvé par sa `lookup_key` (aucun id en dur). Prix TTC (`tax_behavior: inclusive`).
- **Paiement** : Checkout Sessions (`mode: subscription` ou `payment`), moyens de paiement dynamiques (gérés dans le Dashboard, jamais `payment_method_types`), codes promo, facture pour les recharges, `integration_identifier` pour suivre le tunnel.
- **Crédits versés uniquement par webhook**, avec vérification de signature et clé d'idempotence par objet Stripe ; erreur 500 en cas d'échec pour que Stripe réessaie.
- **Portail client** : carte, factures, résiliation en fin de période, changement d'offre.

Mise en place :

1. **Rien à faire au départ** : au premier paiement, l'app crée elle-même les produits, le portail client et le webhook Stripe (son secret est gardé dans la table privée `app_settings`). `npm run stripe:setup` permet de le faire à l'avance, par exemple avec la clé live.
2. Webhook manuel (optionnel, si vous préférez) : endpoint `https://VOTRE-DOMAINE/api/webhooks/stripe` avec `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copiez le secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET` : il remplace alors le webhook automatique.
3. En production, utilisez une **clé restreinte** (`rk_…`) avec les permissions listées dans `.env.example`, marquée « Sensitive » dans Vercel.
4. **TVA** : laissez `STRIPE_AUTOMATIC_TAX=false` tant qu'aucune immatriculation TVA n'est active dans Stripe Tax (Dashboard › Tax › Registrations) ; sinon Stripe ne collecte rien sans erreur. Une fois active, passez-la à `true` (adresse de facturation et n° de TVA intracommunautaire demandés au paiement).
5. Un hook git (`.githooks/pre-commit`) bloque tout commit contenant une clé `sk_`/`rk_`/`whsec_`/Anthropic/Supabase.

Test : carte `4242 4242 4242 4242`, n'importe quelle date future et CVC. Échec de paiement : `4000 0000 0000 0341`.

## Offres

- **Abonnements** (`src/lib/billing.ts`) : Starter 19 €/mois (200 crédits), Pro 49 €/mois (600), Agency 149 €/mois (2000). Les crédits sont versés à chaque facture payée et se cumulent.
- **Recharges** : 100 crédits 10 €, 300 crédits 27 €, 1000 crédits 85 €.
- **Coûts visés** : chaque modèle est tarifé pour que le coût fal.ai reste autour de 35 % du prix payé (≈ 65 % de marge brute). Les pubs utilisent Kling 2.5 Turbo Pro (environ 0,35 $ le plan de 5 s). Modèles vérifiés sur la documentation fal.ai le 7 octobre 2026.
- Changer d'offre : depuis le portail client Stripe. La nouvelle offre démarre au renouvellement suivant, avec ses crédits.

## À ajuster avant la mise en ligne

- **Modèles et prix** : tout est dans `src/lib/models.ts` (endpoints fal, paramètres, coût en crédits) et `src/lib/billing.ts` (packs). Les identifiants d'endpoints fal changent souvent : vérifiez-les sur https://fal.ai/models et calez les crédits sur vos coûts réels.
- **Volume de la musique** : réglé à 22 % sous la voix off (`src/lib/montage.ts`), à ajuster à l'oreille sur les premières vraies pubs.
- **Pages légales** (`/legal`) : modèle à compléter (champs entre crochets) et à faire relire.
