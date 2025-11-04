import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Zod schema for incoming request
const RequestSchema = z.object({
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.union([z.string(), z.number()]).optional(),
        unit: z.string().optional(),
        prep: z.string().optional(),
      })
    )
    .or(z.array(z.object({ name: z.string() })))
    .or(z.array(z.record(z.any()))),
  maxTimeMin: z.number().min(1).max(240).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  allergens: z.array(z.string()).optional().default([]),
  dietary: z.array(z.string()).optional().default([]),
  cuisineA: z.string(),
  cuisineB: z.string().nullable().optional(),
  servings: z.number().min(1).max(12).optional().default(2),
});

// Utility: parse flexible time strings into minutes
function parseTimeToMinutes(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.toLowerCase();
  const range = s.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const a = parseInt(range[1], 10);
    const b = parseInt(range[2], 10);
    if (!isNaN(a) && !isNaN(b))
      return Math.round((Math.min(a, b) + Math.max(a, b)) / 2);
  }
  let total = 0;
  const h = s.match(/(\d+)\s*hour/);
  const m = s.match(/(\d+)\s*min/);
  if (h) total += parseInt(h[1], 10) * 60;
  if (m) total += parseInt(m[1], 10);
  if (total > 0) return total;
  const justNum = s.match(/^(\d+)\s*$/);
  if (justNum) return parseInt(justNum[1], 10);
  return null;
}

// Normalize model output to a consistent shape expected by the UI
function normalizeRecipe(raw) {
  const r = raw?.recipe || raw;

  const name = r?.name || 'Untitled Recipe';
  const description = r?.description || '';
  const servings = typeof r?.servings === 'number' ? r.servings : 2;
  const difficulty = r?.difficulty || 'Beginner';

  const total_time_str =
    typeof r?.total_time === 'string' ? r.total_time : null;
  const total_time_min =
    r?.total_time_min ?? parseTimeToMinutes(total_time_str);

  const ingredients = Array.isArray(r?.ingredients)
    ? r.ingredients
        .map((it) => ({
          name: it?.name ?? '',
          quantity: it?.quantity ?? null,
          unit: it?.unit ?? null,
          prep: it?.prep ?? null,
          substitutions: Array.isArray(it?.substitutions)
            ? it.substitutions
            : [],
        }))
        .filter((x) => x.name)
    : [];

  const instructions = Array.isArray(r?.instructions)
    ? r.instructions
        .map((s) => ({
          step: typeof s?.step === 'number' ? s.step : undefined,
          instruction: s?.instruction ?? '',
          timer: s?.timer ?? null,
        }))
        .filter((s) => s.instruction)
    : [];

  const nutrition = r?.nutrition ?? null;
  const safety_notes = Array.isArray(r?.safety_notes) ? r.safety_notes : [];
  const gaps_to_buy = Array.isArray(r?.gaps_to_buy) ? r.gaps_to_buy : [];
  const dietary_tags = Array.isArray(r?.dietary_tags) ? r.dietary_tags : [];

  const cuisine =
    r?.cuisine && typeof r.cuisine === 'object'
      ? {
          primary: r.cuisine.primary ?? null,
          fusion_with: r.cuisine.fusion_with ?? null,
        }
      : { primary: null, fusion_with: null };

  return {
    recipe: {
      name,
      description,
      servings,
      difficulty,
      total_time:
        total_time_str || (total_time_min ? `${total_time_min} minutes` : null),
      total_time_min: total_time_min ?? null,
      ingredients,
      instructions,
      nutrition,
      safety_notes,
      gaps_to_buy,
      dietary_tags,
      cuisine,
    },
  };
}

// Gemini setup
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
if (!genAI) {
  console.warn('Warning: GEMINI_API_KEY is missing. Set it in server/.env');
}

// Minimal, robust Gemini call using plain string input
async function callGeminiRecipe(userPayloadJSON, systemText) {
  if (!genAI) throw new Error('GEMINI_API_KEY missing');

  // Compose a single prompt string; this avoids content schema mismatches.
  const composed = [
    systemText,
    'Respond only with a single JSON object. No markdown, no code fences, no explanations.',
    'User payload:',
    userPayloadJSON,
  ].join('\n\n');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  // Pass a plain string for maximum SDK compatibility
  const result = await model.generateContent(composed);

  const text =
    typeof result?.response?.text === 'function'
      ? result.response.text()
      : result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No content from Gemini');

  // Parse strict JSON, with a safe fallback
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse JSON output');
    return JSON.parse(match[0]);
  }
}

app.post('/api/generate', async (req, res) => {
  try {
    const parsed = RequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request', issues: parsed.error.format() });
    }
    const {
      ingredients,
      maxTimeMin,
      difficulty,
      allergens = [],
      dietary = [],
      cuisineA,
      cuisineB = null,
      servings,
    } = parsed.data;

    const system = [
      'Act as a professional chef and food safety consultant.',
      'Output strictly as a single JSON object with the following shape:',
      '{ "recipe": {',
      '  "name": string,',
      '  "description": string,',
      '  "servings": number,',
      '  "total_time": string,',
      '  "difficulty": "Beginner" | "Intermediate" | "Advanced",',
      '  "ingredients": [ { "name": string, "quantity": string | number | null, "unit": string | null, "prep": string | null, "substitutions": string[] } ],',
      '  "instructions": [ { "step": number, "instruction": string, "timer": string | null } ],',
      '  "nutrition": { "calories": number | null, "protein": string | number | null, "carbohydrates": string | number | null, "fat": string | number | null, "fiber": string | number | null } | null,',
      '  "safety_notes": string[],',
      '  "gaps_to_buy": string[],',
      '  "dietary_tags": string[],',
      '  "cuisine": { "primary": string | null, "fusion_with": string | null }',
      '} }',
      'Rules:',
      '- Respond only with valid JSON. No markdown, no commentary.',
      '- Use primarily the provided ingredients; do not invent extras unless listed in gaps_to_buy.',
      '- If allergens are provided, avoid them and suggest safe substitutions in ingredients.substitutions.',
      '- If dietary restrictions provided, make output compatible and reflect tags in dietary_tags.',
      '- Respect maxTimeMin and difficulty with realistic steps and timers.',
      '- Cuisine fusion: primary cuisine is cuisineA; if cuisineB is provided, blend techniques/flavors coherently.',
      '- Include at least 6 instructions with timers where applicable.',
      '- For poultry, include an explicit food safety note on doneness temperature.',
    ].join('\n');

    const userPayload = {
      pantry_ingredients: ingredients,
      constraints: { maxTimeMin, difficulty, servings },
      safety: { allergens, dietary },
      cuisine: { primary: cuisineA, fusion_with: cuisineB },
    };

    const llmJson = await callGeminiRecipe(JSON.stringify(userPayload), system);
    const normalized = normalizeRecipe(llmJson);

    if (!normalized.recipe.ingredients.length) {
      return res.status(502).json({ error: 'Model returned an empty recipe' });
    }
    return res.json(normalized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'generation failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
