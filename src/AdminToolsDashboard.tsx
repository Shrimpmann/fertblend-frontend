import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminToolsDashboard({ onSelect }: { onSelect: (panel: string) => void }) {
  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardContent className="p-8 flex flex-col gap-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Admin Tools</h1>
          <Button className="w-full" onClick={() => onSelect("ingredients")}>
            Manage Ingredients
          </Button>
          <Button className="w-full" onClick={() => onSelect("chemicals")}>
            Manage Chemicals
          </Button>
          <Button className="w-full" onClick={() => onSelect("customers")}>
            Manage Customers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
