import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type Ingredient = {
  id: number;
  name: string;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  density: number;
  cost_per_ton: number;
  derived_from?: string;
  blend_order?: number;
};

export default function IngredientsAdmin({
  token,
}: {
  token: string;
}) {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({
    name: "",
    analysis_n: "",
    analysis_p: "",
    analysis_k: "",
    analysis_s: "",
    density: "",
    cost_per_ton: "",
    derived_from: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);

  // Fetch all ingredients on mount
  useEffect(() => {
    fetch("http://192.168.1.175:8000/ingredients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) =>
        setIngredients(
          [...data].sort(
            (a, b) =>
              (a.blend_order ?? Number.MAX_SAFE_INTEGER) -
              (b.blend_order ?? Number.MAX_SAFE_INTEGER)
          )
        )
      )
      .catch(() => setError("Failed to load ingredients"));
  }, [token]);

  // Update form fields for editing
  const startEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setForm({
      name: ingredient.name,
      analysis_n: String(ingredient.analysis_n),
      analysis_p: String(ingredient.analysis_p),
      analysis_k: String(ingredient.analysis_k),
      analysis_s: String(ingredient.analysis_s),
      density: String(ingredient.density),
      cost_per_ton: String(ingredient.cost_per_ton),
      derived_from: ingredient.derived_from || "",
    });
    setError(null);
  };

  // Reset form
  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      analysis_n: "",
      analysis_p: "",
      analysis_k: "",
      analysis_s: "",
      density: "",
      cost_per_ton: "",
      derived_from: "",
    });
    setError(null);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit form for add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = {
      name: form.name,
      analysis_n: parseFloat(form.analysis_n),
      analysis_p: parseFloat(form.analysis_p),
      analysis_k: parseFloat(form.analysis_k),
      analysis_s: parseFloat(form.analysis_s) || 0,
      density: parseFloat(form.density),
      cost_per_ton: parseFloat(form.cost_per_ton),
      derived_from: form.derived_from.trim() || "",
    };

    try {
      let response;
      if (editing) {
        // Update
        response = await fetch(
          `http://192.168.1.175:8000/ingredients/${editing.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );
      } else {
        // Add
        response = await fetch("http://192.168.1.175:8000/ingredients", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }
      // Refresh list after add/edit
      fetch("http://192.168.1.175:8000/ingredients", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) =>
          setIngredients(
            [...data].sort(
              (a, b) =>
                (a.blend_order ?? Number.MAX_SAFE_INTEGER) -
                (b.blend_order ?? Number.MAX_SAFE_INTEGER)
            )
          )
        );
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error saving ingredient");
    }
  };

  // Delete ingredient
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this ingredient?")) return;
    try {
      const response = await fetch(
        `http://192.168.1.175:8000/ingredients/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Error deleting");
      setIngredients((ings) => ings.filter((i) => i.id !== id));
      resetForm();
    } catch {
      setError("Delete failed");
    }
  };

  // Handle drag end
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(ingredients);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setIngredients(reordered);
    setOrderChanged(true);
  };

  // Save new order to backend
  const saveOrder = async () => {
    try {
      const response = await fetch(
        "http://192.168.1.175:8000/ingredients/reorder",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: ingredients.map((i) => i.id) }),
        }
      );
      if (!response.ok) throw new Error("Failed to save order");
      setOrderChanged(false);
    } catch {
      setError("Failed to save order");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Button onClick={() => navigate("/admin")} className="mb-6">
        &larr; Back to Admin Tools
      </Button>
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-4">Ingredients Admin</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold">Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">N (%)</label>
              <Input
                name="analysis_n"
                type="number"
                value={form.analysis_n}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">P (%)</label>
              <Input
                name="analysis_p"
                type="number"
                value={form.analysis_p}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">K (%)</label>
              <Input
                name="analysis_k"
                type="number"
                value={form.analysis_k}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">S (%)</label>
              <Input
                name="analysis_s"
                type="number"
                value={form.analysis_s}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Density</label>
              <Input
                name="density"
                type="number"
                value={form.density}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Cost per Ton ($)</label>
              <Input
                name="cost_per_ton"
                type="number"
                value={form.cost_per_ton}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Derived From</label>
              <Input
                name="derived_from"
                value={form.derived_from}
                onChange={handleChange}
                placeholder="e.g., Ammonium Sulfate, Potash, etc."
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{editing ? "Update" : "Add"}</Button>
              {editing && (
                <Button type="button" onClick={resetForm} variant="secondary">
                  Cancel
                </Button>
              )}
            </div>
          </form>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div>
            <h3 className="font-semibold mb-2">Blend Sheet Order (Drag &amp; Drop)</h3>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="ingredients">
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="mb-2"
                  >
                    {ingredients.map((i, idx) => (
                      <Draggable
                        key={i.id}
                        draggableId={i.id.toString()}
                        index={idx}
                      >
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex gap-3 mb-1 items-center bg-white rounded shadow p-2 ${
                              snapshot.isDragging ? "ring-2 ring-green-700" : ""
                            }`}
                          >
                            <span className="font-mono w-48">{i.name}</span>
                            <span>
                              {i.analysis_n}-{i.analysis_p}-{i.analysis_k}
                              {i.analysis_s ? `-${i.analysis_s}` : ""}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Density: {i.density}, Cost: ${i.cost_per_ton}
                            </span>
                            {i.derived_from && (
                              <span className="text-xs text-muted-foreground ml-2 italic">
                                Derived: {i.derived_from}
                              </span>
                            )}
                            <Button size="sm" onClick={() => startEdit(i)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(i.id)}
                            >
                              Delete
                            </Button>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
            {orderChanged && (
              <Button onClick={saveOrder} className="mt-2">
                Save Blend Sheet Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
