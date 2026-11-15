import KitchenBoard from "@/components/KitchenBoard";
import { requireStaff } from "@/lib/auth";

export default async function Cuisine() {
  const { role } = await requireStaff();
  return (
    <>
      <div className="stack" style={{ gap: 4 }}><p className="kick">En direct</p><h1 className="disp" style={{ fontSize: 40 }}>Écran cuisine</h1></div>
      <KitchenBoard canEdit={role !== "lecteur"} />
    </>
  );
}
