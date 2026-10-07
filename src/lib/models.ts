/**
 * Model catalog. Every generation goes through fal.ai, so adding a model is one
 * entry here: its fal endpoint, what it accepts, what it costs in credits and how
 * to turn the studio's form into that endpoint's input.
 *
 * Endpoint ids and prices change often on fal.ai — check https://fal.ai/models
 * and adjust `endpoint` and `credits` before going live.
 */

export type Kind = "image" | "video";
export type Aspect = "9:16" | "16:9" | "1:1" | "4:5";

export interface GenerateForm {
  prompt: string;
  imageUrl?: string | null;
  aspect: Aspect;
  duration: number; // seconds, video only
}

export interface ModelDef {
  id: string;
  label: string;
  kind: Kind;
  /** Endpoint used when no image is given. */
  endpoint: string;
  /** Endpoint used when a start/reference image is given (falls back to `endpoint`). */
  imageEndpoint?: string;
  requiresImage?: boolean;
  aspects: Aspect[];
  durations?: number[];
  /** Credits charged per generation (images) or per 5 seconds (video). */
  credits: number;
  blurb: { en: string; fr: string };
  buildInput(form: GenerateForm): Record<string, unknown>;
}

const klingAspect = (a: Aspect) => (a === "4:5" ? "9:16" : a);

/** Kling 2.5 Turbo Pro (fal schema: image_url, duration "5"|"10", aspect_ratio on text-to-video only). */
const kling25 = {
  endpoint: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
  imageEndpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  buildInput: (f: GenerateForm) => ({
    prompt: f.prompt,
    duration: String(f.duration >= 10 ? 10 : 5),
    ...(f.imageUrl ? { image_url: f.imageUrl } : { aspect_ratio: klingAspect(f.aspect) }),
    negative_prompt: "blur, distort, low quality, text artifacts, deformed product",
  }),
};

/** Kling 3.0 Pro (fal schema: start_image_url, duration 3–15 s, optional native audio). */
const kling3 = {
  endpoint: "fal-ai/kling-video/v3/pro/text-to-video",
  imageEndpoint: "fal-ai/kling-video/v3/pro/image-to-video",
  buildInput: (f: GenerateForm) => ({
    prompt: f.prompt,
    duration: String(f.duration >= 10 ? 10 : 5),
    generate_audio: false,
    ...(f.imageUrl ? { start_image_url: f.imageUrl } : { aspect_ratio: klingAspect(f.aspect) }),
    negative_prompt: "blur, distort, low quality, text artifacts, deformed product",
  }),
};

/*
 * Pricing rule: 1 credit ≈ €0.08–0.10 for the buyer. Each model is priced so its fal.ai
 * cost stays around 35 % of what the user pays (≈ 65 % gross margin). Approximate fal
 * costs used (check fal.ai/pricing): Kling 2.5 Turbo Pro ≈ $0.35 / 5 s, Kling 3.0 Pro ≈ $1.10 / 5 s,
 * Veo 3.1 Fast with audio ≈ $3.20 / 8 s, Seedance 1 Pro 1080p ≈ $0.62 / 5 s, FLUX Ultra ≈ $0.06,
 * Nano Banana ≈ $0.04, FLUX Kontext ≈ $0.04 per image.
 */
