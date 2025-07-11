import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Ingredient = {
  name: string;
  derived_from?: string;
};

type Customer = {
  name: string;
};

type Blend = {
  id: number;
  customer: Customer;
  analysis_n: number;
  analysis_p: number;
  analysis_k: number;
  analysis_s: number;
  total_weight: number;
  ingredients: Ingredient[];
};

export default function TagGeneratorPage({ token }: { token: string }) {
  const [blends, setBlends] = useState<Blend[]>([]);
  const [selected, setSelected] = useState<Blend | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://192.168.1.175:8000/blends", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setBlends)
      .catch(() => setError("Failed to load blends"));
  }, [token]);

  const derivedFromList = selected
    ? selected.ingredients
        .map(i => i.derived_from?.trim())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(", ")
    : "";

  return (
    <div className="max-w-2xl mx-auto py-6 print:bg-white">
      <h2 className="text-2xl font-bold mb-4 print:hidden">SurGro Tag Generator</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Select Blend Dropdown, Hidden When Printing */}
      <div className="mb-4 print:hidden">
        <label className="block mb-1 font-semibold">Select Blend</label>
        <select
          className="border rounded px-2 py-1"
          value={selected?.id || ""}
          onChange={e => {
            const b = blends.find(bl => bl.id === Number(e.target.value));
            setSelected(b || null);
          }}
        >
          <option value="">-- Select a Blend --</option>
          {blends.map(bl => (
            <option value={bl.id} key={bl.id}>
              {bl.customer.name} | {bl.analysis_n}-{bl.analysis_p}-{bl.analysis_k} | {bl.total_weight} lbs
            </option>
          ))}
        </select>
      </div>

      {/* Tag Preview Card */}
      {selected && (
        <div className="flex justify-center print:mt-8">
          <div
            className="bg-white shadow-xl rounded-xl border-4 border-black px-8 py-8 w-[420px] min-h-[380px] flex flex-col items-center text-black print:shadow-none print:border-black print:rounded-none print:p-0"
            style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}
          >
            <div className="text-lg font-bold uppercase tracking-wide text-center mb-2">
              Bulk Fertilizer Tag
            </div>
            <div className="text-md mb-2 text-center font-semibold">
              {selected.customer.name}
            </div>
            <div className="text-2xl font-extrabold mb-2 text-center tracking-widest">
              {selected.analysis_n}-{selected.analysis_p}-{selected.analysis_k}
              {selected.analysis_s ? `-${selected.analysis_s}` : ""}
            </div>
            <div className="mb-2 text-center">
              <span className="inline-block min-w-[90px]">Net Weight:</span>{" "}
              <span className="font-semibold">{selected.total_weight} lbs</span>
            </div>
            <table className="mx-auto mb-4">
              <tbody>
                <tr>
                  <td className="pr-4">Nitrogen (N)</td>
                  <td className="font-bold">{selected.analysis_n}%</td>
                </tr>
                <tr>
                  <td className="pr-4">Phosphate (P<sub>2</sub>O<sub>5</sub>)</td>
                  <td className="font-bold">{selected.analysis_p}%</td>
                </tr>
                <tr>
                  <td className="pr-4">Potash (K<sub>2</sub>O)</td>
                  <td className="font-bold">{selected.analysis_k}%</td>
                </tr>
                {selected.analysis_s > 0 && (
                  <tr>
                    <td className="pr-4">Sulfur (S)</td>
                    <td className="font-bold">{selected.analysis_s}%</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="font-semibold mt-3 mb-1 text-center underline">Derived From:</div>
            <div className="mb-2 text-center text-sm">{derivedFromList || "—"}</div>
            {/* Optionally add a line for the blend date, batch ID, or plant location if you want */}
            <div className="mt-2 text-xs text-center opacity-60">Bulloch Fertilizer Co., Inc.</div>
          </div>
        </div>
      )}

      {/* Print Button, Hidden When Printing */}
      {selected && (
        <div className="flex justify-center mt-4 print:hidden">
          <Button onClick={() => window.print()}>Print Tag</Button>
        </div>
      )}

      {!selected && (
        <div className="text-muted-foreground text-center print:hidden">
          Select a blend to preview its tag.
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-black { border-color: #000 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
