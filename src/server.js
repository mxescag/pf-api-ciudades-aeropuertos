import { app } from "./app.js";
import {
  checkDatabaseConnection,
  closeDatabasePool,
} from "./config/database.js";
import { env } from "./config/env.js";

let server;

/* Inicio */
async function start() {
  await checkDatabaseConnection();

  server = app.listen(env.port, () => {
    console.log(`API disponible en http://localhost:${env.port}`);
    console.log("Conexión con MySQL verificada");
  });
}

/* Apagado */
async function shutdown(signal) {
  console.log(`\nRecibida señal ${signal}`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await closeDatabasePool();
  console.log("Servidor y pool cerrados");
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error(error);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error(error);
    process.exit(1);
  });
});

/* Errores */
start().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error);
  process.exit(1);
});
