import { ReactNode, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { CheckCircle2, Eye, EyeOff } from "lucide-react-native";
import { colors, fonts } from "@/lib/theme";

interface AuthFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: "text" | "email" | "password";
  autoComplete?: "name" | "email" | "password" | "new-password" | "current-password" | "off";
  placeholder?: string;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Field with a leading icon, a small label above the value, and (for passwords) a show/hide button.
export default function AuthField({
  label,
  value,
  onChange,
  icon,
  type = "text",
  autoComplete,
  placeholder,
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const isPassword = type === "password";
  const looksValid = type === "email" && EMAIL_RE.test(value);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: focus ? colors.blue : colors.line,
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      <View>{icon}</View>
      <View style={{ width: 1, height: 36, backgroundColor: colors.line }} />

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.muted }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={isPassword && !show}
          keyboardType={type === "email" ? "email-address" : "default"}
          autoCapitalize={type === "text" ? "words" : "none"}
          autoCorrect={false}
          autoComplete={autoComplete}
          placeholder={placeholder}
          placeholderTextColor="rgba(14,20,66,0.35)"
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, padding: 0, marginTop: 2 }}
        />
      </View>

      {isPassword && (
        <Pressable
          onPress={() => setShow((s) => !s)}
          hitSlop={8}
          accessibilityLabel={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
        </Pressable>
      )}

      {looksValid && <CheckCircle2 size={20} color="#1FB89F" />}
    </View>
  );
}
