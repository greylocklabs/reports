import { fenced, inline, plain } from "./text.ts";

/** The apps reports can be filed for, each in greylocklabs/<app>, with the name its issues use. */
export const APPS = { callie: "Callie", jot: "Jot", woodshed: "Woodshed" } as const;
export type App = keyof typeof APPS;

/** A report from any app: what kind it is, a one-line summary, and what the person chose to send. */
export interface Report {
  app: App;
  kind: "bug" | "idea";
  summary: string;
  note?: string;
  details?: [string, string][];
  logs?: string;
  appVersion: string;
  platform: string;
}

/** Reports are short; anything near these limits is not one. */
export const LIMITS = {
  body: 32_000,
  summary: 100,
  note: 4_000,
  details: 20,
  detailKey: 100,
  detailValue: 500,
  logs: 16_000,
  version: 40,
  platform: 100,
};

/** The report in [input], or a reason it is not one. */
export function parseReport(input: unknown): Report | string {
  if (typeof input !== "object" || input === null) return "expected a JSON object";
  const r = input as Record<string, unknown>;
  if (typeof r.app !== "string" || !Object.hasOwn(APPS, r.app)) return "unknown app";
  if (r.kind !== "bug" && r.kind !== "idea") return "kind must be bug or idea";
  const text = (key: string, max: number, required = false): string | undefined | null => {
    const v = r[key];
    if (v === undefined || v === null) return required ? null : undefined;
    return typeof v === "string" && v.length <= max && (!required || v.trim() !== "") ? v : null;
  };
  const summary = text("summary", LIMITS.summary, true);
  const note = text("note", LIMITS.note);
  const logs = text("logs", LIMITS.logs);
  const appVersion = text("appVersion", LIMITS.version, true);
  const platform = text("platform", LIMITS.platform, true);
  if (summary == null) return "missing or overlong summary";
  if (note === null || logs === null) return "overlong note or logs";
  if (appVersion == null || platform == null) return "missing appVersion or platform";

  let details: [string, string][] | undefined;
  if (r.details !== undefined) {
    if (!Array.isArray(r.details) || r.details.length > LIMITS.details) return "too many details";
    details = [];
    for (const d of r.details) {
      if (!Array.isArray(d) || d.length !== 2) return "details must be [label, value] pairs";
      const [k, v] = d;
      if (typeof k !== "string" || typeof v !== "string" || k.length > LIMITS.detailKey || v.length > LIMITS.detailValue) {
        return "overlong detail";
      }
      details.push([k, v]);
    }
  }
  return { app: r.app as App, kind: r.kind, summary, note, details, logs, appVersion, platform };
}

/** The issue a report becomes in its app's repository. */
export function issueFor(report: Report): { repo: string; title: string; body: string; labels: string[] } {
  const lines = [
    report.kind === "idea" ? "**The idea:**" : "**What happened:**",
    report.note?.trim() ? plain(report.note.trim()) : "(please describe)",
  ];
  if (report.details?.length) {
    lines.push("", "What the app shows:", ...report.details.map(([k, v]) => `- ${inline(k)}: ${inline(v)}`));
  }
  if (report.logs?.trim()) {
    lines.push("", "<details><summary>Logs</summary>", "", "```text", fenced(report.logs.trim()), "```", "", "</details>");
  }
  lines.push("", `${APPS[report.app]} ${inline(report.appVersion)}, ${inline(report.platform)}`, "", "_Sent from the app._");
  return {
    repo: report.app,
    title: inline(report.summary),
    body: lines.join("\n"),
    labels: [report.kind === "idea" ? "enhancement" : "bug", "from-app"],
  };
}
