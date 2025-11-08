import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./components/settings-form";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" />
      <SettingsForm />
    </div>
  );
}
