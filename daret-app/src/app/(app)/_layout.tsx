import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { colors, fonts } from "@/lib/theme";

// Auth guard for every screen of the app: no token, back to login.
export default function AppLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page, gap: 10 }}>
        <ActivityIndicator color={colors.blue} />
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.muted }}>Vérification en cours...</Text>
      </View>
    );
  }

  if (!token) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.blueDeep },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.display },
        headerBackTitle: "Retour",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="daret/[id]" options={{ title: "Daret" }} />
      <Stack.Screen name="daret/creer" options={{ title: "Créer une daret" }} />
    </Stack>
  );
}
