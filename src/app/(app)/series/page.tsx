import { getEquipesWithContext } from "@/actions/equipes";
import { createClient } from "@/lib/supabase/server";
import { EquipesPage } from "@/components/equipes/equipes-page";

export default async function EquipesRoute() {
  const supabase = await createClient();

  const [equipes, { data: teamMappings }] = await Promise.all([
    getEquipesWithContext(),
    supabase.from("team_mappings").select("subject, logo_url, api_team_id"),
  ]);

  // Build logo map: subject → logo_url (prefer proxy URL from api_team_id)
  const logoMap: Record<string, string> = {};
  for (const m of teamMappings ?? []) {
    if (m.api_team_id) {
      logoMap[m.subject] = `/api/football/image?teamId=${m.api_team_id}`;
    } else if (m.logo_url) {
      logoMap[m.subject] = m.logo_url;
    }
  }

  return <EquipesPage equipes={equipes} logoMap={logoMap} />;
}
