// File: src/app/settings/page.tsx
import { Metadata } from "next";
import { SettingsPanel } from "./SettingsPanel";

export const metadata: Metadata = {
  title: "Settings | AxiomPips",
  description: "Configure your default trading settings. Set your account balance, currency, risk percentage, and leverage so calculators pre-fill automatically.",
};

export default function SettingsPage() {
  return <SettingsPanel />;
}
