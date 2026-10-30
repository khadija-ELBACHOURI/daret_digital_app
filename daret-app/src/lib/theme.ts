import { StyleSheet } from "react-native";
import type { DaretStatus } from "@/lib/api";

// Single source of truth for the app design (same palette as the web app).
export const colors = {
  blue: "#1B2A9B",
  blueDeep: "#121B6B",
  saffron: "#FFB81C",
  ink: "#0E1442",
  muted: "#5B6190",
  line: "#E3E7F3",
  page: "#F4F6FB",
  white: "#FFFFFF",
  mint: "#3DDBC2",
  mintDark: "#0B7A69",
  danger: "#D9483B",
  dangerDark: "#B3261E",
  dangerBg: "#FDECEA",
  amberBg: "#FFF3D1",
  amberText: "#8A5A00",
  amberSoft: "#FFF8E6",
  greenBg: "#DDF7F2",
  greyBg: "#E8EAF4",
  paleBlue: "#E6E9FB",
  rowBg: "#F8F9FD",
};

export const fonts = {
  display: "BricolageGrotesque_700Bold",
  displayXL: "BricolageGrotesque_800ExtraBold",
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
};

export const type = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  tiny: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  pageTitle: { fontFamily: fonts.displayXL, fontSize: 28, color: colors.ink },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  errorText: { fontFamily: fonts.regular, fontSize: 14, color: colors.dangerDark },
});

export const statusStyles: Record<DaretStatus, { label: string; bg: string; fg: string }> = {
  EN_ATTENTE: { label: "En attente", bg: colors.amberBg, fg: colors.amberText },
  ACTIVE: { label: "Active", bg: colors.greenBg, fg: colors.mintDark },
  TERMINEE: { label: "Terminée", bg: colors.greyBg, fg: colors.muted },
};
