import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight">Privacy and POPIA</h1>
        <ul className="mt-8 list-disc space-y-3 pl-5 text-[17px] text-ink-soft">
          <li>Each institution owns its student information.</li>
          <li>Institutions cannot see each other's people, submissions or reports.</li>
          <li>Only the student, their assessors and administrators can open a report.</li>
          <li>Scores support academic judgement. Staff make the final decision.</li>
          <li>Scripts are never used to train AI models.</li>
        </ul>
      </article>
      <PublicFooter />
    </div>
  );
}
