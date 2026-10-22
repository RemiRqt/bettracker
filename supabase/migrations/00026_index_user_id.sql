-- Index sur user_id (filtre des policies RLS et des listes par utilisateur), manquants
-- depuis 00001 / 00003. Allègement de la base partagée (2026-10-22).
create index if not exists idx_series_user_id on public.series(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
