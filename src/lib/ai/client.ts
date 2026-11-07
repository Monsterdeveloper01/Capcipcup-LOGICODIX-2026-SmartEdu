import { GoogleGenAI } from "@google/genai";

/**
 * AI Client Foundation
 * Mengambil API key dari environment variable (GEMINI_API_KEY).
 * Token ini aman dan hanya boleh diakses di sisi server (Server Action / Route Handler).
 */
const apiKey = process.env.GEMINI_API_KEY || "";

export const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

export function hasAiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
}

