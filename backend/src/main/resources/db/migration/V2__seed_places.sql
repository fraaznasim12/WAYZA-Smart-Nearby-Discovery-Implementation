-- =============================================================================
-- V2__seed_places.sql
-- AccessMap — Seed Data: Sample Venues for Local Development & Testing
--
-- Provides realistic sample places with PostGIS geometry coordinates.
-- Uses ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) — note: X=lng, Y=lat.
--
-- These are illustrative records only. No real-world accessibility claims are made.
-- =============================================================================

-- Insert sample places with spatial coordinates
INSERT INTO places (id, name, category, address, city, country, geom) VALUES
(
    gen_random_uuid(),
    'City Central Hospital',
    'HOSPITAL',
    '1 Hospital Road, Central District',
    'Metro City',
    'India',
    ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)
),
(
    gen_random_uuid(),
    'Metropolitan University — Main Campus',
    'COLLEGE',
    '450 University Avenue, Academic Quarter',
    'Metro City',
    'India',
    ST_SetSRID(ST_MakePoint(72.8856, 19.0820), 4326)
),
(
    gen_random_uuid(),
    'Central Railway Terminal',
    'TRANSIT_STATION',
    '1 Station Plaza, Downtown',
    'Metro City',
    'India',
    ST_SetSRID(ST_MakePoint(72.8347, 18.9402), 4326)
),
(
    gen_random_uuid(),
    'City Civic Centre & District Offices',
    'PUBLIC_OFFICE',
    '100 Administrative Boulevard, Government Quarter',
    'Metro City',
    'India',
    ST_SetSRID(ST_MakePoint(72.8650, 19.0570), 4326)
),
(
    gen_random_uuid(),
    'Grand Metro Shopping Mall',
    'SHOPPING_MALL',
    '88 Commerce Ring Road, Shopping District',
    'Metro City',
    'India',
    ST_SetSRID(ST_MakePoint(72.8900, 19.0680), 4326)
);

