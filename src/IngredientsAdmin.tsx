// src/IngredientsAdmin.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Ingredient = {
  id: number;
  name: string;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  density: number;
  cost_per_ton: number;
};

type Props = {
  token: string;
  onBack: () => void;
};

export default function IngredientsAdmin({ token, onBack }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for add/edit
  const [form, setForm] = useState<Partial<Ingredient>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch ingredient list
  const fetchIngredients = () => {
    setLoading(true);
    setError(null);
    fetch("http://192.168.1.175:8000/ingredients", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setIngredients)
      .catch(() => setError("Failed to load ingredients"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIngredients();
  }, [token]);

  // Handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setForm({ ...ingredient });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = editingId
        ? `http://192.168.1.175:8000/ingredients/${editingId}`
        : "http://192.168.1.175:8000/ingredients";
      const method = editingId ? "PUT" : "POST";
      const body = {
        name: form.name,
        analysis_n: parseFloat(form.analysis_n as any) || 0,
        analysis_p: parseFloat(form.analysis_p as any) || 0,
        analysis_k: parseFloat(form.analysis_k as any) || 0,
        analysis_s: parseFloat(form.analysis_s as any) || 0,
        density: parseFloat(form.density as any) || 0,
        cost_per_ton: parseFloat(form.cost_per_ton as any) || 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      fetchIngredients();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Save failed");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://192.168.1.175:8000/ingredients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      fetchIngredients();
      if (editingId === id) resetForm();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 self-start ml-4"
        onClick={onBack}
      >
        &larr; Back to Admin Home
      </button>
      <h1 className="text-3xl font-bold mb-8">Ingredients Admin</h1>
      <Card className="w-full max-w-2xl shadow-lg mb-10">
        <CardContent className="p-8">
          <form className="grid grid-cols-2 gap-4" onSubmit={handleSave}>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Urea"
                value={form.name || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="analysis_n">
                N (%)
              </label>
              <Input
                id="analysis_n"
                name="analysis_n"
                type="number"
                step="0.01"
                placeholder="46"
                value={form.analysis_n || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="analysis_p">
                P (%)
              </label>
              <Input
                id="analysis_p"
                name="analysis_p"
                type="number"
                step="0.01"
                placeholder="0"
                value={form.analysis_p || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="analysis_k">
                K (%)
              </label>
              <Input
                id="analysis_k"
                name="analysis_k"
                type="number"
                step="0.01"
                placeholder="0"
                value={form.analysis_k || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="analysis_s">
                S (%)
              </label>
              <Input
                id="analysis_s"
                name="analysis_s"
                type="number"
                step="0.01"
                placeholder="0"
                value={form.analysis_s || ""}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="density">
                Density (lbs/ft³)
              </label>
              <Input
                id="density"
                name="density"
                type="number"
                step="0.01"
                placeholder="45"
                value={form.density || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cost_per_ton">
                Cost per Ton ($)
              </label>
              <Input
                id="cost_per_ton"
                name="cost_per_ton"
                type="number"
                step="0.01"
                placeholder="400"
                value={form.cost_per_ton || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update" : "Add"} Ingredient
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
          {error && <div className="text-red-600 mt-3">{error}</div>}
        </CardContent>
      </Card>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-2">All Ingredients</h2>
          {loading && <div>Loading...</div>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-left">Name</th>
                <th>N</th>
                <th>P</th>
                <th>K</th>
                <th>S</th>
                <th>Density</th>
                <th>Cost/Ton</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} className="border-b">
                  <td>{ing.name}</td>
                  <td>{ing.analysis_n}</td>
                  <td>{ing.analysis_p}</td>
                  <td>{ing.analysis_k}</td>
                  <td>{ing.analysis_s}</td>
                  <td>{ing.density}</td>
                  <td>${ing.cost_per_ton}</td>
                  <td className="flex gap-2">
                    <Button size="sm" onClick={() => startEdit(ing)} variant="secondary">
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(ing.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
