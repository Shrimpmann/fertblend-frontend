import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminToolsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <div className="w-full max-w-xl">
        <Button onClick={() => navigate("/")} className="mb-6">
          ← Back to Main Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Tools</h1>
        <Card>
          <CardContent className="p-8 flex flex-col gap-6">
            <Button
              className="w-full py-6 text-lg"
              variant="secondary"
              onClick={() => navigate("/admin/ingredients")}
            >
              Manage Ingredients
            </Button>
            <Button
              className="w-full py-6 text-lg"
              variant="secondary"
              onClick={() => navigate("/admin/chemicals")}
            >
              Manage Chemicals
            </Button>
            <Button
              className="w-full py-6 text-lg"
              variant="secondary"
              onClick={() => navigate("/admin/customers")}
            >
              Manage Customers
            </Button>
            {/* Add future tools here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
