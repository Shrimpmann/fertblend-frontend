import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminToolsDashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <h1 className="text-3xl font-bold mb-8">Admin Tools</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Ingredients</h2>
            <p className="text-gray-600 text-sm">Manage fertilizer ingredients.</p>
            <Button onClick={() => onNavigate("ingredients")}>Open</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Chemicals</h2>
            <p className="text-gray-600 text-sm">Manage chemical additives.</p>
            <Button onClick={() => onNavigate("chemicals")}>Open</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Customers</h2>
            <p className="text-gray-600 text-sm">Manage customer records.</p>
            <Button onClick={() => onNavigate("customers")}>Open</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <p className="text-gray-600 text-sm">Add, remove, and edit user accounts.</p>
            <Button onClick={() => onNavigate("users")}>Open</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
