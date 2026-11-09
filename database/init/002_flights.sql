USE dwes_airports;

UPDATE cities SET country = 'Spain' WHERE country = 'España';

UPDATE cities SET country = 'France' WHERE country = 'Francia';

-- Identificador de la fila de airports.dat. NULL en aeropuertos creados a mano.
ALTER TABLE airports
ADD COLUMN openflights_id INT UNSIGNED NULL,
ADD COLUMN icao_code CHAR(4) NULL,
ADD UNIQUE KEY uq_airports_openflights_id (openflights_id);

CREATE TABLE airlines (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    openflights_id INT UNSIGNED NOT NULL,
    name VARCHAR(180) NOT NULL,
    iata_code VARCHAR(2) NULL,
    icao_code VARCHAR(3) NULL,
    country VARCHAR(120) NULL,
    active CHAR(1) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_airlines_openflights_id (openflights_id)
) ENGINE = InnoDB;

CREATE TABLE flights (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    airline_id INT UNSIGNED NULL,
    source_airport_id INT UNSIGNED NOT NULL,
    destination_airport_id INT UNSIGNED NOT NULL,
    codeshare BOOLEAN NOT NULL DEFAULT FALSE,
    stops SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    equipment VARCHAR(100) NULL,
    source_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_flights_source_key (source_key),
    KEY idx_flights_source_destination (
        source_airport_id,
        destination_airport_id
    ),
    KEY idx_flights_destination (destination_airport_id),
    KEY idx_flights_airline (airline_id),
    CONSTRAINT fk_flights_airline FOREIGN KEY (airline_id) REFERENCES airlines (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_flights_source_airport FOREIGN KEY (source_airport_id) REFERENCES airports (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_flights_destination_airport FOREIGN KEY (destination_airport_id) REFERENCES airports (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_flights_different_airports CHECK (
        source_airport_id <> destination_airport_id
    )
) ENGINE = InnoDB;