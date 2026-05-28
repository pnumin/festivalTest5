import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON middleware
app.use(express.json());

// In-Memory cache for the API calls to avoid hitting Public Data Portal limits and speed up responses
interface CacheEntry {
  data: any;
  timestamp: number;
}

let festivalCache: CacheEntry | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

// Helper to determine the correct service key encoding
const getServiceKey = (): string => {
  const key = process.env.FESTIVAL_API_KEY || "8qw7g%2FC%2BMGd2iRqEvb%2FEx0Sg3ZwAAsnS%2FQ7rRaU3l4UUYfNWgyAbYpNw541yy9pueEvoCcNwmCww8ss32BBWEA%3D%3D";
  
  // If the key is already URL-encoded (contains % signs and of proper length), use it as is.
  // Otherwise, encode it to be safe.
  if (key.includes("%")) {
    return key;
  }
  return encodeURIComponent(key);
};

// Main API proxy route for Busan Festival Information
app.get("/api/festivals", async (req, res) => {
  try {
    const now = Date.now();
    
    // Serve from cache if valid
    if (festivalCache && (now - festivalCache.timestamp < CACHE_DURATION_MS)) {
      console.log("[Server] Serving festival data from cache");
      return res.json(festivalCache.data);
    }

    const serviceKey = getServiceKey();
    const apiUrl = `https://apis.data.go.kr/6260000/FestivalService/getFestivalKr?serviceKey=${serviceKey}&pageNo=1&numOfRows=100&resultType=json`;

    console.log("[Server] Fetching fresh festival data from public portal");
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

    res.json(data);
  } catch (error: any) {
    console.error("[Server Error] Failed to fetch festival data:", error.message);
    
    // If we have stale cache, serve it on error
    if (festivalCache) {
      console.log("[Server] Server error occurred, fell back to stale cache");
      return res.json(festivalCache.data);
    }

    res.status(500).json({
      error: "부산 축제 정보 데이터를 불러오는 도중 오류가 발생했습니다.",
      details: error.message
    });
  }
});

// Start integration with Vite or production file serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite developer middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving production static assets from dist/");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Critical server initialization failure:", err);
});
