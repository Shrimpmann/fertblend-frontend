import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Wrench, Tag } from "lucide-react";

export default function Dashboard({
  onSurgrolator,
  onAdminTools,
  onTagGenerator,
}: {
  onSurgrolator: () => void;
  onAdminTools: () => void;
  onTagGenerator?: () => void;
}) {
  return (
    <div className="flex flex-col items-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-8 text-green-900">Main Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Surgrolator */}
        <DashboardTile
          title="Surgrolator"
          description="Custom Fertilizer Blending Calculator"
          icon={<Calculator size={48} className="text-green-800" />}
          onClick={onSurgrolator}
        />
        {/* Tag Generator - placeholder, can add handler later */}
        <DashboardTile
          title="SurGro Tag Generator"
          description="Create product tags for fertilizer blends"
          icon={<Tag size={48} className="text-yellow-600" />}
          onClick={onTagGenerator ?? (() => alert("Coming soon!"))}
        />
        {/* Admin Tools */}
        <DashboardTile
          title="Admin Tools"
          description="Manage ingredients, chemicals, and customers"
          icon={<Wrench size={48} className="text-gray-700" />}
          onClick={onAdminTools}
        />
      </div>
    </div>
  );
}

function DashboardTile({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-green-200 rounded-2xl h-64 flex"
      onClick={onClick}
    >
      <CardContent className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-4">{icon}</div>
        <div className="text-2xl font-bold mb-2 text-center">{title}</div>
        <div className="text-gray-700 text-center text-sm">{description}</div>
      </CardContent>
    </Card>
  );
}
