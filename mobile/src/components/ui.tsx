import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { C, F, S } from "../lib/theme";

const tap = () => { if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {}); };

type BtnProps = { label: string; onPress?: () => void; kind?: "primary" | "yellow" | "ghost" | "danger"; busy?: boolean; disabled?: boolean; small?: boolean; style?: ViewStyle; right?: ReactNode };
export function Button({ label, onPress, kind = "primary", busy, disabled, small, style, right }: BtnProps) {
  const bg = kind === "primary" ? C.encre : kind === "yellow" ? C.eclair : kind === "danger" ? C.rouge : "transparent";
  const fg = kind === "yellow" || kind === "ghost" ? C.encre : C.papier;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      onPress={() => { tap(); onPress?.(); }}
      disabled={disabled || busy}
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: 999, paddingVertical: small ? 9 : 15, paddingHorizontal: small ? 14 : 22,
        alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
        borderWidth: kind === "ghost" ? 1.5 : 0, borderColor: C.encre,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1, minHeight: small ? 38 : 52,
      }, style]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontFamily: F.display, textTransform: "uppercase", letterSpacing: 1, fontSize: small ? 14 : 17 }}>{label}</Text>}
      {right}
    </Pressable>
  );
}

export function Field({ label, hint, password, ...p }: TextInputProps & { label: string; hint?: string; password?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={S.label}>{label}</Text>
      {password ? (
        <View style={{ justifyContent: "center" }}>
          <TextInput accessibilityLabel={label} placeholderTextColor={C.gris} style={[S.input, { paddingRight: 52 }]} {...p} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} />
          <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityLabel={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} hitSlop={8}
            style={{ position: "absolute", right: 6, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color={C.encre2} />
          </Pressable>
        </View>
      ) : (
        <TextInput accessibilityLabel={label} placeholderTextColor={C.gris} style={S.input} {...p} />
      )}
      {hint ? <Text style={S.muted}>{hint}</Text> : null}
    </View>
  );
}

export function Stepper({ qty, onChange, name }: { qty: number; onChange: (d: number) => void; name: string }) {
  if (!qty) return <Button small label="Ajouter" onPress={() => onChange(1)} />;
  return (
    <View style={[S.row, { gap: 6 }]}>
      <RoundBtn label="−" a11y={`Retirer un ${name}`} onPress={() => onChange(-1)} light />
      <Text style={{ fontFamily: F.bodyBold, fontSize: 18, minWidth: 22, textAlign: "center" }} accessibilityLabel={`${qty} ${name}`}>{qty}</Text>
      <RoundBtn label="+" a11y={`Ajouter un ${name}`} onPress={() => onChange(1)} />
    </View>
  );
}

function RoundBtn({ label, onPress, light, a11y }: { label: string; onPress: () => void; light?: boolean; a11y: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={() => { tap(); onPress(); }} hitSlop={6}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: light ? C.sable2 : C.encre, opacity: pressed ? 0.75 : 1 })}>
      <Text style={{ color: light ? C.encre : C.papier, fontSize: 22, lineHeight: 24, fontFamily: F.bodyBold }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "yellow" | "green" | "red" | "dark" }) {
  const map = { neutral: [C.sable2, C.encre], yellow: [C.eclair, C.encre], green: ["#d9e8cf", C.vert], red: ["#f2d8d0", C.rouge], dark: [C.encre, C.papier] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontFamily: F.bodyBold, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

export function Choice({ label, detail, selected, onPress }: { label: string; detail?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { tap(); onPress(); }}
      style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: selected ? C.encre : C.sable3, backgroundColor: selected ? C.eclair : C.papier, gap: 2 }}>
      <Text style={[S.h3, { fontSize: 16 }]}>{label}</Text>
      {detail ? <Text style={S.muted}>{detail}</Text> : null}
    </Pressable>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <View style={[S.card, { alignItems: "center", paddingVertical: 28 }]}>
      <Text style={S.h3}>{title}</Text>
      <Text style={[S.muted, { textAlign: "center" }]}>{text}</Text>
      {action}
    </View>
  );
}

export function Stamps({ stamps, goal, size = 30 }: { stamps: number; goal: number; size?: number }) {
  return (
    <View accessibilityLabel={`${stamps} tampons sur ${goal}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {Array.from({ length: goal }, (_, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: C.encre, backgroundColor: i < stamps ? C.eclair : "transparent", alignItems: "center", justifyContent: "center" }}>
          {i < stamps ? <Text style={{ fontFamily: F.display, fontSize: size * 0.5, color: C.encre }}>⚡</Text> : null}
        </View>
      ))}
    </View>
  );
}
