import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache limiter instances by max-count — one Ratelimit object per distinct limit value
const cache = new Map<number, Ratelimit>();

function getLimiter(max: number): Ratelimit {
  if (!cache.has(max)) {
    cache.set(max, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, "1 m"),
      analytics: false,
    }));
  }
  return cache.get(max)!;
}

export async function checkRateLimit(key: string, max: number): Promise<boolean> {
  const { success } = await getLimiter(max).limit(key);
  return success;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
