import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Chemical = {
  id: number;
  name: string;
  ai_percent: number;
  cost_per_lb: number;
};

export default function ChemicalsAdmin({ token }: { token: string }) {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Chemical>>({});
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://192.168.1.175:8000/chemicals", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setChemicals)
      .catch(() => setError("Failed to load chemicals"))
      .finally(() => setLoading(false));
  }, [token]);

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `http://192.168.1.175:8000/chemicals/${editingId}`
        : "http://192.168.1.175:8000/chemicals";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          ai_percent: parseFloat(form.ai_percent as any) || 0,
          cost_per_lb: parseFloat(form.cost_per_lb as any) || 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await fetch("http://192.168.1.175:8000/chemicals", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      setChemicals(updated);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save chemical");
    }
    setLoading(false);
  };

  const handleEdit = (chemical: Chemical) => {
    setEditingId(chemical.id);
    setForm({
      name: chemical.name,
      ai_percent: chemical.ai_percent,
      cost_per_lb: chemical.cost_per_lb,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this chemical?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://192.168.1.175:8000/chemicals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setChemicals(chemicals.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      {/* CONSISTENT BACK BUTTON: */}
      <Button
        onClick={() => navigate("/admin")}
        className="mb-6 self-start ml-4"
        variant="secondary"
      >
        &larr; Back to Admin Tools
      </Button>
      <h1 className="text-3xl font-bold mb-6">Chemicals Management</h1>
      <Card className="w-full max-w-3xl shadow-lg mb-10">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="name">Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Chemical Name"
                  value={form.name || ""}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-48"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="ai_percent">AI Percent</label>
                <Input
                  id="ai_percent"
                  name="ai_percent"
                  placeholder="Active Ingredient %"
                  type="number"
                  step="0.01"
                  value={form.ai_percent || ""}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="cost_per_lb">Cost per lb</label>
                <Input
                  id="cost_per_lb"
                  name="cost_per_lb"
                  placeholder="Cost per lb"
                  type="number"
                  step="0.01"
                  value={form.cost_per_lb || ""}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-32"
                />
              </div>
            </div>
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update Chemical" : "Add Chemical"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="w-full max-w-3xl shadow-lg">
        <CardContent className="p-8 space-y-2">
          <h2 className="text-xl font-bold mb-2">Chemical List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">Name</th>
                  <th className="py-2 px-3 text-left">AI %</th>
                  <th className="py-2 px-3 text-left">Cost/lb</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {chemicals.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 px-3">{i.name}</td>
                    <td className="py-2 px-3">{i.ai_percent}</td>
                    <td className="py-2 px-3">${i.cost_per_lb}</td>
                    <td className="py-2 px-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleEdit(i)}
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleDelete(i.id)}
                        variant="outline"
                        className="text-red-600 border-red-600"
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {chemicals.length === 0 && (
              <div className="text-gray-500 text-center py-4">No chemicals found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
