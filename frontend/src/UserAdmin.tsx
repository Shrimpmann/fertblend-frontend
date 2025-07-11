import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  username: string;
  is_admin: boolean;
};

export default function UserAdmin({
  token,
  onBack,
}: {
  token: string;
  onBack: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    fetch("http://192.168.1.175:8000/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setError("Failed to load users"));
  }, [token, showAdd, editId]);

  // Add user
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("http://192.168.1.175:8000/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          is_admin: isAdmin,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowAdd(false);
      setUsername("");
      setPassword("");
      setIsAdmin(false);
    } catch (err: any) {
      setError(err.message || "Add failed");
    }
  };

  // Edit user
  const handleEdit = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`http://192.168.1.175:8000/users/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: editPassword || undefined,
          is_admin: editIsAdmin,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditId(null);
      setEditPassword("");
      setEditIsAdmin(false);
    } catch (err: any) {
      setError(err.message || "Edit failed");
    }
  };

  // Delete user
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`http://192.168.1.175:8000/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setEditId(null);
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  // UI
  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 self-start ml-4"
        onClick={onBack}
      >
        &larr; Back to Admin Tools
      </button>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <Card className="w-full max-w-xl shadow-lg mb-8">
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="text-red-600 text-center text-sm">{error}</div>
          )}
          {showAdd ? (
            <form
              onSubmit={handleAdd}
              className="flex flex-col gap-4 bg-gray-50 p-4 rounded"
            >
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                Admin
              </label>
              <div className="flex gap-3">
                <Button type="submit" className="w-1/2">
                  Add User
                </Button>
                <Button
                  type="button"
                  className="w-1/2 bg-gray-200 text-gray-800"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowAdd(true)} className="mb-2">
              + Add New User
            </Button>
          )}
          <table className="w-full border text-sm mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 border">Username</th>
                <th className="py-2 px-3 border">Admin?</th>
                <th className="py-2 px-3 border"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) =>
                editId === u.id ? (
                  <tr key={u.id} className="bg-yellow-50">
                    <td className="border px-2">
                      <span className="font-semibold">{u.username}</span>
                    </td>
                    <td className="border px-2">
                      <input
                        type="checkbox"
                        checked={editIsAdmin}
                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                      />
                    </td>
                    <td className="border px-2 flex gap-1">
                      <Input
                        type="password"
                        placeholder="New password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-28"
                      />
                      <Button
                        className="px-2"
                        onClick={() => handleEdit(u.id)}
                      >
                        Save
                      </Button>
                      <Button
                        className="px-2 bg-gray-200 text-gray-800"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id}>
                    <td className="border px-2">{u.username}</td>
                    <td className="border px-2">
                      {u.is_admin ? "✔️" : ""}
                    </td>
                    <td className="border px-2 flex gap-1">
                      <Button
                        className="px-2"
                        onClick={() => {
                          setEditId(u.id);
                          setEditIsAdmin(u.is_admin);
                          setEditPassword("");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        className="px-2 bg-red-200 text-red-800"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
