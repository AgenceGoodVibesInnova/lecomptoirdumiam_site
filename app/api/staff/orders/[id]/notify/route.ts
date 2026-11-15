import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestStaff } from "@/lib/apiauth";
import { notifyReadyCore } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requestStaff(req, "editeur"))) return NextResponse.json({ error: "Réservé à l'équipe (éditeur ou administrateur)." }, { status: 403 });
  const { id } = await params;
  try {
    return NextResponse.json(await notifyReadyCore(supabaseService(), id));
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
