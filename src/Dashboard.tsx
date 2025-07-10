import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard({ token, onNavigate }: { token: string; onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="flex gap-8">
        <Card className="w-72 hover:shadow-xl transition cursor-pointer" onClick={() => onNavigate("surgrolator")}>
          <CardContent className="p-8 flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">Surgrolator</div>
            <div className="mb-4 text-muted-foreground">Custom blend calculator</div>
            <Button>Open</Button>
          </CardContent>
        </Card>
        <Card className="w-72 hover:shadow-xl transition cursor-pointer" onClick={() => onNavigate("admin")}>
          <CardContent className="p-8 flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">Admin Tools</div>
            <div className="mb-4 text-muted-foreground">Ingredients, Chemicals, Customers</div>
            <Button>Open</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
