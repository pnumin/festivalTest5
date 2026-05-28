import type { IncomingMessage, ServerResponse } from "http";

// In-Memory cache for the API calls
interface CacheEntry {
  data: any;
  timestamp: number;
}

let festivalCache: CacheEntry | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

// Helper to determine the correct service key encoding
const getServiceKey = (): string => {
  const key = process.env.FESTIVAL_API_KEY || "8qw7g%2FC%2BMGd2iRqEvb%2FEx0Sg3ZwAAsnS%2FQ7rRaU3l4UUYfNWgyAbYpNw541yy9pueEvoCcNwmCww8ss32BBWEA%3D%3D";
  
  // If the key is already URL-encoded (contains % signs), use it as is.
  // Otherwise, encode it to be safe.
  if (key.includes("%")) {
    return key;
  }
  return encodeURIComponent(key);
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set CORS and JSON content headers
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const now = Date.now();
    
    // Serve from cache if valid
    if (festivalCache && (now - festivalCache.timestamp < CACHE_DURATION_MS)) {
      console.log("[API] Serving festival data from cache");
      res.statusCode = 200;
      res.end(JSON.stringify(festivalCache.data));
      return;
    }

    const serviceKey = getServiceKey();
    const apiUrl = `https://apis.data.go.kr/6260000/FestivalService/getFestivalKr?serviceKey=${serviceKey}&pageNo=1&numOfRows=100&resultType=json`;

    console.log("[API] Fetching fresh festival data from public portal");
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Public API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Verify format and items exist
    if (!data || !data.getFestivalKr || !data.getFestivalKr.item) {
      throw new Error("Invalid response schema from public portal API. Header or items are missing.");
    }

    // Cache the data and return
    festivalCache = {
      data,
      timestamp: now
    };

    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error: any) {
    console.error("[API Error] Failed to fetch festival data:", error.message);
    
    // If we have stale cache, serve it on error
    if (festivalCache) {
      console.log("[API] Server error occurred, fell back to stale cache");
      res.statusCode = 200;
      res.end(JSON.stringify(festivalCache.data));
      return;
    }

    res.statusCode = 500;
    res.end(JSON.stringify({
      error: "부산 축제 정보 데이터를 불러오는 도중 오류가 발생했습니다.",
      details: error.message
    }));
  }
}
