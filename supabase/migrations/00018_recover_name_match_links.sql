-- Recovery des liens "pari <-> entite" perdus lors du passage au modele subject_links.
-- L'ancien code resolvait un logo/calendrier de DEUX facons :
--   (a) lien explicite : ligne subject (is_club=false) portant api_team_id -> club (is_club=true) de meme api_team_id
--   (b) match par nom  : une serie dont le subject == le nom d'une entite suivie (is_club=true)
-- Le backfill 00017 ne couvrait que (a). Cette migration restaure (a) (idempotent) et (b).
-- Idempotent : on conflict do nothing.

-- (a) liens explicites (re-execution sure)
insert into subject_links (user_id, subject, team_mapping_id)
select tf.user_id, tf.subject, tc.id
from team_mappings tf
join team_mappings tc
  on  tc.user_id    = tf.user_id
  and tc.api_team_id = tf.api_team_id
  and tc.is_club    = true
where tf.is_club = false
  and tf.api_team_id is not null
on conflict (user_id, subject, team_mapping_id) do nothing;

-- (b) match par nom : chaque entite suivie reliee au subject == son propre nom
insert into subject_links (user_id, subject, team_mapping_id)
select tc.user_id, tc.subject, tc.id
from team_mappings tc
where tc.is_club = true
on conflict (user_id, subject, team_mapping_id) do nothing;
