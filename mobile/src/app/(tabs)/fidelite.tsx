import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stamps } from "../../components/ui";
import { useSession } from "../../lib/session";
import { C, S } from "../../lib/theme";

export default function Fidelite() {
  const { me, refreshMe } = useSession();
  useFocusEffect(useCallback(() => { refreshMe(); }, [refreshMe]));
  const l = me?.loyalty;
  if (!l) return null;
  if (!l.enabled) return <View style={S.pad}><Text style={S.body}>La carte de fidélité n'est pas active pour le moment.</Text></View>;
  const left = l.goal - l.stamps;
  return (
    <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 40 }]}>
      <View style={[S.cardDark, { gap: 16 }]}>
        <Text style={[S.kick, { color: C.eclair }]}>Carte de fidélité</Text>
        <Text style={[S.h1, { color: C.papier, fontSize: 34 }]}>{l.stamps} / {l.goal}</Text>
        <View style={{ backgroundColor: C.papier, borderRadius: 10, padding: 14 }}><Stamps stamps={l.stamps} goal={l.goal} size={36} /></View>
        <Text style={[S.body, { color: C.sable2 }]}>{left === l.goal && l.available ? "Carte complétée !" : `Encore ${left} commande${left > 1 ? "s" : ""} pour : ${l.rewardLabel}.`}</Text>
      </View>
      {l.available ? (
        <View style={[S.card, { backgroundColor: C.eclair, borderColor: C.encre, borderWidth: 2 }]}>
          <Text style={S.h2}>{l.available > 1 ? `${l.available} récompenses` : "Récompense"} disponible{l.available > 1 ? "s" : ""} !</Text>
          <Text style={S.body}>{l.rewardLabel}. Activez-la dans votre panier à la prochaine commande.</Text>
        </View>
      ) : null}
      <View style={S.card}>
        <Text style={S.h3}>Comment ça marche ?</Text>
        <Text style={S.body}>Chaque commande payée dans l'application ou au comptoir avec votre compte vous donne un tampon. Au bout de {l.goal} tampons : {l.rewardLabel.toLowerCase()}.</Text>
      </View>
    </ScrollView>
  );
}
