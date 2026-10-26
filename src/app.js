import express from "express";
import authRoutes from "./routes/auth.routes.js";
// import cityRoutes from "./routes/city.routes.js";
// import airportRoutes from "./routes/airport.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
// app.use("/api/cities", cityRoutes);
// app.use("/api/airports", airportRoutes);

app.use((req, res) => {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Ruta no encontrada." } });
});
app.use(errorHandler);

export default app;
