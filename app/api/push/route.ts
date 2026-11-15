import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestUser } from "@/lib/apiauth";

/** Enregistre (POST) ou retire (DELETE) le jeton de notification du téléphone du client. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { token, platform } = (await req.json().catch(() => ({}))) as { token?: string; platform?: string };
  if (!token || !/^Expo(nent)?PushToken\[[^\]]{10,200}\]$/.test(token)) return NextResponse.json({ error: "Jeton invalide." }, { status: 400 });
  const { error } = await supabaseService().from("push_tokens").upsert({ token, user_id: user.id, platform: platform?.slice(0, 10) ?? null });
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (token) await supabaseService().from("push_tokens").delete().eq("token", token).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
