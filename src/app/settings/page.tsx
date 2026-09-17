"use client";

import { useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import {
  exportBackup,
  importBackup,
  renameHousehold,
  signOut,
  useHousehold,
  wipeHousehold,
} from "@/lib/store";

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
        subtitle="The books live in the household database, so Nathan and Nina always see the same numbers, on any device, after signing in."
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
          Download a JSON copy of everything, or restore one. Restoring replaces what is in the
          database — backups from the older browser-only version of Genie work too.
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
                if (!window.confirm("Restoring replaces everything currently in the household. Continue?")) return;
                await importBackup(await file.text());
                setMessage("Backup restored.");
              }}
            />
          </label>
        </div>
      </section>

      <section className="card mb-4 p-5">
        <h2 className="font-semibold">Start over</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Deletes every account, transaction, and budget in the household — for both of you. There is no undo, so download a backup first.
        </p>
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (!window.confirm("Delete all household data for both members? This cannot be undone.")) return;
              void wipeHousehold().then(() => setMessage("The books are empty. Add accounts next."));
            }}
          >
            Delete all data
          </Button>
        </div>
        {message ? <p className="mt-4 text-sm text-teal-dark">{message}</p> : null}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Session</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Signed in on this device until you sign out.</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}