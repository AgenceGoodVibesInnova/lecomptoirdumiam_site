import KitchenBoard from "@/components/KitchenBoard";
import { PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";

export default async function Cuisine() {
  const { role } = await requireStaff();
  return (
    <>
      <PageHead kicker="En direct" title="Écran cuisine" />
      <KitchenBoard canEdit={role !== "lecteur"} />
    </>
  );
}
