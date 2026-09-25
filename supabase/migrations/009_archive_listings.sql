-- Adds a staff-only "archived" flag to listings, independent of `status`.
-- Lets staff hide a listing from the public site the moment a tenant
-- moves in (or a sale closes) without losing the record, then unarchive
-- it later — e.g. when a tenant moves out and the unit is available
-- again — instead of recreating it from scratch.

alter table listings add column if not exists archived boolean not null default false;
