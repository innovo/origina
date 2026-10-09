import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { DeleteAccount } from "@/components/delete-account";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/delete-account")({ component: DeleteAccountPage });

/** Public page Google Play links to for account deletion requests. */
function DeleteAccountPage() {
  const { user, isPending } = useCurrentUserState();
  return (
    <div className="min-h-screen bg-paper">
      <PublicHeader />
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight">Delete your Origina account</h1>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-[17px] text-ink-soft">
          <li>Sign in, then confirm the deletion below. You can also do this in the app under Settings.</li>
          <li>We delete your login, name, email and sessions straight away.</li>
          <li>
            Work you submitted is kept by your institution for its academic records, with your name replaced by
            "Deleted user". Ask your institution if you want that removed too.
          </li>
          <li>Your institution's audit trail keeps a record that actions were taken, without your name or email.</li>
        </ul>
        <div className="mt-8">
          {isPending ? null : user ? (
            <DeleteAccount />
          ) : (
            <Button asChild size="lg">
              <Link to="/login" search={{ next: "/delete-account" }}>
                Sign in to delete your account
              </Link>
            </Button>
          )}
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
