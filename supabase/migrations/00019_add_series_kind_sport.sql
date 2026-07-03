-- Ajoute la nature de la série (serie multi-paris vs pari unique) et le sport.
alter table series
  add column kind  text not null default 'serie'
    check (kind in ('serie','unique')),
  add column sport text not null default 'football'
    check (sport in ('football','tennis','rugby','basket'));

comment on column series.kind  is 'serie = martingale multi-paris ; unique = pari isolé (1 pari)';
comment on column series.sport is 'football | tennis | rugby | basket';
