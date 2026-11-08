import { GoogleGenAI } from "@google/genai";

/**
 * AI Client Foundation - Capcipcup SmartEdu
 * Mengambil API key dari environment variable (GEMINI_API_KEY) secara dinamis.
 * Token ini aman dan hanya boleh diakses di sisi server (Route Handler / Server Action).
 */

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

export const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

export function hasAiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
}

export function getAiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diisi di .env.local! Silakan tambahkan GEMINI_API_KEY=AIzaSy... di .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

export const aiClient = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getAiClient();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

/**
 * Helper pemanggil AI dengan fallback otomatis jika model tertentu mengalami 404/503
 */
export async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...params,
        model,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Fallback] Model ${model} gagal:`, err?.message || err);
    }
  }

  throw lastError;
}
