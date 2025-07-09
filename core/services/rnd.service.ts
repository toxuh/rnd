"use server";
import axios from "axios";
import { createHash } from "crypto";

interface HashOptions {
  input: string;
  offset?: number;
  length?: number;
}

const RND_SERVER_URL = process.env.RND_SERVER_URL;

// Fallback pseudo-random generator
const generateFallbackString = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${timestamp}-${random}-${randomBytes}`;
};

// Health check for ESP32 server
let esp32HealthStatus = { isHealthy: true, lastCheck: 0 };
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

const checkESP32Health = async (): Promise<boolean> => {
  const now = Date.now();

  // Only check health every minute
  if (now - esp32HealthStatus.lastCheck < HEALTH_CHECK_INTERVAL) {
    return esp32HealthStatus.isHealthy;
  }

  if (!RND_SERVER_URL) {
    esp32HealthStatus = { isHealthy: false, lastCheck: now };
    return false;
  }

  try {
    // Use the actual endpoint that exists on ESP32 for health check
    const response = await axios.get(`${RND_SERVER_URL}/get-random-string`, { timeout: 5000 });
    esp32HealthStatus = { isHealthy: response.status === 200 && response.data, lastCheck: now };
    return esp32HealthStatus.isHealthy;
  } catch (error) {
    console.warn("ESP32 health check failed:", error);
    esp32HealthStatus = { isHealthy: false, lastCheck: now };
    return false;
  }
};

const getInitialString = async (): Promise<string> => {
  // Check ESP32 health first
  const isESP32Healthy = await checkESP32Health();

  if (!isESP32Healthy || !RND_SERVER_URL) {
    console.warn("ESP32 unavailable, using fallback pseudo-random generation");
    return generateFallbackString();
  }

  try {
    const response = await axios.get<string>(
      `${RND_SERVER_URL}/get-random-string`,
      { timeout: 10000 } // 10 second timeout
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch random string from ESP32, using fallback:", error);
    // Mark ESP32 as unhealthy for next check
    esp32HealthStatus = { isHealthy: false, lastCheck: Date.now() };
    return generateFallbackString();
  }
};

const getHashBits = ({
  input,
  offset = 0,
  length = 8,
}: Readonly<HashOptions>): number => {
  const hash = createHash("sha256").update(input).digest("hex");
  return parseInt(hash.slice(offset, offset + length), 16);
};



export const randomNumber = async (
  min: number,
  max: number,
): Promise<number> => {
  if (typeof min !== "number" || typeof max !== "number") {
    throw new Error("min and max must be numbers");
  }

  if (min > max) {
    throw new Error("min cannot be greater than max");
  }

  const input = await getInitialString();
  const bits = getHashBits({ input, offset: 0, length: 8 });
  return min + (bits % (max - min + 1));
};

export const randomBoolean = async (): Promise<boolean> => {
  const input = await getInitialString();
  const bits = getHashBits({ input, offset: 8, length: 2 });
  return Boolean(bits % 2);
};

export const randomFloat = async (
  min: number = 0,
  max: number = 1,
): Promise<number> => {
  const input = await getInitialString();
  const bits = getHashBits({ input, offset: 10, length: 8 });
  const frac = bits / 0xffffffff;
  return min + frac * (max - min);
};

export const randomChoice = async <T>(arr: readonly T[]): Promise<T> => {
  if (!arr || arr.length === 0) {
    throw new Error("Array cannot be empty");
  }

  const input = await getInitialString();
  const bits = getHashBits({ input, offset: 18, length: 8 });
  return arr[bits % arr.length];
};

export const randomString = async (
  length: number,
  chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
): Promise<string> => {
  if (length < 0) {
    throw new Error("Length cannot be negative");
  }

  if (length === 0) {
    return "";
  }

  const input = await getInitialString();
  let out = "";
  for (let i = 0; i < length; i++) {
    const bits = getHashBits({ input: input + i, offset: 0, length: 8 });
    out += chars[bits % chars.length];
  }
  return out;
};

export const randomHex = async (length: number): Promise<string> => {
  if (length < 0) {
    throw new Error("Length cannot be negative");
  }
  if (length === 0) {
    return "";
  }

  const input = await getInitialString();
  let out = "";
  const chars = "0123456789abcdef";

  for (let i = 0; i < length; i++) {
    const bits = getHashBits({ input: input + i, offset: 0, length: 4 });
    out += chars[bits % chars.length];
  }
  return out;
};

export const randomHexColor = async (): Promise<`#${string}`> => {
  const input = await getInitialString();
  const hash = createHash("sha256").update(input).digest("hex");
  return `#${hash.slice(0, 6)}`;
};

export const randomDate = async (from: Date, to: Date): Promise<Date> => {
  const input = await getInitialString();
  const range = to.getTime() - from.getTime();
  const bits = getHashBits({ input, offset: 10, length: 8 });
  const frac = bits / 0xffffffff;
  return new Date(from.getTime() + Math.floor(frac * range));
};

export const randomUUIDv4 = async (): Promise<string> => {
  const input = await getInitialString();
  const h = createHash("sha256").update(input).digest("hex");
  // format 8-4-4-4-12; set version 4 and variant bits
  const part1 = h.slice(0, 8);
  const part2 = h.slice(8, 12);
  const part3 = "4" + h.slice(13, 16);
  const variant = (parseInt(h[16], 16) & 0b11) | 0b10;
  const part4 = variant.toString(16) + h.slice(17, 20);
  const part5 = h.slice(20, 32);
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
};

// simple LCG for shuffle
const lcg = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state;
  };
};

export const shuffle = async <T>(arr: readonly T[]): Promise<T[]> => {
  const input = await getInitialString();
  const seed = getHashBits({ input, offset: 0, length: 8 });
  const rand = lcg(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand() % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const weightedChoice = async <T>(
  items: readonly [T, number][],
): Promise<T> => {
  const input = await getInitialString();
  const total = items.reduce((s, [, w]) => s + w, 0);
  const bits = getHashBits({ input, offset: 10, length: 8 });
  const frac = bits / 0xffffffff;
  let r = frac * total;
  for (const [item, weight] of items) {
    if (r < weight) return item;
    r -= weight;
  }
  return items[items.length - 1][0];
};

export const randomHslColor =
  async (): Promise<`hsl(${number}, ${number}%, ${number}%)`> => {
    const input = await getInitialString();
    const h = getHashBits({ input, offset: 8, length: 4 }) % 360;
    const s = 50 + (getHashBits({ input, offset: 12, length: 2 }) % 51);
    const l = 40 + (getHashBits({ input, offset: 14, length: 2 }) % 41);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

export const randomGradient = async (): Promise<string> => {
  const input = await getInitialString();
  const hash1 = createHash("sha256")
    .update(input + "a")
    .digest("hex");
  const hash2 = createHash("sha256")
    .update(input + "b")
    .digest("hex");
  const c1 = `#${hash1.slice(0, 6)}`;
  const c2 = `#${hash2.slice(0, 6)}`;
  return `linear-gradient(${c1}, ${c2})`;
};

export const randomPassword = async (length: number): Promise<string> => {
  const input = await getInitialString();
  let out = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]";
  for (let i = 0; i < length; i++) {
    const bits = getHashBits({
      input: input + "pwd" + i,
      offset: 0,
      length: 8,
    });
    out += chars[bits % chars.length];
  }
  return out;
};
