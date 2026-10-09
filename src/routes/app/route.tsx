import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageSkeleton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/native";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getProfile } from "@/lib/origina/actions";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: Boolean(user),
  });

  if (isPending) return <PageSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (profileQuery.isPending) return <PageSkeleton />;

  const onboarding = pathname === "/app/onboarding";
  const platformPage = pathname === "/app/platform";
  const profile = profileQuery.data;
  // A profile without an organisation still has to join (or, for Innovo platform
  // admins, open) one before the tenant pages make sense.
  const needsOrg = !profile || !profile.orgId;
  if (needsOrg && profile?.isPlatformAdmin && !platformPage) {
    return <Navigate to="/app/platform" />;
  }
  if (needsOrg && !profile?.isPlatformAdmin && !onboarding) {
    return <Navigate to="/app/onboarding" />;
  }
  if (!needsOrg && onboarding) {
    return <Navigate to="/app" />;
  }
  if (!profile) {
    return <Outlet />;
  }
  if (needsOrg && onboarding) {
    return <Outlet />;
  }
  // Locked until someone pays. Innovo platform admins are never locked.
  const locked = Boolean(profile.billing?.locked) && !profile.isPlatformAdmin;
  const trialDays = profile.billing?.plan === "trial" ? profile.billing.trialDaysLeft : 0;
  return (
    <AppShell profile={profile}>
      {!locked && trialDays > 0 && profile.role === "admin" && pathname !== "/app/billing" && !isNativeApp() && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-lime-deep bg-lime-soft px-4 py-3">
          <span>
            Free trial: {trialDays} {trialDays === 1 ? "day" : "days"} left.
          </span>
          <Link to="/app/billing" className="font-semibold text-lime-ink hover:underline">
            Subscribe now
          </Link>
        </div>
      )}
      {locked && pathname !== "/app/billing" ? <Locked admin={profile.role === "admin"} /> : <Outlet />}
    </AppShell>
  );
}

function Locked({ admin }: { admin: boolean }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-risk-soft text-risk">
        <Lock className="size-7" />
      </span>
      <h1 className="font-display mt-4 text-3xl font-medium tracking-tight">Subscription needed</h1>
      {admin && !isNativeApp() ? (
        <>
          <p className="mt-2 text-ink-soft">Your free trial or subscription has ended. Subscribe to keep using Origina.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/app/billing">Go to Billing</Link>
          </Button>
        </>
      ) : (
        <p className="mt-2 text-ink-soft">
          Your institution's subscription isn't active. Please contact your administrator.
        </p>
      )}
    </div>
  );
}
