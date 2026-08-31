import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzerRouter } from "./server/analyzer";
import { suppliersRouter } from "./server/suppliers";
import { procurementRouter } from "./server/procurementRoutes";

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parsers with generous payload limit for tender documents & scans
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express body parser error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      error: "Объем загружаемых документов слишком велик (превышен предел 50 МБ). Уменьшите объем прикрепленных сканов/файлов или сжатие изображений."
    });
  }
  next(err);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount Modular API Routers
app.use("/api", analyzerRouter);
app.use("/api", suppliersRouter);
app.use("/api", procurementRouter);

// Vite Middleware & Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Сервер анализатора заявок запущен на http://localhost:${PORT}`);
  });
}

startServer();
