"use client";

import { useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { exportBackup, importBackup, renameHousehold, resetHousehold, useHousehold } from "@/lib/store";

export default function SettingsPage() {
  const { meta, ready } = useHousehold();
  const [name, setName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const householdName = name ?? meta?.name ?? "Our household";

  async function downloadBackup() {
    const json = await exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `genie-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) return <div className="py-20 text-center text-muted">Loading settings…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="The quiet stuff"
        title="Settings"
        subtitle="Data stays in this browser until you export a backup. That is on purpose — household finances should not live on a stranger's server by default."
      />

      <section className="card mb-4 p-5">
        <h2 className="font-semibold">Household name</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input className="field" value={householdName} onChange={(event) => setName(event.target.value)} />
          <Button onClick={() => void renameHousehold(householdName)}>Save</Button>
        </div>
      </section>

      <section className="card mb-4 p-5">
        <h2 className="font-semibold">Backup</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Download a JSON file to move Genie to another computer, or to keep a copy before you replace sample data.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void downloadBackup()}>Download backup</Button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">
            Restore backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await importBackup(await file.text());
                setMessage("Backup restored.");
              }}
            />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Reset</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Start over with the walkthrough household, or wipe everything and import only your files.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void resetHousehold("sample");
              setMessage("Sample household restored.");
            }}
          >
            Reload sample data
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void resetHousehold("empty");
              setMessage("Books are empty. Add accounts next.");
            }}
          >
            Start from scratch
          </Button>
        </div>
        {message ? <p className="mt-4 text-sm text-teal-dark">{message}</p> : null}
      </section>
    </div>
  );
}