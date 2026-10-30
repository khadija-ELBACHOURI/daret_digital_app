import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Check, ChevronDown } from "lucide-react-native";
import { colors, fonts, type } from "@/lib/theme";

// ---------- Layout ----------

export function Screen({
  children,
  edges = ["top"],
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  edges?: Edge[];
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}

// ---------- Text helpers ----------

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#A3281D" }}>{message}</Text>
    </View>
  );
}

export function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

// ---------- Buttons ----------

type Variant = "primary" | "secondary" | "danger" | "dangerOutline";
type Size = "sm" | "md" | "lg";

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  full,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border === "transparent" ? 0 : 2,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: s.radius,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: full ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={v.fg} /> : icon}
      <Text style={{ fontFamily: fonts.semibold, fontSize: s.font, color: v.fg }}>{title}</Text>
    </Pressable>
  );
}

const variantStyles: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.blue, fg: colors.white, border: "transparent" },
  secondary: { bg: colors.white, fg: colors.blue, border: "rgba(27,42,155,0.15)" },
  danger: { bg: colors.danger, fg: colors.white, border: "transparent" },
  dangerOutline: { bg: colors.white, fg: colors.dangerDark, border: "rgba(217,72,59,0.25)" },
};

const sizeStyles: Record<Size, { px: number; py: number; font: number; radius: number }> = {
  sm: { px: 12, py: 8, font: 12, radius: 12 },
  md: { px: 16, py: 11, font: 14, radius: 12 },
  lg: { px: 16, py: 15, font: 16, radius: 16 },
};

// ---------- Inputs ----------

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function Input({ mono, style, ...props }: TextInputProps & { mono?: boolean }) {
  const [focus, setFocus] = useState(false);
  const disabled = props.editable === false;
  return (
    <TextInput
      placeholderTextColor="rgba(14,20,66,0.35)"
      {...props}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={[
        styles.input,
        mono && { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", letterSpacing: 0.5 },
        focus && { borderColor: colors.blue },
        disabled && { backgroundColor: colors.page, color: "rgba(14,20,66,0.5)" },
        style,
      ]}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Choisir",
  disabled,
  compact,
  style,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={[
          styles.input,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            opacity: disabled ? 0.5 : 1,
          },
          compact && { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, minWidth: 64 },
          style,
        ]}
      >
        <Text
          style={{
            fontFamily: compact ? fonts.medium : fonts.regular,
            fontSize: compact ? 13 : 14,
            color: current ? colors.ink : "rgba(14,20,66,0.35)",
          }}
        >
          {current ? current.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    disabled={o.disabled}
                    onPress={() => {
                      setOpen(false);
                      onChange(o.value);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      opacity: o.disabled ? 0.35 : 1,
                      backgroundColor: selected ? colors.paleBlue : "transparent",
                    }}
                  >
                    <Text style={{ fontFamily: selected ? fonts.semibold : fonts.regular, fontSize: 15, color: colors.ink }}>
                      {o.label}
                    </Text>
                    {selected && <Check size={18} color={colors.blue} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
export const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s: string) =>
  s ? new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))) : new Date();

// value is "YYYY-MM-DD"
export function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [show, setShow] = useState(false);
  const date = parseDate(value);

  if (Platform.OS === "ios") {
    return (
      <View style={{ alignItems: "flex-start" }}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          onChange={(_, d) => d && onChange(toDateString(d))}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={() => setShow(true)} style={styles.input}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: value ? colors.ink : "rgba(14,20,66,0.35)" }}>
          {value || "Choisir une date"}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShow(false);
            if (e.type === "set" && d) onChange(toDateString(d));
          }}
        />
      )}
    </>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.blueDeep,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "rgba(27,42,155,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: "rgba(217,72,59,0.3)",
    backgroundColor: "rgba(217,72,59,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(14,20,66,0.45)", justifyContent: "center", padding: 28 },
  sheet: { backgroundColor: colors.white, borderRadius: 16, overflow: "hidden" },
});

export { type };
