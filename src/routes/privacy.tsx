import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Data compliance
        </p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">
          Privacy, POPIA and ownership
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-soft">
          <p>
            The Western Cape Government and the Department of Health and Wellness remain the owners
            of all student information processed through Origina.
          </p>
          <p>
            Submitted documents are kept private and secure. Access is limited to the student, the
            assessing academic, designated administrators, and — where a case proceeds — a
            disciplinary panel. Origina is an operator, not an owner.
          </p>
          <p>
            Users see what content matched and where those matches came from. The tool only
            highlights possible plagiarism or AI-generated content. Academic staff make the final
            decision. AI-content indicators support, and do not replace, academic judgement.
          </p>
          <p>
            Hosting, licensing, maintenance and support are delivered as a managed service in line
            with applicable data-protection law, including POPIA. Retention follows the college
            records schedule. Scripts are not used to train unrelated models.
          </p>
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
