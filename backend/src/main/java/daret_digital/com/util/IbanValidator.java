package daret_digital.com.util;

import java.util.Locale;
import java.util.Map;

public final class IbanValidator {

    private static final Map<String, Integer> LENGTHS = Map.ofEntries(
            Map.entry("MA", 28),
            Map.entry("FR", 27),
            Map.entry("BE", 16),
            Map.entry("ES", 24),
            Map.entry("DE", 22),
            Map.entry("IT", 27),
            Map.entry("NL", 18),
            Map.entry("PT", 25),
            Map.entry("GB", 22),
            Map.entry("CH", 21),
            Map.entry("LU", 20),
            Map.entry("TN", 24),
            Map.entry("DZ", 26)
    );

    private IbanValidator() {}

    /** Uppercase, letters and digits only. Returns null for null or blank input. */
    public static String normalize(String raw) {
        if (raw == null) return null;
        String s = raw.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        return s.isEmpty() ? null : s;
    }

    /** Expects an already normalized IBAN. */
    public static boolean isValid(String iban) {
        if (iban == null || !iban.matches("[A-Z]{2}\\d{2}[A-Z0-9]{11,30}")) {
            return false;
        }

        Integer expected = LENGTHS.get(iban.substring(0, 2));
        if (expected != null && iban.length() != expected) {
            return false;
        }

        String rearranged = iban.substring(4) + iban.substring(0, 4);
        int remainder = 0;
        for (char c : rearranged.toCharArray()) {
            int value = Character.getNumericValue(c); // digits 0-9, letters A-Z = 10-35
            remainder = value < 10 ? (remainder * 10 + value) % 97 : (remainder * 100 + value) % 97;
        }
        return remainder == 1;
    }
}