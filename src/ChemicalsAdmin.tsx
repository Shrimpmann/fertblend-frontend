import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Chemical = {
  id: number;
  name: string;
  ai_percent: number;
  cost_per_lb: number;
};

export default function ChemicalsAdmin({ token }: { token: string }) {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [newChemical, setNewChemical] = useState<Partial<Chemical>>({});
  const [error, setError] = useState<string | null>(null);

  // Load all chemicals on mount
  useEffect(() => {
    fetch("http://192.168.1.175:8000/chemicals", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setChemicals)
      .catch(() => setError("Failed to load chemicals"));
  }, [token]);

  // Handle input changes for editing or adding
  const handleInputChange = (field: keyof Chemical, value: string, isEdit = false) => {
    if (isEdit) {
      setChemicals(chems =>
        chems.map(chem =>
          chem.id === editing ? { ...chem, [field]: field === "name" ? value : parseFloat(value) || 0 } : chem
        )
      );
    } else {
      setNewChemical(prev => ({
        ...prev,
        [field]: field === "name" ? value : parseFloat(value) || 0,
      }));
    }
  };

  // Add a new chemical
  const handleAdd = async () => {
    setError(null);
    try {
      const res = await fetch("http://192.168.1.175:8000/chemicals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newChemical)
      });
      if (!res.ok) throw new Error("Failed to add chemical");
      const chem = await res.json();
      setChemicals(cs => [...cs, chem]);
      setNewChemical({});
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  // Save edits
  const handleSave = async (id: number) => {
    setError(null);
    const chem = chemicals.find(c => c.id === id);
    if (!chem) return;
    try {
      const res = await fetch(`http://192.168.1.175:8000/chemicals/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(chem)
      });
      if (!res.ok) throw new Error("Failed to update chemical");
      setEditing(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`http://192.168.1.175:8000/chemicals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete chemical");
      setChemicals(cs => cs.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Chemicals</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="space-y-4">
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">% AI</th>
              <th className="p-2">Cost/lb</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chemicals.map(chem => (
              <tr key={chem.id} className="border-b">
                <td className="p-2">
                  {editing === chem.id ? (
                    <Input
                      value={chem.name}
                      onChange={e => handleInputChange("name", e.target.value, true)}
                    />
                  ) : (
                    chem.name
                  )}
                </td>
                <td className="p-2">
                  {editing === chem.id ? (
                    <Input
                      type="number"
                      value={chem.ai_percent}
                      onChange={e => handleInputChange("ai_percent", e.target.value, true)}
                    />
                  ) : (
                    chem.ai_percent
                  )}
                </td>
                <td className="p-2">
                  {editing === chem.id ? (
                    <Input
                      type="number"
                      value={chem.cost_per_lb}
                      onChange={e => handleInputChange("cost_per_lb", e.target.value, true)}
                    />
                  ) : (
                    `$${chem.cost_per_lb}`
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  {editing === chem.id ? (
                    <>
                      <Button size="sm" onClick={() => handleSave(chem.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing(chem.id)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(chem.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td className="p-2">
                <Input
                  value={newChemical.name || ""}
                  onChange={e => handleInputChange("name", e.target.value)}
                  placeholder="New chemical"
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={newChemical.ai_percent ?? ""}
                  onChange={e => handleInputChange("ai_percent", e.target.value)}
                  placeholder="% AI"
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={newChemical.cost_per_lb ?? ""}
                  onChange={e => handleInputChange("cost_per_lb", e.target.value)}
                  placeholder="Cost/lb"
                />
              </td>
              <td className="p-2">
                <Button size="sm" onClick={handleAdd}>
                  Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
