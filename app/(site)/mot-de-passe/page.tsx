import SetPassword from "@/components/SetPassword";

export const metadata = { title: "Nouveau mot de passe" };

export default function Page() {
  return <SetPassword next="/compte" back="/connexion" />;
}
