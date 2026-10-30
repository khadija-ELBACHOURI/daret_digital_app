import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/lib/theme";

export function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: dark ? colors.blue : colors.saffron,
        }}
      >
        <Text style={{ fontFamily: fonts.displayXL, fontSize: 18, color: dark ? colors.saffron : colors.blueDeep }}>D</Text>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 20, color: dark ? colors.ink : colors.white }}>
        Daret Digital
      </Text>
    </View>
  );
}

interface AuthShellProps {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  const router = useRouter();

  const Tab = ({ label, active, href }: { label: string; active: boolean; href: "/login" | "/register" }) => (
    <Pressable
      onPress={() => !active && router.replace(href)}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: active ? colors.white : "transparent",
        shadowColor: colors.blueDeep,
        shadowOpacity: active ? 0.14 : 0,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: active ? 2 : 0,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: active ? colors.ink : colors.muted }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
          <LogoMark dark />

          <View style={{ flex: 1, justifyContent: "center", paddingVertical: 28 }}>
            <Text
              style={{
                fontFamily: fonts.displayXL,
                fontSize: 32,
                lineHeight: 38,
                textAlign: "center",
                color: colors.ink,
              }}
            >
              {title}
            </Text>
            <Text
              style={{ fontFamily: fonts.regular, fontSize: 14, textAlign: "center", color: colors.muted, marginTop: 6 }}
            >
              {subtitle}
            </Text>

            <View
              style={{
                flexDirection: "row",
                marginTop: 28,
                padding: 4,
                borderRadius: 16,
                backgroundColor: "#F1F3F9",
              }}
            >
              <Tab label="Connexion" active={mode === "login"} href="/login" />
              <Tab label="Inscription" active={mode === "register"} href="/register" />
            </View>

            {children}
          </View>

          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              lineHeight: 18,
              textAlign: "center",
              color: "#6B7199",
              paddingBottom: 8,
            }}
          >
            Cotisez, suivez chaque tour et recevez la cagnotte en toute transparence, avec vos proches.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
