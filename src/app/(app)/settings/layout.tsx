import type { ReactNode } from "react";
import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengaturan Situs</h1>
        <p className="text-sm text-muted">Atur jadwal rekap dan tampilan landing page</p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
