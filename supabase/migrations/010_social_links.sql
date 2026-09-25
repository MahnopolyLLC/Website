-- Adds staff-editable Facebook/Instagram URLs to the singleton settings
-- row, same pattern as the other optional operational links (uhaul_url
-- etc.) — empty until set, and the footer only shows an icon once a URL
-- is present.

alter table settings add column if not exists facebook_url text;
alter table settings add column if not exists instagram_url text;
