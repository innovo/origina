import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signOut } from "@/lib/auth/client";
import { deleteMyAccount } from "@/lib/origina/actions";

/** Permanently delete the signed-in account (required by Google Play). */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount({ data: { confirm } });
      await signOut("/").catch(() => window.location.assign("/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[22px] border border-risk/30 bg-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold text-risk">
        <Trash2 className="size-5" /> Delete account
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
        <li>Your login, name and email are deleted permanently.</li>
        <li>Work you submitted stays with your institution, shown as "Deleted user".</li>
        <li>This can't be undone.</li>
      </ul>
      {!open ? (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="del-confirm">Type DELETE to confirm</Label>
            <Input
              id="del-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="max-w-xs"
            />
          </div>
          {error && <p className="text-sm text-risk">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={onDelete} disabled={busy || confirm !== "DELETE"}>
              {busy ? "Deleting…" : "Delete permanently"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
