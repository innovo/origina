import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  getProfile,
  listCampuses,
  listCourses,
  listAssignments,
  createCourse,
  createAssignment,
} from "@/lib/origina/actions";

export const Route = createFileRoute("/app/courses")({ component: Courses });

function Courses() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => listCourses() });
  const assignments = useQuery({ queryKey: ["assignments"], queryFn: () => listAssignments() });
  const staff = profile.data?.role === "teacher" || profile.data?.role === "admin";
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const campuses = useQuery({ queryKey: ["campuses"], queryFn: () => listCampuses() });
  const [campus, setCampus] = useState("");
  const [aCourse, setACourse] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");

  const addCourse = useMutation({
    mutationFn: () => createCourse({ data: { code, title, campus: campus || null } }),
    onSuccess: async () => {
      setCode("");
      setTitle("");
      await qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const addAssignment = useMutation({
    mutationFn: () =>
      createAssignment({ data: { courseId: aCourse, title: aTitle, description: aDesc } }),
    onSuccess: async () => {
      setATitle("");
      setADesc("");
      await qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Courses & assignments
        </h1>
      </header>
      {courses.data && courses.data.length === 0 && (
        <p className="rounded-[22px] border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-ink-soft">
          No courses yet.{" "}
          {staff
            ? "Create the first one below, then add assignments students can submit against."
            : "Your lecturers will add courses here."}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(courses.data ?? []).map((c) => {
          return (
            <article key={c.id} className="rounded-[22px] border border-line bg-surface p-5">
              <p className="text-xs uppercase tracking-wider text-muted">{c.code}</p>
              <h2 className="mt-1 font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {[c.campusName, `${c.assignmentCount} assignments`].filter(Boolean).join(" · ")}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {(assignments.data ?? [])
                  .filter((a) => a.courseId === c.id)
                  .map((a) => (
                    <li key={a.id}>{a.title}</li>
                  ))}
              </ul>
            </article>
          );
        })}
      </div>
      {staff && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-[22px] border border-line bg-surface p-5"
            onSubmit={(e) => {
              e.preventDefault();
              addCourse.mutate();
            }}
          >
            <h2 className="font-semibold">New course</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="ctitle">Title</Label>
                <Input
                  id="ctitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              {(campuses.data ?? []).length > 0 && (
                <div>
                  <Label htmlFor="camp">Campus</Label>
                  <select
                    id="camp"
                    className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {(campuses.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {addCourse.error && (
                <p className="text-sm text-risk">{addCourse.error.message}</p>
              )}
              <Button type="submit" disabled={addCourse.isPending}>
                Create course
              </Button>
            </div>
          </form>
          <form
            className="rounded-[22px] border border-line bg-surface p-5"
            onSubmit={(e) => {
              e.preventDefault();
              addAssignment.mutate();
            }}
          >
            <h2 className="font-semibold">New assignment</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="ac">Course</Label>
                <select
                  id="ac"
                  className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm"
                  value={aCourse}
                  onChange={(e) => setACourse(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {(courses.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="at">Title</Label>
                <Input
                  id="at"
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ad">Brief</Label>
                <Textarea
                  id="ad"
                  className="min-h-24"
                  value={aDesc}
                  onChange={(e) => setADesc(e.target.value)}
                />
              </div>
              {addAssignment.error && (
                <p className="text-sm text-risk">{addAssignment.error.message}</p>
              )}
              <Button type="submit" disabled={addAssignment.isPending}>
                Create assignment
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
