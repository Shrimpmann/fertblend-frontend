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

type Chemical = {
  id: number;
  name: string;
  ai_percent: number;
  cost_per_lb: number;
};

type BlendResult = {
  ingredients: { id: number; name: string; weight: number; cost: number }[];
  chemicals: { id: number; name: string; weight: number; cost: number }[];
  total_cost: number;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  total_weight: number;
  notes?: string;
};

export default function SurgrolatorPage({
  token,
  onBack,
}: {
  token: string;
  onBack: () => void;
}) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [fillerId, setFillerId] = useState<number | null>(null);
  const [calculationType, setCalculationType] = useState<"analysis" | "per_acre">("analysis");
  const [targetN, setTargetN] = useState("");
  const [targetP, setTargetP] = useState("");
  const [targetK, setTargetK] = useState("");
  const [targetS, setTargetS] = useState("");
  const [totalWeight, setTotalWeight] = useState(""); // For "analysis"
  const [acres, setAcres] = useState(""); // For "per_acre"
  const [chemicalInputs, setChemicalInputs] = useState<{ [id: number]: string }>({});
  const [result, setResult] = useState<BlendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Fetch ingredient and chemical lists on mount
  useEffect(() => {
    fetch("http://192.168.1.175:8000/ingredients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setIngredients)
      .catch(() => setError("Failed to load ingredients"));
    fetch("http://192.168.1.175:8000/chemicals", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setChemicals)
      .catch(() => setError("Failed to load chemicals"));
    fetch("http://192.168.1.175:8000/customers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => setError("Failed to load customers"));
  }, [token]);

  // Handler for chemical lbs/ton input
  const handleChemicalChange = (id: number, value: string) => {
    setChemicalInputs((prev) => ({ ...prev, [id]: value }));
  };

  // Handle blend calculation
  const handleBlend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!selectedCustomerId) {
      setError("Please select a customer.");
      setLoading(false);
      return;
    }

    try {
      const blendInput: any = {
        customer_id: selectedCustomerId,
        calculation_type: calculationType,
        target_n: parseFloat(targetN) || 0,
        target_p: parseFloat(targetP) || 0,
        target_k: parseFloat(targetK) || 0,
        target_s: parseFloat(targetS) || 0,
        ingredient_ids: selectedIngredients,
        chemicals: Object.entries(chemicalInputs)
          .filter(([_, lbs]) => !!lbs)
          .map(([id, lbs]) => ({
            chemical_id: Number(id),
            lbs_per_ton: parseFloat(lbs),
          })),
      };
      if (fillerId) blendInput.filler_id = fillerId;
      if (calculationType === "analysis") {
        blendInput.total_weight = parseFloat(totalWeight) || 0;
      } else {
        blendInput.acres = parseFloat(acres) || 0;
      }

      const res = await fetch("http://192.168.1.175:8000/blend", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blendInput),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Blend calculation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 self-start ml-4"
        onClick={onBack}
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-6">Surgrolator</h1>
      <Card className="w-full max-w-2xl shadow-lg mb-10">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleBlend} className="space-y-4">
            <div className="mb-3">
              <label className="font-semibold mb-2 block">Customer</label>
              <select
                className="border border-gray-300 rounded px-2 py-1 w-60"
                value={selectedCustomerId || ""}
                onChange={e => setSelectedCustomerId(Number(e.target.value))}
                required
                disabled={loading}
              >
                <option value="">Select Customer</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>{cust.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="font-semibold mb-2 block">Ingredients</label>
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2">
                  {ingredients.map((ing) => (
                    <label key={ing.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-green-700"
                        value={ing.id}
                        checked={selectedIngredients.includes(ing.id)}
                        onChange={e =>
                          setSelectedIngredients(
                            e.target.checked
                              ? [...selectedIngredients, ing.id]
                              : selectedIngredients.filter(i => i !== ing.id)
                          )
                        }
                        disabled={loading}
                      />
                      <span>
                        {ing.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {ing.analysis_n}-{ing.analysis_p}-{ing.analysis_k}
                          {ing.analysis_s ? `-${ing.analysis_s}` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold mb-2 block">Chemicals (lbs/ton)</label>
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2">
                  {chemicals.map((chem) => (
                    <label key={chem.id} className="flex items-center gap-2">
                      <span className="w-28">{chem.name}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={chemicalInputs[chem.id] || ""}
                        onChange={e => handleChemicalChange(chem.id, e.target.value)}
                        placeholder="lbs/ton"
                        className="w-20"
                        disabled={loading}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-8 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="calc_type"
                  value="analysis"
                  checked={calculationType === "analysis"}
                  onChange={() => setCalculationType("analysis")}
                  disabled={loading}
                />
                By Analysis (%)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="calc_type"
                  value="per_acre"
                  checked={calculationType === "per_acre"}
                  onChange={() => setCalculationType("per_acre")}
                  disabled={loading}
                />
                By Acre (lbs/acre)
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              <Input
                label="N"
                placeholder={calculationType === "analysis" ? "N (%)" : "N (lbs/acre)"}
                value={targetN}
                onChange={e => setTargetN(e.target.value)}
                type="number"
                step="0.01"
                required
                disabled={loading}
                className="w-32"
              />
              <Input
                label="P"
                placeholder={calculationType === "analysis" ? "P (%)" : "P (lbs/acre)"}
                value={targetP}
                onChange={e => setTargetP(e.target.value)}
                type="number"
                step="0.01"
                required
                disabled={loading}
                className="w-32"
              />
              <Input
                label="K"
                placeholder={calculationType === "analysis" ? "K (%)" : "K (lbs/acre)"}
                value={targetK}
                onChange={e => setTargetK(e.target.value)}
                type="number"
                step="0.01"
                required
                disabled={loading}
                className="w-32"
              />
              <Input
                label="S"
                placeholder={calculationType === "analysis" ? "S (%)" : "S (lbs/acre)"}
                value={targetS}
                onChange={e => setTargetS(e.target.value)}
                type="number"
                step="0.01"
                disabled={loading}
                className="w-32"
              />
              {calculationType === "analysis" && (
                <Input
                  label="Total Weight"
                  placeholder="Batch weight (lbs)"
                  value={totalWeight}
                  onChange={e => setTotalWeight(e.target.value)}
                  type="number"
                  step="1"
                  min="1"
                  required
                  disabled={loading}
                  className="w-40"
                />
              )}
              {calculationType === "per_acre" && (
                <Input
                  label="Acres"
                  placeholder="Number of acres"
                  value={acres}
                  onChange={e => setAcres(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={loading}
                  className="w-40"
                />
              )}
            </div>
            <div className="mb-2">
              <label className="font-semibold mb-2 block">Filler Ingredient</label>
              <select
                className="border border-gray-300 rounded px-2 py-1 w-60"
                value={fillerId || ""}
                onChange={e =>
                  setFillerId(e.target.value === "" ? null : Number(e.target.value))
                }
                disabled={loading}
              >
                <option value="">(No filler)</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground block mt-1">
                Optional: Used only to bring batch to exact weight (e.g. lime, sand).
              </span>
            </div>
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Calculating..." : "Calculate Blend"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {result && (
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="p-8 space-y-4">
            <h2 className="text-xl font-bold mb-2">Blend Results</h2>
            <div>
              <strong>Total Cost:</strong> ${result.total_cost.toFixed(2)}
            </div>
            <div>
              <strong>Actual Analysis:</strong>{" "}
              {result.analysis_n}-{result.analysis_p}-{result.analysis_k}
              {result.analysis_s ? `-${result.analysis_s}` : ""}
            </div>
            <div>
              <strong>Total Weight:</strong> {result.total_weight} lbs
            </div>
            <div>
              <strong>Ingredients:</strong>
              <ul className="ml-4 list-disc">
                {result.ingredients.map((ing) => (
                  <li key={ing.id}>
                    {ing.name}: {ing.weight} lbs (${ing.cost})
                  </li>
                ))}
              </ul>
            </div>
            {result.chemicals && result.chemicals.length > 0 && (
              <div>
                <strong>Chemicals:</strong>
                <ul className="ml-4 list-disc">
                  {result.chemicals.map((chem) => (
                    <li key={chem.id}>
                      {chem.name}: {chem.weight} lbs (${chem.cost})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.notes && (
              <div className="text-muted-foreground text-sm mt-2">
                {result.notes}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
