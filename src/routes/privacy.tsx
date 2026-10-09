import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({ component: Privacy });

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Who we are",
    points: [
      "Origina is provided by Innovo Networks in South Africa.",
      "For student work, the institution decides how it's used. We process it on the institution's behalf.",
    ],
  },
  {
    title: "What we collect",
    points: [
      "Account details: name, email address, role, campus and optional student number.",
      "Work you submit: text, Word, PDF and PowerPoint files, and the reports Origina creates.",
      "Billing details for paying institutions: company name, VAT number, billing address and email.",
      "Technical data: sign-in sessions, IP address and an audit trail of actions in your institution.",
      "We don't collect card numbers. PayFast handles payments.",
    ],
  },
  {
    title: "How we use it",
    points: [
      "To run the service, check work for copying, AI writing and hidden text, and show reports to the right people.",
      "To send account emails, such as email confirmation, password resets and receipts.",
      "To bill paying institutions and to keep the service secure.",
      "We don't sell personal information or use submitted work to train AI models.",
    ],
  },
  {
    title: "Who can see it",
    points: [
      "Each institution's data is kept separate. Institutions can't see each other's people or work.",
      "Only the student, their assessors and administrators can open a report.",
      "Innovo Networks staff can access data to provide support.",
    ],
  },
  {
    title: "Service providers",
    points: [
      "Vercel (hosting) and Neon (database), which may store data outside South Africa.",
      "Resend (emails) and PayFast (payments).",
      "Anthropic, if your institution uses the AI-writing indicator, which receives the submitted text to analyse it.",
      "Each provider only receives what it needs to do its job.",
    ],
  },
  {
    title: "How long we keep it",
    points: [
      "Account details are kept until the account is deleted.",
      "Submitted work and reports are kept for as long as the institution uses Origina, or until it asks us to delete them.",
      "Billing records are kept as long as tax law requires.",
    ],
  },
  {
    title: "Your rights",
    points: [
      "You can ask to see, correct or delete your personal information, in line with POPIA.",
      "You can delete your account any time in Settings, or on the Delete account page.",
      "Scores support academic judgement. Staff make the final decision.",
      "You may complain to the Information Regulator of South Africa.",
    ],
  },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight">Privacy Policy</h1>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[17px] text-ink-soft">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="mt-10 text-ink-soft">
          <Link to="/delete-account" className="text-lime-ink underline">
            Delete your account
          </Link>
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
