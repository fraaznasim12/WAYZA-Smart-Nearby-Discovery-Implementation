-- =============================================================================
-- V5__extend_places_table.sql
-- AccessMap — Extend Places with Description, State, Postal Code & Categories
-- =============================================================================

-- 1. Add description, state, and postal_code columns
ALTER TABLE places
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30);

-- 2. Expand category check constraint to support additional venue categories
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_category_check;
ALTER TABLE places ADD CONSTRAINT places_category_check CHECK (category IN (
    'HOSPITAL', 'COLLEGE', 'TRANSIT_STATION',
    'RESTAURANT', 'PUBLIC_OFFICE', 'SHOPPING_MALL',
    'CAFE', 'LIBRARY', 'PARK', 'RETAIL', 'THEATER', 'OTHER'
));

-- 3. Add index on city for sub-10ms city-level discovery
CREATE INDEX IF NOT EXISTS idx_places_city ON places (city);

-- 4. Seed additional realistic venue records with coordinates and cities
INSERT INTO places (id, name, category, description, address, city, state, postal_code, country, geom, is_active) VALUES
(
    gen_random_uuid(),
    'Metro Central Library',
    'LIBRARY',
    'Historic public library with extensive collections and digital media lab.',
    '12 Knowledge Circle, Civic Center',
    'Metro City',
    'Maharashtra',
    '400001',
    'India',
    ST_SetSRID(ST_MakePoint(72.8720, 19.0735), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'Greenfield Botanical Gardens',
    'PARK',
    'Expansive public park featuring paved walkways, sensory gardens, and open lawns.',
    '45 Garden Boulevard, Green Valley',
    'Metro City',
    'Maharashtra',
    '400050',
    'India',
    ST_SetSRID(ST_MakePoint(72.8610, 19.0620), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'The Artisan Roastery & Cafe',
    'CAFE',
    'Specialty coffee shop and community co-working space.',
    '88 High Street, Bandra West',
    'Metro City',
    'Maharashtra',
    '400050',
    'India',
    ST_SetSRID(ST_MakePoint(72.8360, 19.0580), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'National Performing Arts Theater',
    'THEATER',
    'Multi-tier cultural venue hosting plays, symphonies, and public lectures.',
    '200 Marine Drive, Nariman Point',
    'Metro City',
    'Maharashtra',
    '400021',
    'India',
    ST_SetSRID(ST_MakePoint(72.8220, 18.9280), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'Apex Super-Specialty Medical Clinic',
    'HOSPITAL',
    'Outpatient multispecialty medical center with 24/7 emergency response.',
    '500 Ring Road, Andheri East',
    'Metro City',
    'Maharashtra',
    '400069',
    'India',
    ST_SetSRID(ST_MakePoint(72.8680, 19.1130), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'Connaught Heritage Pavilion',
    'RETAIL',
    'Colonnaded commercial center with shopping arcades and outdoor dining.',
    'Inner Circle, Connaught Place',
    'New Delhi',
    'Delhi',
    '110001',
    'India',
    ST_SetSRID(ST_MakePoint(77.2197, 28.6328), 4326),
    TRUE
),
(
    gen_random_uuid(),
    'Indira Gandhi Memorial Transit Terminal',
    'TRANSIT_STATION',
    'High-speed multi-modal transit hub connecting airport metro and commuter lines.',
    'Airport Express Corridor',
    'New Delhi',
    'Delhi',
    '110037',
    'India',
    ST_SetSRID(ST_MakePoint(77.0860, 28.5562), 4326),
    TRUE
);

