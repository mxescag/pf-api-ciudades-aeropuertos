import express from "express";
import authRouter from "./routes/auth.routes.js";
import cityRouter from "./routes/city.routes.js";
import airportRouter from "./routes/airport.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/cities", cityRouter);
app.use("/api/airports", airportRouter);

app.use((req, res) => {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Ruta no encontrada." } });
});
app.use(errorHandler);

export default app;
