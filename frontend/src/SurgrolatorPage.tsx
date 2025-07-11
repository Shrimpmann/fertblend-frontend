import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Ingredient = {
  id: number;
  name: string;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  derived_from?: string;
};

type Chemical = {
  id: number;
  name: string;
  ai_percent: number;
  cost_per_lb: number;
};

type Customer = {
  id: number;
  name: string;
};

type BlendIngredient = {
  id: number;
  name: string;
  weight: number;
  cost: number;
};

type BlendChemical = {
  id: number;
  name: string;
  weight: number;
  cost: number;
};

type BlendResult = {
  ingredients: BlendIngredient[];
  chemicals: BlendChemical[];
  total_cost: number;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  total_weight: number;
  notes?: string;
};

const MICRONUTRIENT_LIST = [
  { key: "fe", label: "Iron (Fe)" },
  { key: "zn", label: "Zinc (Zn)" },
  { key: "mn", label: "Manganese (Mn)" },
  { key: "b", label: "Boron (B)" },
  { key: "cu", label: "Copper (Cu)" },
  { key: "mo", label: "Molybdenum (Mo)" },
];

const SERVICE_OPTIONS = [
  "Spreading",
  "Delivery",
  "Bagging",
  "Consulting",
  "Sampling",
  "Blending Only",
];

