import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import festivalsHandler from "./api/festivals";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON middleware
app.use(express.json());

// Main API proxy route for Busan Festival Information (Delegated to the Vercel Serverless Handler)
app.get("/api/festivals", async (req, res) => {
  try {
    await festivalsHandler(req, res);
  } catch (error: any) {
    console.error("[Server Error Delegation]", error.message);
    res.status(500).json({
      error: "내부 대항 중 오류가 발생했습니다.",
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
