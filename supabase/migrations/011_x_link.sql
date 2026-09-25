-- Adds a staff-editable X (formerly Twitter) URL to the singleton
-- settings row, same pattern as facebook_url/instagram_url (010) —
-- empty until set, footer icon hidden until then.

alter table settings add column if not exists x_url text;
