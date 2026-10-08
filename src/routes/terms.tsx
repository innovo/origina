import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";

export const Route = createFileRoute("/terms")({ component: Terms });

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Your account",
    points: [
      "Origina is provided by Innovo Networks.",
      "Keep your password private. You're responsible for activity on your account.",
      "The person who registers an institution is its first administrator.",
    ],
  },
  {
    title: "Free trial",
    points: [
      "New institutions get a 14-day free trial. No card is needed.",
      "When the trial ends, the workspace is locked until an administrator subscribes.",
    ],
  },
  {
    title: "Subscriptions and payment",
    points: [
      "Pro is billed monthly in rand, per staff seat, through PayFast.",
      "It renews automatically each month until it is cancelled.",
      "You can cancel any time on the Billing page. Access continues until the end of the paid month.",
      "Paid months are not refunded, except where the law requires it.",
      "Institution plans are invoiced by Innovo Networks on the terms agreed with you.",
      "We'll give notice before changing prices.",
    ],
  },
  {
    title: "Using Origina",
    points: [
      "Only upload work you're allowed to process.",
      "Results are indicators, not proof of misconduct. Staff make the final decision.",
      "Don't try to break, overload or get around the security of the service.",
    ],
  },
  {
    title: "Your data",
    points: [
      "Each institution owns its data and can't see other institutions' data.",
      "We process personal information in line with POPIA and our Privacy Policy.",
    ],
  },
  {
    title: "General",
    points: [
      "We may suspend accounts that break these terms or aren't paid.",
      "These terms are governed by the laws of South Africa.",
      "Questions? Use the Book a demo form on the homepage to contact us.",
    ],
  },
];

function Terms() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight">Terms of Service</h1>
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
      </article>
      <PublicFooter />
    </div>
  );
}
