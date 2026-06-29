import { cookies } from "next/headers";
import { THEME_COOKIE, DEFAULT_THEME, isTheme, type Theme } from "@/lib/theme";

export async function getServerTheme(): Promise<Theme> {
  const store = await cookies();
  const v = store.get(THEME_COOKIE)?.value;
  return isTheme(v) ? v : DEFAULT_THEME;
}
