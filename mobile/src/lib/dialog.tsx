import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { C, F, S } from "./theme";

export type DialogButton = { text: string; style?: "cancel" | "destructive" | "default"; onPress?: () => void };
type D = { title: string; message?: string; buttons: DialogButton[] };

let show: ((d: D) => void) | null = null;

/** Fenêtre de confirmation identique sur iPhone, Android et navigateur (remplace Alert). */
export function dialog(title: string, message?: string, buttons: DialogButton[] = [{ text: "OK" }]) {
  show?.({ title, message, buttons });
}

export function DialogHost() {
  const [d, setD] = useState<D | null>(null);
  useEffect(() => { show = setD; return () => { show = null; }; }, []);
  if (!d) return null;
  const close = (b?: DialogButton) => { setD(null); b?.onPress?.(); };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(d.buttons.find((b) => b.style === "cancel"))}>
      <View style={{ flex: 1, backgroundColor: "rgba(39,39,37,0.45)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View accessibilityRole="alert" style={[S.card, { width: "100%", maxWidth: 400, padding: 22, gap: 12 }]}>
          <Text style={S.h2}>{d.title}</Text>
          {d.message ? <Text style={S.body}>{d.message}</Text> : null}
          <View style={{ gap: 8, marginTop: 6 }}>
            {d.buttons.map((b, i) => (
              <Pressable key={i} accessibilityRole="button" onPress={() => close(b)}
                style={({ pressed }) => ({ paddingVertical: 13, borderRadius: 999, alignItems: "center", opacity: pressed ? 0.8 : 1,
                  backgroundColor: b.style === "cancel" ? "transparent" : b.style === "destructive" ? C.rouge : C.encre,
                  borderWidth: b.style === "cancel" ? 1.5 : 0, borderColor: C.encre })}>
                <Text style={{ fontFamily: F.display, textTransform: "uppercase", letterSpacing: 1, fontSize: 16, color: b.style === "cancel" ? C.encre : C.papier }}>{b.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
