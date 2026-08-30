"use client";

import { useMemo, useState } from "react";
import { addAccount, importParsed } from "@/lib/store";
import { parseStatement } from "@/lib/parsers";
import type { Account, Institution, ParseResult } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { Button } from "./ui";

const PRESETS: Array<{
  name: string;
  institution: Institution;
  type: Account["type"];
  hint: string;
}> = [
  { name: "American Express", institution: "amex", type: "credit", hint: "CSV from americanexpress.com" },
  { name: "Genisys Checking", institution: "genisys", type: "checking", hint: "CSV or Quicken QFX" },
  { name: "Genisys Savings", institution: "genisys", type: "savings", hint: "CSV or Quicken QFX" },
];

export function ImportPanel({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [filename, setFilename] = useState("");
  const [fileText, setFileText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => accounts.find((account) => account.id === accountId),
    [accounts, accountId],
  );

  async function onFile(file: File) {
    const text = await file.text();
    setFilename(file.name);
    setFileText(text);
    setPreview(parseStatement(text, file.name));
    setResult(null);
  }

  async function createPreset(preset: (typeof PRESETS)[number]) {
    const account = await addAccount({
      name: preset.name,
      institution: preset.institution,
      type: preset.type,
    });
    setAccountId(account.id);
  }

  async function confirmImport() {
    if (!accountId || !fileText) return;
    setBusy(true);
    try {
      const outcome = await importParsed(accountId, fileText, filename);
      setResult(`Imported ${outcome.imported} new transactions. Skipped ${outcome.skipped} duplicates.`);
      setPreview(outcome.parsed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="card p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Add a statement</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Genie does not log into your bank. Download a file from Amex or Genisys, then drop it here. Live bank linking can come later.
        </p>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Account
        </label>
        {accounts.length ? (
          <select className="field mt-2" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-2 text-sm text-muted">Create an account first.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:bg-paper-2"
              onClick={() => void createPreset(preset)}
            >
              + {preset.name}
            </button>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/50 px-4 py-10 text-center hover:bg-teal-soft/40">
          <input
            type="file"
            accept=".csv,.ofx,.qfx,.qbo,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          <span className="text-sm font-semibold">Drop a CSV, OFX, or QFX file</span>
          <span className="mt-1 text-xs text-muted">
            {selected ? `Importing into ${selected.name}` : "Choose an account above"}
          </span>
        </label>

        <div className="mt-5 space-y-3 text-sm leading-6 text-muted">
          <p>
            <strong className="text-ink">Amex:</strong> americanexpress.com → Account → Statements & Activity → Download → CSV.
          </p>
          <p>
            <strong className="text-ink">Genisys:</strong> Online banking → the account → Download transactions → spreadsheet, or Quicken Web Connect (.qfx).
          </p>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Preview</h2>
          {preview ? (
            <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
              {preview.format} · {preview.transactions.length} rows
            </span>
          ) : null}
        </div>

        {!preview ? (
          <p className="mt-6 text-sm text-muted">
            Nothing selected yet. Try{" "}
            <a className="font-semibold text-teal underline" href="/samples/amex-sample.csv">
              a sample Amex CSV
            </a>{" "}
            or{" "}
            <a className="font-semibold text-teal underline" href="/samples/genisys-sample.qfx">
              a sample Genisys QFX
            </a>
            .
          </p>
        ) : (
          <>
            {preview.warnings.map((warning) => (
              <p key={warning} className="mt-3 text-sm text-rose">
                {warning}
              </p>
            ))}
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {preview.transactions.slice(0, 8).map((txn, index) => (
                <div key={`${txn.date}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{txn.merchant}</p>
                    <p className="text-xs text-muted">{txn.date}</p>
                  </div>
                  <span className="tabular text-sm">{formatMoney(txn.amountCents, { signed: true })}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void confirmImport()} disabled={!accountId || busy}>
                {busy ? "Importing…" : "Import these transactions"}
              </Button>
              <Button variant="secondary" onClick={() => { setPreview(null); setResult(null); }}>
                Clear
              </Button>
            </div>
            {result ? <p className="mt-3 text-sm text-teal-dark">{result}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}