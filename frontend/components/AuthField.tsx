"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

interface AuthFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Field with a leading icon, a small label above the value, and (for passwords) a show/hide button.
export default function AuthField({
  id,
  label,
  value,
  onChange,
  icon,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const looksValid = type === "email" && EMAIL_RE.test(value);

  return (
    <div className="group flex items-center gap-3 rounded-2xl border-2 border-[#E3E7F3] bg-white px-4 py-2.5 transition-colors focus-within:border-[#1B2A9B] focus-within:ring-4 focus-within:ring-[#FFB81C]/30">
      <span className="text-[#5B6190] transition-colors group-focus-within:text-[#1B2A9B]" aria-hidden="true">
        {icon}
      </span>
      <span className="h-9 w-px bg-[#E3E7F3]" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[11px] font-medium text-[#5B6190]">
          {label}
        </label>
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] font-semibold text-[#0E1442] outline-none placeholder:font-normal placeholder:text-[#0E1442]/35"
        />
      </div>

      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-md p-1 text-[#5B6190] transition-colors hover:text-[#1B2A9B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]/40"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}

      {looksValid && <CheckCircle2 className="h-5 w-5 text-[#1FB89F]" aria-hidden="true" />}
    </div>
  );
}