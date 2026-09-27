import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { SAMPLE_FINDINGS, SAMPLE_REPORT_TEXT } from "@/lib/origina/sample-report";

export const Route = createFileRoute("/sample-report")({ component: Sample });

function Sample() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          This is a public sample for the site demonstration. Sign in to run a live check, including
          the authorship agent and the audit trail.
        </p>
        <ReportView
          title="Essay: the primary survey"
          filename="primary-survey.docx"
          text={SAMPLE_FINDINGS.obfuscation.cleanedText || SAMPLE_REPORT_TEXT}
          findings={SAMPLE_FINDINGS}
          createdAt={new Date().toISOString()}
          authorName="A. Nkosi"
          campus="tygerberg"
          backTo="/"
        />
      </div>
      <PublicFooter />
    </div>
  );
}
