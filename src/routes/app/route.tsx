import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageSkeleton } from "@/components/app-shell";
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
  return (
    <AppShell profile={profile}>
      <Outlet />
    </AppShell>
  );
}
