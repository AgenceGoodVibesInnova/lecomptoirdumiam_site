import SetPassword from "@/components/SetPassword";

export const metadata = { title: "Choisir mon mot de passe" };

export default function Page() {
  return <SetPassword next="/admin" back="/admin/connexion" />;
}
