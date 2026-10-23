import express from "express";
import { config } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

const port = Number(process.env.PORT ?? 3000);
app.use(express.json());

// JSON a req.body
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) =>
  res.json({ name: "API Node.js operativa", express: true }),
);

// Ruta de salud
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(port, "0.0.0.0", () => console.log(`API escuchando en ${port}`));

// Todas las rutas de la APU cuelgan del prefijo
app.use(config.apiPrefix, apiRouters);

app.use(notFound);
app.use(errorHandler);
