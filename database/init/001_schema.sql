CREATE DATABASE IF NOT EXISTS dwes_airports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dwes_airports;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS cities (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    country VARCHAR(120) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cities_name (name)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS airports (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    iata_code CHAR(3) NOT NULL,
    name VARCHAR(180) NOT NULL,
    city_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_airports_iata_code (iata_code),
    KEY idx_airports_city_id (city_id),
    CONSTRAINT fk_airports_city FOREIGN KEY (city_id) REFERENCES cities (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

INSERT INTO
    cities (id, name, country)
VALUES (1, 'Madrid', 'España'),
    (2, 'Barcelona', 'España'),
    (3, 'París', 'Francia'),
    (4, 'Teruel', 'España')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    country = VALUES(country);

INSERT INTO
    airports (iata_code, name, city_id)
VALUES (
        'MAD',
        'Adolfo Suárez Madrid-Barajas',
        1
    ),
    (
        'BCN',
        'Josep Tarradellas Barcelona-El Prat',
        2
    ),
    ('ORY', 'París-Orly', 3),
    (
        'CDG',
        'París-Charles de Gaulle',
        3
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    city_id = VALUES(city_id);

-- Cuenta de desarrollo para realizar las pruebas de administración.
-- Correo: admin@aeropuertos.test
-- Contraseña: password
-- No reutilices esta contraseña fuera del entorno de prácticas.
INSERT INTO
    users (
        name,
        email,
        password_hash,
        role
    )
VALUES (
        'Administración',
        'admin@aeropuertos.test',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'admin'
    )
ON DUPLICATE KEY UPDATE
    role = 'admin';