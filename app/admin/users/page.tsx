"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { apiRequest } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const roles = ["customer", "agent", "admin"];

export default function AdminUsersPage() {
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;
  const currentRole =
    currentUser && "role" in currentUser ? String(currentUser.role) : "customer";
  const isAdmin = currentRole === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadUsers() {
      try {
        const data = await apiRequest<AdminUser[]>("/api/admin/users");
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load users.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [isAdmin]);

  async function handleRoleChange(id: string, role: string) {
    setSavingId(id);

    try {
      const saved = await apiRequest<AdminUser>(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });

      setUsers((current) =>
        current.map((u) => (u.id === saved.id ? saved : u))
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the role.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-bold">Manage users</h2>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700"
          >
            Back to dashboard
          </Link>
        </div>

        {isPending ? (
          <p className="mt-6 text-sm text-gray-500">Loading...</p>
        ) : !isAdmin ? (
          <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Only admins can open this page.
          </p>
        ) : (
          <>
            <p className="mt-1 text-gray-500">
              Choose a role for each person. Customers can create and follow
              their own tickets, agents can work on all tickets, and admins can
              do everything.
            </p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Loading users...</p>
              ) : (
                users.map((person) => {
                  const isMe = person.id === currentUser?.id;

                  return (
                    <div
                      key={person.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-300 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700"
                    >
                      <div>
                        <p className="font-semibold">
                          {person.name}
                          {isMe && (
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{person.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(person.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <select
                        value={person.role}
                        disabled={isMe || savingId === person.id}
                        onChange={(e) =>
                          handleRoleChange(person.id, e.target.value)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm capitalize text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}