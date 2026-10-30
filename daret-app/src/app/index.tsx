import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/lib/theme";

// Entry point: send the user to the app or to the login screen.
export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  return <Redirect href={token ? "/dashboard" : "/login"} />;
}
