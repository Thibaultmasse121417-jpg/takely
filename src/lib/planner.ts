import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AD_LANGUAGES } from "./i18n";

export const PlanSchema = z.object({
  title: z.string(),
  product_description: z.string(),
  locked_elements: z.array(z.string()),
  shots: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        keyframe_prompt: z.string(),
        motion_prompt: z.string(),
      }),
    )
    .min(1),
  voiceover: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;

const SYSTEM = `You are the creative director of a premium video-ad studio.
From a product photo and a short brief you write a shot-by-shot plan for a short vertical or square ad.
Each shot lasts exactly 5 seconds and is produced in two steps:
1. keyframe_prompt — an instruction for an image-EDITING model that receives the product photo and must restage it as the first frame of the shot. Always say to keep the product exactly identical (shape, colors, materials, logos), then describe the scene, framing, lens, light and mood. English only.
2. motion_prompt — an instruction for an image-to-video model animating that first frame for 5 seconds: subject motion, camera move, pacing, atmosphere. One continuous move per shot, no cuts. English only.
Rules:
- Keep the same product, setting, characters and color grade across shots (list them in locked_elements) so the ad feels like one film.
- Respect the brief's story and order. The last shot is a clean hero/packshot of the product.
- Never include on-screen text, subtitles or brand names in prompts.
- voiceover: a natural spoken script in the requested language, short enough to be read in about 2.3 words per second over the total duration. No stage directions.
- title: a short internal title for the project, in the requested language.
- shots[].title and shots[].description: short, in the requested language, for the user's storyboard.`;

export async function planAd(opts: {
  brief: string;
  productImageUrl: string;
  language: string;
  durationSec: number;
  aspect: string;
}): Promise<Plan> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const shots = Math.round(opts.durationSec / 5);
  const langName = AD_LANGUAGES.find((l) => l.code === opts.language)?.name ?? opts.language;

  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4000,
    system: SYSTEM,
    tools: [
      {
        name: "submit_plan",
        description: "Submit the finished ad plan.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            product_description: { type: "string", description: "Precise visual description of the product in English." },
            locked_elements: { type: "array", items: { type: "string" } },
            shots: {
              type: "array",
              minItems: shots,
              maxItems: shots,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  keyframe_prompt: { type: "string" },
                  motion_prompt: { type: "string" },
                },
                required: ["title", "description", "keyframe_prompt", "motion_prompt"],
              },
            },
            voiceover: { type: "string" },
          },
          required: ["title", "product_description", "locked_elements", "shots", "voiceover"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_plan" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: opts.productImageUrl } },
          {
            type: "text",
            text: `Brief: ${opts.brief}\n\nTotal duration: ${opts.durationSec} seconds → exactly ${shots} shots of 5 seconds.\nAspect ratio: ${opts.aspect}.\nLanguage for voiceover, title and storyboard text: ${langName}.`,
          },
        ],
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Planner returned no plan");
  const plan = PlanSchema.parse(block.input);
  plan.shots = plan.shots.slice(0, shots);
  return plan;
}
