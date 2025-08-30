import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

// ──────────────────────────────────────────────────────────────────────────────
// Structured extraction schema (what the model returns)
// NOTE: use .optional() instead of .nullable() to avoid union types in schema.
// ──────────────────────────────────────────────────────────────────────────────
const ExtractionSchema = z.object({
  languages: z
    .array(
      z.enum([
        "C",
       " C++", 
        "C#",
        "Go",
        "Java",
       "JavaScript",
       "Kotlin",
       "PHP",
       "Python",
        "Ruby",
        "Rust",
        "Scala",
        "Swift",
        "TypeScript",
      ])
    )
    .default([]),
  location: z.string().optional(),          
  min_experience: z.number().int().optional(),
  max_experience: z.number().int().optional(),
  limit: z.number().int().optional(),
  need_activity_filters: z.boolean().default(false), 
});


// ──────────────────────────────────────────────────────────────────────────────
// System prompt (extraction rules)
// ──────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a GitHub sourcing assistant.
Extract structured fields for a GitHub USER search. Your output MUST match the given schema.

Fill these fields:
- languages: array of programming languages (from this exact set only):
  C, C++, C#, Go, Java, JavaScript, Kotlin, PHP, Python, Ruby, Rust, Scala, Swift, TypeScript
- location: city/region/country as plain text (no quotes).
- min_experience, max_experience: integers or omit if unknown.
- limit: integer or omit if unknown.
- need_activity_filters: boolean; set to true when years of experience are mentioned.

Language rules (very important):
- Output ONLY languages that are explicitly mentioned in the request OR the single minimal primary language implied by a known stack.
- NEVER add extra languages that were not asked for.
- For these stacks, return exactly ONE primary language (unless the text explicitly names another language in addition):
  • MERN → JavaScript
  • MEAN → JavaScript
  • LAMP → PHP
  • Django → Python
  • Spring → Java
  • .NET → C#
  • iOS → Swift
  • Android → Kotlin (use Java ONLY if the text explicitly mentions Java)
  • PERN → TypeScript if the text explicitly mentions TypeScript, otherwise JavaScript
- Examples:
  • "mern stack with 3+ years in bengaluru" → languages: ["JavaScript"], location: "bengaluru", min_experience: 3, need_activity_filters: true
  • "android dev, 2-5 years, pune" → languages: ["Kotlin"], min_experience: 2, max_experience: 5, location: "pune", need_activity_filters: true
  • "java + spring, up to 5 years, noida" → languages: ["Java"], max_experience: 5, location: "noida", need_activity_filters: true
- Do NOT infer multiple languages for MERN/MEAN/etc. Do NOT add Python/Go/C#/… unless explicitly requested.

Experience rules:
- "3+ years" => min_experience = 3, max_experience omitted, need_activity_filters = true
- "up to 5 years" => max_experience = 5, need_activity_filters = true
- "2-5 years" => min_experience = 2, max_experience = 5, need_activity_filters = true

Location:
- If present, copy it as plain text (no quotes). Do not guess.

Output ONLY data that fits the schema. Do not include explanations.
`.trim();


// ──────────────────────────────────────────────────────────────────────────────
// Helpers + deterministic query builder
// ──────────────────────────────────────────────────────────────────────────────
function titleCasePlace(s = "") {
  return s.trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function uniquePush(arr, val) {
  const key = String(val).toLowerCase();
  if (!arr._seen) arr._seen = new Set();
  if (arr._seen.has(key)) return arr;
  arr._seen.add(key);
  arr.push(val);
  return arr;
}

/**
 * Build final GitHub query with precise ordering and multiple language qualifiers.
 * Order: languages → type → location → filters → keywords
 * Example output:
 * language:JSON type:user location:"Pune" language:JavaScript repos:>3 followers:>5 language:Python language:Go
 */
function buildQuery(extracted) {
  const tokens = [];
  tokens._seen = new Set();

  // 1) Languages first (preserve model order, but ensure JSON is first if present)
  const langs = Array.isArray(extracted.languages) ? [...extracted.languages] : [];
  const hasJSON = langs.includes("JSON");
  const orderedLangs = hasJSON ? ["JSON", ...langs.filter((l) => l !== "JSON")] : langs;
  for (const lang of orderedLangs) {
    uniquePush(tokens, `language:${lang}`);
  }

  // 2) type:user
  uniquePush(tokens, "type:user");

  // 3) location (always quoted if present)
  if (extracted.location && extracted.location.trim()) {
    uniquePush(tokens, `location:"${titleCasePlace(extracted.location)}"`);
  }

  // 4) filters (if years mentioned)
  if (extracted.need_activity_filters) {
    uniquePush(tokens, "repos:>3");
    uniquePush(tokens, "followers:>5");
  }

  // 5) keywords (frameworks/tools)
  for (const kw of extracted.keywords ?? []) {
    const s = String(kw || "").trim();
    if (s) uniquePush(tokens, s);
  }

  return tokens.join(" ");
}

// ──────────────────────────────────────────────────────────────────────────────
// Public function: free text -> structured extraction -> exact query string
// (keeps the same export name/signature your app uses)
// ──────────────────────────────────────────────────────────────────────────────
export async function parsePlainText(text) {
  const structured = model.withStructuredOutput(ExtractionSchema, {
    name: "github_sourcing_fields",
  });

  const extracted = await structured.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: text },
  ]);

  const query = buildQuery(extracted);

  // Coerce undefined → null to preserve your original return shape
  const toNull = (v) => (v === undefined ? null : v);

  return {
    query,
    min_experience: toNull(extracted.min_experience),
    max_experience: toNull(extracted.max_experience),
    limit: toNull(extracted.limit),
  };
}
