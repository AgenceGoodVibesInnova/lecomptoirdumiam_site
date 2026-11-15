import { Text, View } from "react-native";
import { euros } from "../lib/format";
import type { Category, Item } from "../lib/menu";
import { S } from "../lib/theme";
import { Pill, Stepper } from "./ui";

/** Carte avec boutons +/− (utilisée par le client et par l'équipe). */
export function MenuList({ menu, qty, onChange }: { menu: Category[]; qty: (id: string) => number; onChange: (i: Item, d: number) => void }) {
  return (
    <View style={{ gap: 22 }}>
      {menu.map((c) => (
        <View key={c.id} style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <Text style={S.h2}>{c.name}</Text>
            {c.moment ? <Text style={S.kick}>{c.moment}</Text> : null}
          </View>
          {c.items.map((i) => (
            <View key={i.id} style={[S.card, { flexDirection: "row", alignItems: "center", gap: 12, opacity: i.available ? 1 : 0.55 }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[S.body, { fontFamily: "Barlow_600SemiBold" }]}>{i.name}</Text>
                {i.description ? <Text style={S.muted} numberOfLines={3}>{i.description}</Text> : null}
                <Text style={[S.body, { fontFamily: "Barlow_600SemiBold" }]}>{euros(i.price_cents)}</Text>
              </View>
              {i.available ? <Stepper name={i.name} qty={qty(i.id)} onChange={(d) => onChange(i, d)} /> : <Pill label="Épuisé" />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
