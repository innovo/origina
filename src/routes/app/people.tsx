import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listPeople, setPersonRole } from "@/lib/origina/actions";
import { CAMPUSES, ROLE_META, type Role } from "@/lib/origina/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/people")({ component: People });

function People() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["people"], queryFn: () => listPeople() });
  const mutate = useMutation({
    mutationFn: (input: { userId: string; role: Role }) => setPersonRole({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Administrator
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">People</h1>
      </header>
      {q.error && (
        <p className="text-sm text-risk">
          {q.error instanceof Error ? q.error.message : "Administrators only."}
        </p>
      )}
      <div className="overflow-x-auto rounded-[22px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Campus</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((p) => (
              <tr key={p.user_id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {p.full_name}
                  {p.student_number && (
                    <span className="ml-2 text-xs text-muted">{p.student_number}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {CAMPUSES.find((c) => c.id === p.campus)?.place}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-10 rounded-lg border border-line bg-surface-2 px-2 text-sm"
                    value={p.role}
                    onChange={(e) =>
                      mutate.mutate({ userId: p.user_id, role: e.target.value as Role })
                    }
                  >
                    {(Object.keys(ROLE_META) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
