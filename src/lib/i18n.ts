export const LOCALES = ["fr", "en", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const fr = {
  nav: { how: "Comment ça marche", tools: "Outils", pricing: "Tarifs", login: "Connexion", start: "Essayer gratuitement", app: "Ouvrir le studio" },
  hero: {
    badge: "Pubs produit, vidéos et images · 32 langues",
    title1: "Une photo produit.",
    title2: "Une pub vidéo prête à publier.",
    sub: "Décrivez votre idée en une phrase. Takely écrit le scénario, tourne chaque plan, monte la vidéo et la livre dans la langue de votre choix.",
    demo: "Une pub de 30 secondes pour ces sneakers : une journée en ville, de l'aube au coucher du soleil. Coupé sur les pas.",
  },
  how: {
    title: "Un studio de production entier, derrière une seule zone de texte.",
    s1t: "Le scénario", s1d: "Votre brief devient un découpage plan par plan : cadrage, mouvement de caméra, rythme, voix off.",
    s2t: "Le tournage", s2d: "Chaque plan est généré avec votre produit à l'identique, d'une image de référence à la vidéo.",
    s3t: "Le montage", s3d: "Plans, voix off et timing assemblés automatiquement. Une vidéo finie, prête à publier.",
  },
  tools: {
    title: "Et tous les outils d'un studio IA.",
    ad: "Pub produit", adD: "Photo + brief → pub montée avec voix off.",
    video: "Vidéo", videoD: "Texte ou image → vidéo, avec les meilleurs modèles du marché.",
    image: "Image", imageD: "Génération et retouche d'images, packshots, mises en scène.",
  },
  langs: { title: "Une vidéo.\nTous vos marchés.", sub: "Voix off et scénario rédigés directement dans 32 langues." },
  pricing: {
    title: "Un abonnement simple.", credits: "crédits", buy: "Acheter", popular: "Populaire",
    perMonth: "/ mois", monthly: "crédits chaque mois", subscribe: "S'abonner", current: "Votre offre", manage: "Gérer l'abonnement",
    topups: "Besoin de plus ?", topupsSub: "Recharges ponctuelles, sans abonnement. Les crédits n'expirent pas.",
    note: "Une pub de 30 s ≈ 95 crédits · une vidéo de 5 s ≈ 14 crédits · une image ≈ 1 à 2 crédits.",
    cancel: "Sans engagement, résiliable en un clic.",
  },
  footer: { legal: "Mentions légales", terms: "CGV", contact: "Contact" },
  app: {
    newAd: "Pub produit", video: "Vidéo", image: "Image", library: "Bibliothèque", credits: "Crédits", recharge: "Recharger", logout: "Déconnexion",
    greeting: "Qu'est-ce qu'on tourne aujourd'hui ?",
    briefLabel: "Votre idée", briefPh: "Décrivez la pub que vous voulez…", promptPh: "Décrivez ce que vous voulez générer…",
    addPhoto: "Ajouter une photo produit", addImage: "Image de départ (optionnel)",
    duration: "Durée", format: "Format", language: "Langue de la pub", voice: "Voix off", model: "Modèle",
    generate: "Générer", cost: "crédits", recent: "Récents", empty: "Rien pour l'instant. Lancez votre première génération.",
    uploading: "Envoi…", needPhoto: "Ajoutez une photo produit.", needPrompt: "Décrivez ce que vous voulez.",
    notEnough: "Crédits insuffisants.",
  },
  ad: {
    production: "Production", shots: "Découpage", planning: "Écriture du scénario", keyframes: "Images de référence des plans",
    clips: "Tournage des plans", voice: "Voix off", assembling: "Montage", completed: "Prête", failed: "Échec",
    download: "Télécharger", back: "Retour au studio", script: "Voix off", queued: "En attente", running: "En cours", done: "Tourné",
    refunded: "La génération a échoué. Les crédits non utilisés ont été remboursés.",
  },
  login: { title: "Connexion", sub: "Recevez un lien de connexion par e-mail.", email: "Adresse e-mail", send: "Envoyer le lien", sent: "C'est envoyé. Ouvrez le lien reçu par e-mail." },
  billing: { title: "Recharger des crédits", balance: "Solde actuel", success: "Paiement reçu, vos crédits arrivent.", },
};

type Dict = typeof fr;

const en: Dict = {
  nav: { how: "How it works", tools: "Tools", pricing: "Pricing", login: "Log in", start: "Try for free", app: "Open studio" },
  hero: {
    badge: "Product ads, video and images · 32 languages",
    title1: "One product photo.",
    title2: "A video ad, ready to post.",
    sub: "Describe your idea in one sentence. Takely writes the script, shoots every shot, edits the video and delivers it in the language you choose.",
    demo: "A 30-second ad for these sneakers: one day in the city, from dawn to sunset. Cut on every step.",
  },
  how: {
    title: "A full production studio, behind a single text box.",
    s1t: "The script", s1d: "Your brief becomes a shot list: framing, camera moves, pacing, voiceover.",
    s2t: "The shoot", s2d: "Every shot is generated with your exact product, from reference image to video.",
    s3t: "The edit", s3d: "Shots, voiceover and timing assembled automatically. A finished video, ready to post.",
  },
  tools: {
    title: "Plus every tool of an AI studio.",
    ad: "Product ad", adD: "Photo + brief → edited ad with voiceover.",
    video: "Video", videoD: "Text or image → video, with the best models available.",
    image: "Image", imageD: "Image generation and editing, packshots, scenes.",
  },
  langs: { title: "One video.\nEvery market.", sub: "Voiceover and script written natively in 32 languages." },
  pricing: {
    title: "Simple monthly plans.", credits: "credits", buy: "Buy", popular: "Popular",
    perMonth: "/ month", monthly: "credits every month", subscribe: "Subscribe", current: "Your plan", manage: "Manage subscription",
    topups: "Need more?", topupsSub: "One-off top-ups, no subscription needed. Credits never expire.",
    note: "A 30 s ad ≈ 95 credits · a 5 s video ≈ 14 credits · an image ≈ 1–2 credits.",
    cancel: "No commitment, cancel in one click.",
  },
  footer: { legal: "Legal notice", terms: "Terms", contact: "Contact" },
  app: {
    newAd: "Product ad", video: "Video", image: "Image", library: "Library", credits: "Credits", recharge: "Top up", logout: "Log out",
    greeting: "What are we shooting today?",
    briefLabel: "Your idea", briefPh: "Describe the ad you want…", promptPh: "Describe what you want to generate…",
    addPhoto: "Add a product photo", addImage: "Start image (optional)",
    duration: "Duration", format: "Format", language: "Ad language", voice: "Voiceover", model: "Model",
    generate: "Generate", cost: "credits", recent: "Recent", empty: "Nothing yet. Start your first generation.",
    uploading: "Uploading…", needPhoto: "Add a product photo.", needPrompt: "Describe what you want.",
    notEnough: "Not enough credits.",
  },
  ad: {
    production: "Production", shots: "Shot list", planning: "Writing the script", keyframes: "Shot reference frames",
    clips: "Shooting", voice: "Voiceover", assembling: "Editing", completed: "Ready", failed: "Failed",
    download: "Download", back: "Back to studio", script: "Voiceover", queued: "Queued", running: "Running", done: "Shot",
    refunded: "Generation failed. Unused credits were refunded.",
  },
  login: { title: "Log in", sub: "Get a sign-in link by email.", email: "Email address", send: "Send link", sent: "Sent. Open the link in your inbox." },
  billing: { title: "Top up credits", balance: "Current balance", success: "Payment received, your credits are on their way." },
};

const es: Dict = {
  ...en,
  nav: { how: "Cómo funciona", tools: "Herramientas", pricing: "Precios", login: "Entrar", start: "Probar gratis", app: "Abrir el estudio" },
  hero: {
    badge: "Anuncios de producto, vídeo e imagen · 32 idiomas",
    title1: "Una foto de producto.",
    title2: "Un anuncio en vídeo listo para publicar.",
    sub: "Describe tu idea en una frase. Takely escribe el guion, rueda cada plano, monta el vídeo y lo entrega en el idioma que elijas.",
    demo: "Un anuncio de 30 segundos para estas zapatillas: un día en la ciudad, del amanecer al atardecer.",
  },
  app: { ...en.app, greeting: "¿Qué rodamos hoy?", generate: "Generar", newAd: "Anuncio de producto", library: "Biblioteca", credits: "Créditos", recharge: "Recargar", logout: "Salir" },
};

const de: Dict = {
  ...en,
  nav: { how: "So funktioniert's", tools: "Tools", pricing: "Preise", login: "Anmelden", start: "Kostenlos testen", app: "Studio öffnen" },
  hero: {
    badge: "Produktwerbung, Video und Bild · 32 Sprachen",
    title1: "Ein Produktfoto.",
    title2: "Ein fertiger Video-Werbespot.",
    sub: "Beschreibe deine Idee in einem Satz. Takely schreibt das Skript, dreht jede Einstellung, schneidet das Video und liefert es in deiner Sprache.",
    demo: "Ein 30-Sekunden-Spot für diese Sneaker: ein Tag in der Stadt, vom Morgengrauen bis zum Sonnenuntergang.",
  },
  app: { ...en.app, greeting: "Was drehen wir heute?", generate: "Generieren", newAd: "Produktwerbung", library: "Bibliothek", credits: "Credits", recharge: "Aufladen", logout: "Abmelden" },
};

const DICTS: Record<Locale, Dict> = { fr, en, es, de };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

export function pickLocale(cookie?: string | null, acceptLanguage?: string | null): Locale {
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie as Locale;
  const langs = (acceptLanguage ?? "").split(",").map((l) => l.trim().slice(0, 2).toLowerCase());
  for (const l of langs) if ((LOCALES as readonly string[]).includes(l)) return l as Locale;
  return DEFAULT_LOCALE;
}

export type { Dict };

/** Languages a finished ad can be written and voiced in. */
export const AD_LANGUAGES: { code: string; name: string }[] = [
  { code: "fr", name: "Français" }, { code: "en", name: "English" }, { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" }, { code: "it", name: "Italiano" }, { code: "pt", name: "Português" },
  { code: "nl", name: "Nederlands" }, { code: "pl", name: "Polski" }, { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" }, { code: "no", name: "Norsk" }, { code: "fi", name: "Suomi" },
  { code: "cs", name: "Čeština" }, { code: "sk", name: "Slovenčina" }, { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" }, { code: "el", name: "Ελληνικά" }, { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" }, { code: "uk", name: "Українська" }, { code: "ru", name: "Русский" },
  { code: "tr", name: "Türkçe" }, { code: "ar", name: "العربية" }, { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" }, { code: "ms", name: "Bahasa Melayu" }, { code: "fil", name: "Filipino" },
  { code: "vi", name: "Tiếng Việt" }, { code: "ta", name: "தமிழ்" }, { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" }, { code: "zh", name: "中文" },
];
