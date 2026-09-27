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
  if (!profileQuery.data && !onboarding) {
    return <Navigate to="/app/onboarding" />;
  }
  if (profileQuery.data && onboarding) {
    return <Navigate to="/app" />;
  }
  if (!profileQuery.data) {
    return <Outlet />;
  }
  return (
    <AppShell profile={profileQuery.data}>
      <Outlet />
    </AppShell>
  );
}