export default function SurgrolatorPage({
  token,
  onBack,
}: {
  token: string;
  onBack: () => void;
}) {
  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);

  // Selections/inputs
  const [customerId, setCustomerId] = useState<number | "">("");
  const [applicationRate, setApplicationRate] = useState<number>(250); // lbs/acre
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [selectedChemicals, setSelectedChemicals] = useState<{ chemical_id: number; lbs_per_ton: number }[]>([]);
  const [targetN, setTargetN] = useState<number>(10);
  const [targetP, setTargetP] = useState<number>(10);
  const [targetK, setTargetK] = useState<number>(10);
  const [targetS, setTargetS] = useState<number>(0);
  const [totalWeight, setTotalWeight] = useState<number>(2000);
  const [margin, setMargin] = useState<number>(10);
  const [micronutrients, setMicronutrients] = useState<Record<string, number>>({
    fe: 0,
    zn: 0,
    mn: 0,
    b: 0,
    cu: 0,
    mo: 0,
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // UI
  const [result, setResult] = useState<BlendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch customers, ingredients, chemicals
  useEffect(() => {
    fetch("http://192.168.1.175:8000/customers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => setCustomers([]));

    fetch("http://192.168.1.175:8000/ingredients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setIngredients)
      .catch(() => setIngredients([]));

    fetch("http://192.168.1.175:8000/chemicals", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setChemicals)
      .catch(() => setChemicals([]));
  }, [token]);

  // Handler for chemical pounds-per-ton
  const handleChemicalLbsChange = (chemId: number, lbs: number) => {
    setSelectedChemicals((prev) => {
      const exists = prev.find((c) => c.chemical_id === chemId);
      if (exists) {
        return prev.map((c) =>
          c.chemical_id === chemId ? { ...c, lbs_per_ton: lbs } : c
        );
      } else {
        return [...prev, { chemical_id: chemId, lbs_per_ton: lbs }];
      }
    });
  };

  // Handler for micronutrients
  const handleMicronutrientChange = (key: string, value: number) => {
    setMicronutrients((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handler for services
  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  // Submit blend calculation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (selectedIngredients.length < 1) {
      setError("Select at least one ingredient.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://192.168.1.175:8000/blend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          calculation_type: "analysis",
          target_n: targetN,
          target_p: targetP,
          target_k: targetK,
          target_s: targetS,
          total_weight: totalWeight,
          application_rate: applicationRate,
          margin: margin,
          micronutrients: micronutrients,
          ingredient_ids: selectedIngredients,
          chemicals: selectedChemicals.filter((c) => c.lbs_per_ton > 0),
          services: selectedServices,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Blend calculation failed.");
      }
      setResult(await response.json());
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Button variant="outline" className="mb-5" onClick={onBack}>
        ← Back to Dashboard
      </Button>
      <h2 className="text-2xl font-bold mb-4">SurGro Blend Calculator</h2>
      {error && (
        <div className="text-red-600 bg-red-100 rounded p-2 mb-3">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Selection */}
        <div>
          <label className="block mb-1 font-semibold">Customer</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            required
          >
            <option value="">-- Select a customer --</option>
            {customers.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {/* Application Rate */}
        <div>
          <label className="block mb-1 font-semibold">
            Application Rate (lbs/acre)
          </label>
          <input
            type="number"
            min={1}
            value={applicationRate}
            onChange={(e) => setApplicationRate(Number(e.target.value))}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>
        {/* Blend Targets */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-semibold">Nitrogen (N)%</label>
            <input
              type="number"
              min={0}
              value={targetN}
              onChange={(e) => setTargetN(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Phosphate (P₂O₅)%</label>
            <input
              type="number"
              min={0}
              value={targetP}
              onChange={(e) => setTargetP(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Potash (K₂O)%</label>
            <input
              type="number"
              min={0}
              value={targetK}
              onChange={(e) => setTargetK(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Sulfur (S)%</label>
            <input
              type="number"
              min={0}
              value={targetS}
              onChange={(e) => setTargetS(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">
              Total Batch Weight (lbs)
            </label>
            <input
              type="number"
              min={100}
              step={1}
              value={totalWeight}
              onChange={(e) => setTotalWeight(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
        </div>
        {/* Margin */}
        <div>
          <label className="block mb-1 font-semibold">
            Margin/Markup (%){" "}
            <span className="text-gray-500 text-xs">(added to total cost)</span>
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        {/* Ingredients Selection */}
        <div>
          <label className="block mb-1 font-semibold">Ingredients</label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
            {ingredients.map((ing) => (
              <label key={ing.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={ing.id}
                  checked={selectedIngredients.includes(ing.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIngredients([...selectedIngredients, ing.id]);
                    } else {
                      setSelectedIngredients(
                        selectedIngredients.filter((id) => id !== ing.id)
                      );
                    }
                  }}
                />
                <span>
                  {ing.name} ({ing.analysis_n}-{ing.analysis_p}-{ing.analysis_k}
                  {ing.analysis_s > 0 ? `-${ing.analysis_s}` : ""})
                </span>
              </label>
            ))}
          </div>
        </div>
        {/* Micronutrients */}
        <div>
          <label className="block mb-1 font-semibold">
            Micronutrients (% in final blend)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MICRONUTRIENT_LIST.map((m) => (
              <div key={m.key} className="flex items-center space-x-2">
                <span className="w-20">{m.label}</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="border rounded px-2 py-1 w-16"
                  value={micronutrients[m.key]}
                  onChange={(e) =>
                    handleMicronutrientChange(m.key, Number(e.target.value))
                  }
                  placeholder="%"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Chemicals Section */}
        <div>
          <label className="block mb-1 font-semibold">
            Chemicals (lbs per ton)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
            {chemicals.map((chem) => (
              <div key={chem.id} className="flex items-center space-x-2">
                <span className="flex-1">{chem.name}</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="border rounded px-2 py-1 w-20"
                  value={
                    selectedChemicals.find((c) => c.chemical_id === chem.id)
                      ?.lbs_per_ton || ""
                  }
                  onChange={(e) =>
                    handleChemicalLbsChange(chem.id, Number(e.target.value))
                  }
                  placeholder="lbs/ton"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Added Services */}
        <div>
          <label className="block mb-1 font-semibold">Added Services</label>
          <div className="flex flex-wrap gap-3">
            {SERVICE_OPTIONS.map((service) => (
              <label
                key={service}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => handleServiceToggle(service)}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Submit */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Calculating..." : "Calculate Blend"}
        </Button>
      </form>
      {/* Result */}
      {result && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">Blend Result</h3>
            <div className="mb-3">
              <strong>Total Weight:</strong> {result.total_weight} lbs<br />
              <strong>Analysis:</strong> {result.analysis_n}-{result.analysis_p}-
              {result.analysis_k}
              {result.analysis_s > 0 ? `-${result.analysis_s}` : ""}
              <br />
              <strong>Total Cost:</strong> ${result.total_cost}
            </div>
            <div>
              <strong>Ingredients:</strong>
              <ul className="list-disc list-inside">
                {result.ingredients.map((ing) => (
                  <li key={ing.id}>
                    {ing.name}: {ing.weight} lbs (${ing.cost})
                  </li>
                ))}
              </ul>
            </div>
            {result.chemicals.length > 0 && (
              <div className="mt-3">
                <strong>Chemicals:</strong>
                <ul className="list-disc list-inside">
                  {result.chemicals.map((chem) => (
                    <li key={chem.id}>
                      {chem.name}: {chem.weight} lbs (${chem.cost})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.notes && (
              <div className="mt-3 text-gray-500">{result.notes}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
