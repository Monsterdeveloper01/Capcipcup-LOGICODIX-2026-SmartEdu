import { GoogleGenAI } from "@google/genai";

/**
 * AI Client Foundation - Capcipcup SmartEdu
 * Mengambil API key dari environment variable (GEMINI_API_KEY) secara dinamis.
 * Token ini aman dan hanya boleh diakses di sisi server (Route Handler / Server Action).
 */

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
