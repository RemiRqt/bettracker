insert into subject_links (user_id, subject, team_mapping_id)
select tf.user_id, tf.subject, tc.id
from team_mappings tf
join team_mappings tc
  on  tc.user_id   = tf.user_id
  and tc.api_team_id = tf.api_team_id
  and tc.is_club   = true
where tf.is_club = false
  and tf.api_team_id is not null
on conflict (user_id, subject, team_mapping_id) do nothing;
