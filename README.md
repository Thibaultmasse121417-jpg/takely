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
| `/app/billing` | Achat de packs de crédits (Stripe Checkout) |

### Pipeline « Pub produit »

1. **Scénario** : Claude regarde la photo + le brief, écrit le découpage (1 plan / 5 s), les éléments à garder identiques et la voix off dans la langue choisie (`src/lib/planner.ts`).
2. **Images de référence** : pour chaque plan, FLUX Kontext remet en scène le produit dans le décor du plan, au bon format.
3. **Tournage** : chaque image est animée en clip de 5 s (Kling image→vidéo).
4. **Voix off** : ElevenLabs multilingue.
5. **Montage** : les clips + la voix sont assemblés en une vidéo (fal `ffmpeg-api/compose`).

Tout passe par la file d'attente fal.ai. Chaque étape terminée déclenche la suivante via webhook (`/api/webhooks/fal`). En local, sans webhook, la page de suivi interroge fal toutes les 6 s et fait avancer la pub.

Les crédits sont débités au lancement et **remboursés automatiquement** si une étape échoue.

## Mise en route

1. **Supabase** : créez un projet, puis exécutez `supabase/migrations/0001_init.sql` dans le SQL Editor. Dans Authentication › URL Configuration, ajoutez `https://VOTRE-DOMAINE/auth/callback` (et `http://localhost:3000/auth/callback`).
2. **Clés** : copiez `.env.example` en `.env.local` et remplissez-le (Supabase, fal.ai, Anthropic, Stripe, `WEBHOOK_SECRET`).
3. **Stripe** : créez un webhook vers `https://VOTRE-DOMAINE/api/webhooks/stripe` avec l'événement `checkout.session.completed`, et mettez son secret dans `STRIPE_WEBHOOK_SECRET`.
4. Lancez :

```bash
npm install
npm run dev
```

5. **Déploiement** : Vercel (import du dépôt GitHub, mêmes variables d'environnement, `NEXT_PUBLIC_APP_URL` = votre domaine).

## À ajuster avant la mise en ligne

- **Modèles et prix** : tout est dans `src/lib/models.ts` (endpoints fal, paramètres, coût en crédits) et `src/lib/billing.ts` (packs). Les identifiants d'endpoints fal changent souvent : vérifiez-les sur https://fal.ai/models et calez les crédits sur vos coûts réels.
- **Formats multiples** : une pub est produite dans un seul format à la fois (9:16, 4:5, 1:1 ou 16:9). Livrer plusieurs formats d'un coup est la prochaine étape.
- **Musique** : pas encore de piste musicale dans le montage, seulement la voix off.
- Mentions légales, CGV et adresse de contact dans le pied de page.
