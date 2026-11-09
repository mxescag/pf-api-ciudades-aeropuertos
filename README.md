# API de ciudades y aeropuertos

API REST desarrollada con Node.js, Express y MySQL. Para ejecutar la aplicación con la base de datos se utiliza Docker Compose.

## Requisitos

- Docker Engine y el complemento `docker compose`.
- Git, si se va a clonar el repositorio.

> **IMPORTANTE**: Los datos de los aeropuertos, aerolíneas y rutas provienen de [Openflights](https://openflights.org/data.php). Dataset histórico, consultado para uso educativo únicamente.


## Instalación y configuración

Clona el repositorio y entra en su directorio:

```bash
git clone <url-del-repositorio>
cd pf-api-ciudades-aeropuertos
```

Crea un archivo `.env` en la raíz del proyecto. Por ejemplo:

```dotenv
APP_PORT=3000
MYSQL_PORT=3306
MYSQL_DATABASE=dwes_airports
MYSQL_USER=dwes
MYSQL_PASSWORD=dwes
MYSQL_ROOT_PASSWORD=cambia-esta-clave
JWT_SECRET=pega-aqui-un-secreto-aleatorio
JWT_EXPIRES_IN=3600
```

Genera un secreto para JWT, en lugar de usar el texto de ejemplo:

```bash
openssl rand -base64 32
```

Copia el resultado en `JWT_SECRET`. El archivo `.env` contiene credenciales y no debe subirse al repositorio. Los valores de base de datos indicados son apropiados únicamente para desarrollo local.

## Carga de la base de datos

Al iniciar MySQL por primera vez, Docker Compose ejecuta automáticamente `database/init/schema.sql`. Este script crea la base de datos y las tablas, e inserta ciudades, aeropuertos y un usuario administrador de prueba.

Para crear e iniciar los contenedores:

```bash
docker compose up --build -d
```

MySQL conserva los datos en el volumen `mysql_data`. Por ello, el script de inicialización no vuelve a ejecutarse en cada arranque. Para consultar el estado:

```bash
docker compose ps
docker compose logs -f node mysql
```

Si necesitas volver a ejecutar la carga inicial desde cero, elimina el volumen de la base de datos y vuelve a iniciar los servicios:

```bash
docker compose down -v
docker compose up --build -d
```

> **Atención:** `docker compose down -v` elimina permanentemente los datos guardados en los volúmenes del proyecto.

## Arranque y comprobación

Con los servicios iniciados, la API queda disponible en `http://localhost:3000` (o en el puerto indicado por `APP_PORT`). Para seguir los registros:

```bash
docker compose logs -f node
```

Para parar los contenedores sin borrar la base de datos:

```bash
docker compose down
```

También se puede ejecutar la API directamente con Node.js 22 o superior: instala las dependencias con `npm install` y ejecuta `npm start`. En ese caso hace falta una instancia MySQL accesible y configurar en `.env` las variables `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET`. Para desarrollo, `npm run dev` inicia el servidor en modo de recarga automática.

Ejemplo de configuración para ejecución local sin Docker (ajusta los valores a tu instancia MySQL):

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dwes_airports
DB_USER=dwes
DB_PASSWORD=dwes
JWT_SECRET=pega-aqui-un-secreto-aleatorio
JWT_EXPIRES_IN=3600
```

En esta modalidad, crea la base de datos ejecutando `database/init/schema.sql` en MySQL antes de arrancar la API.

## Rutas y autenticación

- `POST /api/auth/register` y `POST /api/auth/login` son públicas. El registro crea usuarios con rol `user`; no permite asignar el rol de administrador desde el cuerpo de la petición.
- `GET /api/auth/me` requiere un token de acceso.
- Todas las rutas de `/api/cities` y `/api/airports` requieren autenticación.
- Las operaciones de escritura (`POST` y `PUT`) en ciudades y aeropuertos requieren además el rol `admin`.

Después de iniciar sesión, envía el token devuelto en la cabecera:

```http
Authorization: Bearer TU_TOKEN_JWT
```

El middleware de autenticación verifica la firma y la caducidad del JWT y obtiene el usuario y su rol desde la base de datos. El middleware de autorización rechaza las operaciones administrativas si el usuario no tiene rol `admin`. Sin autenticación se responde con `401`; sin permisos suficientes, con `403`.

Para pruebas locales, el esquema crea la cuenta `admin@aeropuertos.test` con contraseña `password`. Es una cuenta de desarrollo: no uses esas credenciales en un entorno real.

## Estructura del proyecto

```text
database/init/   Esquema y datos SQL ejecutados al inicializar MySQL
data/openflights/ Ficheros de datos de OpenFlights (no importados automáticamente)
docker/node/     Definición de la imagen Docker de Node.js
src/
  config/        Configuración y conexión con MySQL
  controllers/   Lógica de las operaciones HTTP
  middleware/    Autenticación, autorización y gestión de errores
  repositories/  Consultas y acceso a los datos
  routes/        Definición y protección de las rutas
  utils/         Utilidades compartidas, como errores HTTP
  validators/    Validación de los datos recibidos
  app.js         Configuración de Express y montaje de rutas
  server.js      Inicio del servidor
test/            Peticiones de ejemplo para probar la API
compose.yaml     Servicios de la API y MySQL
```

