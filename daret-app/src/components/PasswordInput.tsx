import { useState } from "react";
import { Pressable, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Input } from "@/components/Ui";
import { colors } from "@/lib/theme";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: "new-password" | "current-password";
  placeholder?: string;
}

export default function PasswordInput({ value, onChange, autoComplete, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <View>
      <Input
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ paddingRight: 46 }}
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={8}
        accessibilityLabel={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
      >
        {show ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
      </Pressable>
    </View>
  );
}
