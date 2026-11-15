import SettingsForm from "@/components/admin/SettingsForm";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function Reglages() {
  const { role } = await requireStaff();
  const s = await getSettings();
  return <SettingsForm s={s} canEdit={role !== "lecteur"} />;
}
