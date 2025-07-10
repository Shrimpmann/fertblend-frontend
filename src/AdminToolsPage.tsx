import { useState } from "react";
import IngredientsAdmin from "./IngredientsAdmin";
import ChemicalsAdmin from "./ChemicalsAdmin";
import CustomerAdmin from "./CustomerAdmin";
import AdminToolsDashboard from "./AdminToolsDashboard";
import { Button } from "@/components/ui/button";

export default function AdminToolsPage({ token, onBack }: { token: string; onBack: () => void }) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Show the dashboard menu unless a panel is selected
  return (
    <div className="min-h-screen bg-muted pt-8">
      <Button className="mb-6 ml-4" variant="secondary" onClick={onBack}>
        &larr; Back to Dashboard
      </Button>
      {!activePanel && (
        <AdminToolsDashboard onSelect={setActivePanel} />
      )}
      {activePanel === "ingredients" && (
        <div>
          <Button className="mb-4 ml-4" size="sm" variant="outline" onClick={() => setActivePanel(null)}>
            &larr; Admin Tools Home
          </Button>
          <IngredientsAdmin token={token} />
        </div>
      )}
      {activePanel === "chemicals" && (
        <div>
          <Button className="mb-4 ml-4" size="sm" variant="outline" onClick={() => setActivePanel(null)}>
            &larr; Admin Tools Home
          </Button>
          <ChemicalsAdmin token={token} />
        </div>
      )}
      {activePanel === "customers" && (
        <div>
          <Button className="mb-4 ml-4" size="sm" variant="outline" onClick={() => setActivePanel(null)}>
            &larr; Admin Tools Home
          </Button>
          <CustomerAdmin token={token} />
        </div>
      )}
    </div>
  );
}
