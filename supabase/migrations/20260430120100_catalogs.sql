-- =============================================================================
-- Migration 002 — Stammdaten-Kataloge
-- =============================================================================
-- Legt sechs Katalog-Tabellen an, die als kontrolliertes Vokabular fuer Kaffees
-- (und spaeter fuer Kunden) dienen. Alle Kataloge folgen demselben Muster:
--   * uuid-PK mit gen_random_uuid()
--   * eindeutiger slug (technischer Identifier wie 'choco_dark')
--   * mehrsprachige Anzeigenamen (name_de Pflicht, name_en/name_fr optional)
--   * sort_order fuer Anzeige-Reihenfolge
--   * active fuer "weiches" Ausblenden (statt deleted_at, da keine Kundendaten)
--   * created_at / updated_at via trigger
-- RLS-Policy: alle duerfen lesen wenn active=true; nur service_role darf schreiben.
-- =============================================================================


-- 1) Aromen-Katalog -----------------------------------------------------------
create table public.flavor_notes_catalog (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_de     text not null,
  name_en     text,
  name_fr     text,
  family      text not null,                          -- 'fruity','nutty','floral','spicy','chocolate','sugary','roasted','earthy','other'
  subfamily   text,                                   -- z.B. 'berry','citrus','stone_fruit'
  sort_order  smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index flavor_notes_catalog_family_idx
  on public.flavor_notes_catalog(family) where active;

create trigger trg_flavor_notes_catalog_updated_at
  before update on public.flavor_notes_catalog
  for each row execute function public.set_updated_at();

alter table public.flavor_notes_catalog enable row level security;

create policy "flavor_notes_catalog_read_active"
  on public.flavor_notes_catalog for select
  to anon, authenticated
  using (active = true);

create policy "flavor_notes_catalog_write_service"
  on public.flavor_notes_catalog for all
  to service_role
  using (true) with check (true);


-- 2) Zubereitungsmethoden-Katalog --------------------------------------------
create table public.brewing_methods_catalog (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name_de           text not null,
  name_en           text,
  category          text not null
                    check (category in ('espresso','filter','immersion','other')),
  recommended_grind text                                -- 'extra_fine','fine','medium_fine','medium','medium_coarse','coarse'
                    check (recommended_grind is null or recommended_grind in
                          ('extra_fine','fine','medium_fine','medium','medium_coarse','coarse')),
  sort_order        smallint not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_brewing_methods_catalog_updated_at
  before update on public.brewing_methods_catalog
  for each row execute function public.set_updated_at();

alter table public.brewing_methods_catalog enable row level security;

create policy "brewing_methods_catalog_read_active"
  on public.brewing_methods_catalog for select
  to anon, authenticated
  using (active = true);

create policy "brewing_methods_catalog_write_service"
  on public.brewing_methods_catalog for all
  to service_role
  using (true) with check (true);


-- 3) Herkunftslaender-Katalog ------------------------------------------------
create table public.origins_catalog (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,                       -- 'ethiopia','colombia','brazil', ...
  name_de     text not null,
  name_en     text,
  iso_code    char(2) unique not null,                    -- ISO 3166-1 alpha-2: 'ET','CO','BR'
  continent   text not null
              check (continent in ('africa','americas','asia','oceania','europe')),
  sort_order  smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_origins_catalog_updated_at
  before update on public.origins_catalog
  for each row execute function public.set_updated_at();

alter table public.origins_catalog enable row level security;

create policy "origins_catalog_read_active"
  on public.origins_catalog for select
  to anon, authenticated
  using (active = true);

create policy "origins_catalog_write_service"
  on public.origins_catalog for all
  to service_role
  using (true) with check (true);


-- 4) Varietaeten-Katalog ------------------------------------------------------
create table public.varieties_catalog (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,                            -- meist nur ein Eigenname (Bourbon, Geisha)
  species         text not null
                  check (species in ('arabica','robusta','liberica','excelsa','hybrid')),
  parent_variety  text,                                     -- z.B. 'Catuai' ist Mutation aus Caturra+Mundo Novo
  notes           text,
  sort_order      smallint not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_varieties_catalog_updated_at
  before update on public.varieties_catalog
  for each row execute function public.set_updated_at();

alter table public.varieties_catalog enable row level security;

create policy "varieties_catalog_read_active"
  on public.varieties_catalog for select
  to anon, authenticated
  using (active = true);

create policy "varieties_catalog_write_service"
  on public.varieties_catalog for all
  to service_role
  using (true) with check (true);


-- 5) Aufbereitungsmethoden-Katalog --------------------------------------------
create table public.processing_methods_catalog (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_de     text not null,
  name_en     text,
  category    text not null
              check (category in ('washed','natural','honey','anaerobic','other')),
  notes       text,
  sort_order  smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_processing_methods_catalog_updated_at
  before update on public.processing_methods_catalog
  for each row execute function public.set_updated_at();

alter table public.processing_methods_catalog enable row level security;

create policy "processing_methods_catalog_read_active"
  on public.processing_methods_catalog for select
  to anon, authenticated
  using (active = true);

create policy "processing_methods_catalog_write_service"
  on public.processing_methods_catalog for all
  to service_role
  using (true) with check (true);


-- 6) Zertifikate-Katalog ------------------------------------------------------
create table public.certifications_catalog (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  issuer      text,                                          -- z.B. 'Bio Suisse', 'FLO', 'USDA'
  logo_url    text,
  description text,
  sort_order  smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_certifications_catalog_updated_at
  before update on public.certifications_catalog
  for each row execute function public.set_updated_at();

alter table public.certifications_catalog enable row level security;

create policy "certifications_catalog_read_active"
  on public.certifications_catalog for select
  to anon, authenticated
  using (active = true);

create policy "certifications_catalog_write_service"
  on public.certifications_catalog for all
  to service_role
  using (true) with check (true);


-- =============================================================================
-- Seed-Daten
-- =============================================================================
-- Werden via INSERT ... ON CONFLICT DO NOTHING eingefuegt: idempotent, d.h.
-- die Migration kann bei Bedarf erneut ausgefuehrt werden, ohne Duplikate.
-- =============================================================================

-- Aromen (gekuerzt, repraesentativ pro Familie) -------------------------------
insert into public.flavor_notes_catalog (slug, name_de, name_en, family, subfamily, sort_order) values
  ('choco_dark',        'Dunkle Schokolade', 'Dark Chocolate',   'chocolate', null,         10),
  ('choco_milk',        'Milchschokolade',   'Milk Chocolate',   'chocolate', null,         20),
  ('cocoa',             'Kakao',             'Cocoa',            'chocolate', null,         30),
  ('berry_blueberry',   'Heidelbeere',       'Blueberry',        'fruity',    'berry',     100),
  ('berry_strawberry',  'Erdbeere',          'Strawberry',       'fruity',    'berry',     110),
  ('berry_blackberry',  'Brombeere',         'Blackberry',       'fruity',    'berry',     120),
  ('citrus_orange',     'Orange',            'Orange',           'fruity',    'citrus',    130),
  ('citrus_lemon',      'Zitrone',           'Lemon',            'fruity',    'citrus',    140),
  ('citrus_grapefruit', 'Grapefruit',        'Grapefruit',       'fruity',    'citrus',    150),
  ('stone_peach',       'Pfirsich',          'Peach',            'fruity',    'stone_fruit',160),
  ('stone_apricot',     'Aprikose',          'Apricot',          'fruity',    'stone_fruit',170),
  ('stone_cherry',      'Kirsche',           'Cherry',           'fruity',    'stone_fruit',180),
  ('tropical_pineapple','Ananas',            'Pineapple',        'fruity',    'tropical',  190),
  ('tropical_mango',    'Mango',             'Mango',            'fruity',    'tropical',  200),
  ('nuts_hazelnut',     'Haselnuss',         'Hazelnut',         'nutty',     null,        300),
  ('nuts_almond',       'Mandel',            'Almond',           'nutty',     null,        310),
  ('nuts_walnut',       'Walnuss',           'Walnut',           'nutty',     null,        320),
  ('caramel',           'Karamell',          'Caramel',          'sugary',    null,        400),
  ('honey',             'Honig',             'Honey',            'sugary',    null,        410),
  ('brown_sugar',       'Brauner Zucker',    'Brown Sugar',      'sugary',    null,        420),
  ('floral_jasmine',    'Jasmin',            'Jasmine',          'floral',    null,        500),
  ('floral_rose',       'Rose',              'Rose',             'floral',    null,        510),
  ('floral_bergamot',   'Bergamotte',        'Bergamot',         'floral',    null,        520),
  ('spicy_cinnamon',    'Zimt',              'Cinnamon',         'spicy',     null,        600),
  ('spicy_clove',       'Nelke',             'Clove',            'spicy',     null,        610),
  ('roasted_toast',     'Toast',             'Toasted',          'roasted',   null,        700),
  ('roasted_tobacco',   'Tabak',             'Tobacco',          'roasted',   null,        710),
  ('earthy_woody',      'Holzig',            'Woody',            'earthy',    null,        800),
  ('earthy_herbal',     'Kräutrig',          'Herbal',           'earthy',    null,        810),
  ('vanilla',           'Vanille',           'Vanilla',          'sugary',    null,        430)
on conflict (slug) do nothing;


-- Zubereitungsmethoden -------------------------------------------------------
insert into public.brewing_methods_catalog (slug, name_de, name_en, category, recommended_grind, sort_order) values
  ('espresso',     'Espresso',      'Espresso',     'espresso',  'fine',         10),
  ('fully_auto',   'Vollautomat',   'Bean-to-cup',  'espresso',  'fine',         20),
  ('moka',         'Moka-Kanne',    'Moka Pot',     'other',     'fine',         30),
  ('v60',          'Hario V60',     'Hario V60',    'filter',    'medium_fine',  40),
  ('chemex',       'Chemex',        'Chemex',       'filter',    'medium',       50),
  ('kalita',       'Kalita Wave',   'Kalita Wave',  'filter',    'medium',       60),
  ('aeropress',    'AeroPress',     'AeroPress',    'immersion', 'medium_fine',  70),
  ('frenchpress',  'French Press',  'French Press', 'immersion', 'coarse',       80),
  ('cold_brew',    'Cold Brew',     'Cold Brew',    'immersion', 'coarse',       90),
  ('siphon',       'Siphon',        'Siphon',       'other',     'medium',      100)
on conflict (slug) do nothing;


-- Herkunftslaender (Spezialitaetenkaffee-Top-Origins) -------------------------
insert into public.origins_catalog (slug, name_de, name_en, iso_code, continent, sort_order) values
  ('ethiopia',     'Äthiopien',     'Ethiopia',     'ET', 'africa',    10),
  ('kenya',        'Kenia',         'Kenya',        'KE', 'africa',    20),
  ('rwanda',       'Ruanda',        'Rwanda',       'RW', 'africa',    30),
  ('burundi',      'Burundi',       'Burundi',      'BI', 'africa',    40),
  ('uganda',       'Uganda',        'Uganda',       'UG', 'africa',    50),
  ('tanzania',     'Tansania',      'Tanzania',     'TZ', 'africa',    60),
  ('brazil',       'Brasilien',     'Brazil',       'BR', 'americas',  70),
  ('colombia',     'Kolumbien',     'Colombia',     'CO', 'americas',  80),
  ('costa_rica',   'Costa Rica',    'Costa Rica',   'CR', 'americas',  90),
  ('el_salvador',  'El Salvador',   'El Salvador',  'SV', 'americas', 100),
  ('guatemala',    'Guatemala',     'Guatemala',    'GT', 'americas', 110),
  ('honduras',     'Honduras',      'Honduras',     'HN', 'americas', 120),
  ('mexico',       'Mexiko',        'Mexico',       'MX', 'americas', 130),
  ('nicaragua',    'Nicaragua',     'Nicaragua',    'NI', 'americas', 140),
  ('panama',       'Panama',        'Panama',       'PA', 'americas', 150),
  ('peru',         'Peru',          'Peru',         'PE', 'americas', 160),
  ('bolivia',      'Bolivien',      'Bolivia',      'BO', 'americas', 170),
  ('ecuador',      'Ecuador',       'Ecuador',      'EC', 'americas', 180),
  ('indonesia',    'Indonesien',    'Indonesia',    'ID', 'asia',     190),
  ('vietnam',      'Vietnam',       'Vietnam',      'VN', 'asia',     200),
  ('india',        'Indien',        'India',        'IN', 'asia',     210),
  ('yemen',        'Jemen',         'Yemen',        'YE', 'asia',     220),
  ('papua_ng',     'Papua-Neuguinea','Papua New Guinea','PG','oceania',230)
on conflict (slug) do nothing;


-- Varietaeten ----------------------------------------------------------------
insert into public.varieties_catalog (slug, name, species, parent_variety, sort_order) values
  ('typica',      'Typica',          'arabica', null,        10),
  ('bourbon',     'Bourbon',         'arabica', 'Typica',    20),
  ('caturra',     'Caturra',         'arabica', 'Bourbon',   30),
  ('catuai',      'Catuaí',          'arabica', 'Caturra',   40),
  ('mundo_novo',  'Mundo Novo',      'arabica', 'Bourbon',   50),
  ('pacamara',    'Pacamara',        'arabica', 'Pacas',     60),
  ('pacas',       'Pacas',           'arabica', 'Bourbon',   70),
  ('maragogype',  'Maragogype',      'arabica', 'Typica',    80),
  ('sl28',        'SL28',            'arabica', 'Bourbon',   90),
  ('sl34',        'SL34',            'arabica', null,       100),
  ('geisha',      'Geisha (Gesha)',  'arabica', null,       110),
  ('castillo',    'Castillo',        'arabica', null,       120),
  ('colombia',    'Colombia',        'arabica', null,       130),
  ('heirloom',    'Heirloom',        'arabica', null,       140),
  ('robusta',     'Robusta',         'robusta', null,       200)
on conflict (slug) do nothing;


-- Aufbereitungsmethoden ------------------------------------------------------
insert into public.processing_methods_catalog (slug, name_de, name_en, category, sort_order) values
  ('washed',         'Gewaschen',          'Washed',           'washed',    10),
  ('natural',        'Natural / Sun-dried','Natural',          'natural',   20),
  ('honey',          'Honey',              'Honey',            'honey',     30),
  ('honey_yellow',   'Honey (Yellow)',     'Yellow Honey',     'honey',     40),
  ('honey_red',      'Honey (Red)',        'Red Honey',        'honey',     50),
  ('honey_black',    'Honey (Black)',      'Black Honey',      'honey',     60),
  ('anaerobic',      'Anaerob',            'Anaerobic',        'anaerobic', 70),
  ('carbonic_macer', 'Carbonic Maceration','Carbonic Maceration','anaerobic',80),
  ('wet_hulled',     'Wet-Hulled (Giling Basah)','Wet-Hulled', 'other',     90),
  ('semi_washed',    'Semi-gewaschen',     'Semi-washed',      'other',    100)
on conflict (slug) do nothing;


-- Zertifikate (Schweiz/EU-relevant) ------------------------------------------
insert into public.certifications_catalog (slug, name, issuer, sort_order) values
  ('bio_knospe',         'Bio Knospe',           'Bio Suisse',                10),
  ('eu_organic',         'EU-Bio',               'Europäische Union',         20),
  ('demeter',            'Demeter',              'Demeter International',     30),
  ('fairtrade',          'Fairtrade',            'Fairtrade International',   40),
  ('direct_trade',       'Direct Trade',         null,                        50),
  ('rainforest_alliance','Rainforest Alliance',  'Rainforest Alliance',       60),
  ('utz',                'UTZ Certified',        'UTZ',                       70),
  ('sca_specialty',      'SCA Specialty (>80)',  'Specialty Coffee Association',80),
  ('cup_of_excellence',  'Cup of Excellence',    'Alliance for Coffee Excellence',90)
on conflict (slug) do nothing;