export const MODELS: ModelDef[] = [
  {
    id: "kling-pro",
    label: "Kling 2.5 Turbo Pro",
    kind: "video",
    ...kling25,
    aspects: ["9:16", "16:9", "1:1"],
    durations: [5, 10],
    credits: 14,
    blurb: { en: "Best value. Cinematic motion, keeps your product faithful from a start image.", fr: "Meilleur rapport qualité-prix. Mouvements cinématiques, produit fidèle à l'image de départ." },
  },
  {
    id: "kling-3",
    label: "Kling 3.0 Pro",
    kind: "video",
    ...kling3,
    aspects: ["9:16", "16:9", "1:1"],
    durations: [5, 10],
    credits: 40,
    blurb: { en: "Top quality motion and detail, for hero shots.", fr: "Qualité maximale de mouvement et de détail, pour les plans phares." },
  },
  {
    id: "veo",
    label: "Veo 3.1 Fast",
    kind: "video",
    endpoint: "fal-ai/veo3.1/fast",
    imageEndpoint: "fal-ai/veo3.1/fast/image-to-video",
    aspects: ["16:9", "9:16"],
    durations: [8],
    credits: 90,
    blurb: { en: "Native sound and dialogue, very realistic.", fr: "Son et dialogues natifs, très réaliste." },
    buildInput: (f) => ({
      prompt: f.prompt,
      aspect_ratio: f.aspect === "16:9" ? "16:9" : "9:16",
      duration: "8s",
      generate_audio: true,
      ...(f.imageUrl ? { image_url: f.imageUrl } : {}),
    }),
  },
  {
    id: "seedance",
    label: "Seedance 1 Pro",
    kind: "video",
    endpoint: "fal-ai/bytedance/seedance/v1/pro/text-to-video",
    imageEndpoint: "fal-ai/bytedance/seedance/v1/pro/image-to-video",
    aspects: ["9:16", "16:9", "1:1", "4:5"],
    durations: [5, 10],
    credits: 18,
    blurb: { en: "Fast, good at multi-shot storytelling.", fr: "Rapide, bon pour raconter en plusieurs plans." },
    buildInput: (f) => ({
      prompt: f.prompt,
      duration: String(f.duration >= 10 ? 10 : 5),
      aspect_ratio: f.aspect === "4:5" ? "3:4" : f.aspect,
      resolution: "1080p",
      ...(f.imageUrl ? { image_url: f.imageUrl } : {}),
    }),
  },
  {
    id: "flux",
    label: "FLUX 1.1 Pro Ultra",
    kind: "image",
    endpoint: "fal-ai/flux-pro/v1.1-ultra",
    aspects: ["9:16", "16:9", "1:1", "4:5"],
    credits: 2,
    blurb: { en: "Photorealistic images from text.", fr: "Images photoréalistes à partir d'un texte." },
    buildInput: (f) => ({
      prompt: f.prompt,
      aspect_ratio: f.aspect === "4:5" ? "3:4" : f.aspect,
      num_images: 1,
      output_format: "jpeg",
    }),
  },
  {
    id: "nano-banana",
    label: "Nano Banana (edit)",
    kind: "image",
    endpoint: "fal-ai/nano-banana",
    imageEndpoint: "fal-ai/nano-banana/edit",
    aspects: ["9:16", "16:9", "1:1", "4:5"],
    credits: 1,
    blurb: { en: "Edit or restage a photo while keeping the product identical.", fr: "Retouche ou remise en scène d'une photo en gardant le produit identique." },
    buildInput: (f) => ({
      prompt: f.prompt,
      aspect_ratio: f.aspect,
      num_images: 1,
      output_format: "jpeg",
      ...(f.imageUrl ? { image_urls: [f.imageUrl] } : {}),
    }),
  },
];

export function getModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

export function endpointFor(model: ModelDef, form: GenerateForm): string {
  return form.imageUrl && model.imageEndpoint ? model.imageEndpoint : model.endpoint;
}

export function costFor(model: ModelDef, form: Pick<GenerateForm, "duration">): number {
  if (model.kind === "image") return model.credits;
  const units = Math.max(1, Math.ceil((form.duration || 5) / 5));
  return model.credits * units;
}

/* ---------- Product-ad pipeline ---------- */

export const AD = {
  /** Image model used to stage the product in each shot's first frame (keeps the product, sets the aspect). */
  keyframeEndpoint: "fal-ai/flux-pro/kontext",
  /** Image-to-video model used to animate each shot (Kling 2.5 Turbo Pro: best quality for the price). */
  clipEndpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  clipSeconds: 5,
  /** Text-to-speech for the voiceover (ElevenLabs on fal). */
  voiceEndpoint: "fal-ai/elevenlabs/tts/multilingual-v2",
  voiceName: "Aria",
  /** Instrumental background music. */
  musicEndpoint: "CassetteAI/music-generator",
  credits: { planning: 2, keyframe: 1, clip: 14, voice: 2, music: 2, edit: 1 },
  durations: [15, 30, 45] as const,
};

export function adCost(durationSec: number, voiceover: boolean, music = true): number {
  const shots = Math.round(durationSec / AD.clipSeconds);
  const c = AD.credits;
  return c.planning + shots * (c.keyframe + c.clip) + (voiceover ? c.voice : 0) + (music ? c.music : 0) + c.edit;
}

/** Pulls the main media url out of whatever shape a fal endpoint returns. */
export function extractResult(data: unknown): { url: string | null; thumb: string | null } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (data ?? {}) as Record<string, any>;
  const url =
    d.video?.url ??
    d.video_url ??
    d.images?.[0]?.url ??
    d.image?.url ??
    d.audio?.url ??
    d.audio_url ??
    d.audio_file?.url ??
    null;
  const thumb = d.thumbnail_url ?? d.images?.[0]?.url ?? null;
  return { url, thumb };
}
