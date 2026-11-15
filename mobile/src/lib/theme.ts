import { StyleSheet } from "react-native";

// Couleurs et polices de la charte du Comptoir du Miam (identiques au site).
export const C = {
  sable: "#efe8db",
  sable2: "#e3d8c4",
  sable3: "#d5c9b4",
  papier: "#fbf8f2",
  encre: "#272725",
  encre2: "#4b4742",
  eclair: "#dfdf3e",
  olive: "#6b6a22",
  rouge: "#a3361f",
  vert: "#2f6b2a",
  gris: "#8a8478",
};

export const F = {
  display: "Antonio_700Bold",
  displayMid: "Antonio_600SemiBold",
  body: "Barlow_400Regular",
  bodyMid: "Barlow_500Medium",
  bodyBold: "Barlow_600SemiBold",
};

export const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.sable },
  pad: { padding: 20, gap: 16 },
  kick: { fontFamily: F.displayMid, textTransform: "uppercase", letterSpacing: 2, fontSize: 13, color: C.olive },
  h1: { fontFamily: F.display, textTransform: "uppercase", fontSize: 38, lineHeight: 42, color: C.encre },
  h2: { fontFamily: F.display, textTransform: "uppercase", fontSize: 24, lineHeight: 28, color: C.encre },
  h3: { fontFamily: F.displayMid, textTransform: "uppercase", fontSize: 18, letterSpacing: 0.5, color: C.encre },
  body: { fontFamily: F.body, fontSize: 16, lineHeight: 22, color: C.encre },
  muted: { fontFamily: F.body, fontSize: 14, lineHeight: 19, color: C.encre2 },
  card: { backgroundColor: C.papier, borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: C.sable3 },
  cardDark: { backgroundColor: C.encre, borderRadius: 12, padding: 20, gap: 10 },
  label: { fontFamily: F.displayMid, textTransform: "uppercase", letterSpacing: 1.6, fontSize: 12, color: C.encre2 },
  input: { backgroundColor: C.papier, borderWidth: 1.5, borderColor: C.sable3, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.body, fontSize: 17, color: C.encre },
  err: { fontFamily: F.bodyMid, fontSize: 15, color: C.rouge },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
});
