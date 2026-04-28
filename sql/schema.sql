DROP TABLE IF EXISTS weather_data;
DROP TABLE IF EXISTS regions;

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weather_data (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL,
    date_time TIMESTAMP NOT NULL,
    temperature NUMERIC(6, 2),
    humidity NUMERIC(6, 2),
    precipitation NUMERIC(6, 2),
    wind_speed NUMERIC(6, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_region
        FOREIGN KEY (region_id)
        REFERENCES regions(id)
        ON DELETE CASCADE
);