# Proyecto final de la unidad API Node.js -- Desarrollamos una API REST con Node.js, Express, MySQL y JWT

## Índice


## Objetivos

Al finalizar la práctica, la aplicación deberá permitir:

* registrar usuarios normales e iniciar sesión;
* emitir y verificar JWT;
* proteger las consultas con autenticación;
* distinguir entre usuario autenticado y administrador;
* consultar ciudades, filtrar por nombre y encontrar las que tienen aeropuertos;
* consultar aeropuertos y relacionarlos con su ciudad;
* crear y modificar ciudades y aeropuertos como administrador;
* guardar los datos en MySQL mediante consultas parametrizadas;
* probar el contrato desde Postman o REST Client.


## Reglas funcionales

### Usuarios

* Cualquier persona puede registrarse como usuario normal.
* El registro no acepta un rol. La API asignará siempre el rol user.
* El login comprobará el correo y la contraseña y devolverá un JWT.
* Las consultas de ciudades y aeropuertos requieren un JWT válido.
* Solo el rol admin puede crear o modificar ciudades y aeropuertos.
* El endpoint de registro nunca puede crear administradores, aunque se envíe "role": "admin" en el cuerpo.
* Las contraseñas se guardan como hash con bcrypt. Nunca se devuelven en las respuestas.

### Ciudades y aeropuertos

* Una ciudad tiene nombre y país.
* Cada aeropuerto pertenece a una única ciudad.
* Una ciudad puede tener cero o varios aeropuertos.
* El código IATA de cada aeropuerto es único y consta de tres letras mayúsculas.
* Una búsqueda de ciudades por search busca coincidencias parciales en el nombre, sin distinguir mayúsculas y minúsculas.
* La modificación reemplaza los campos editables indicados en el cuerpo. Los identificadores se reciben en la URL y no se cambian.
* Esta fase no requiere operaciones de borrado.
