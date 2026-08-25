import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ModuleWithLessons } from "@/lib/types";

/** GET /api/lessons — lista módulos publicados com suas lições (sem gabarito). */
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: modules, error } = await supabase
    .from("modules")
    .select(
      "id, slug, title, description, icon, order_index, lessons(id, module_id, slug, title, order_index, xp_reward)"
    )
    .eq("is_published", true)
    .order("order_index", { ascending: true })
    .order("order_index", { referencedTable: "lessons", ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ modules: modules as unknown as ModuleWithLessons[] });
}
