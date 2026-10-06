import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/training")({ component: Training });

const MODULES = [
  {
    audience: "Students",
    steps: [
      "Go to Submit and upload or paste your work.",
      "Open the report to see matches and their sources.",
      "Ask your lecturer about any match you already cited.",
    ],
  },
  {
    audience: "Academic staff",
    steps: [
      "Open a report from Submissions.",
      "Check similarity, hidden tricks and the AI indicator separately.",
      "Record No case, Discuss or Refer. A score is never proof.",
    ],
  },
  {
    audience: "Administrators",
    steps: [
      "Share the join code from Organisation.",
      "Promote staff on People.",
      "Add sources on Source library and API keys on Moodle & API.",
    ],
  },
];

function Training() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">How to use Origina</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {MODULES.map((m) => (
          <article key={m.audience} className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="font-semibold">{m.audience}</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
              {m.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
