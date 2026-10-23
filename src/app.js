import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);
app.use(express.json());
app.get("/", (_req, res) => res.json({ name: "API Node.js operativa", express: true }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(port, "0.0.0.0", () => console.log(`API escuchando en ${port}`));
