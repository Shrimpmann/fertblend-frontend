import { useState } from "react";
import Dashboard from "./Dashboard";
import SurgrolatorPage from "./SurgrolatorPage";
import AdminToolsPage from "./AdminToolsPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState<"dashboard" | "surgrolator" | "admin">("dashboard");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("http://192.168.1.175:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      if (!res.ok) {
        throw new Error("Invalid login");
      }
      const data = await res.json();
      setToken(data.access_token);
      setPage("dashboard");
    } catch {
      setLoginError("Login failed. Please check your credentials.");
    }
    setLoading(false);
  };

  if (!token) {
    // --- Login Page ---
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
                disabled={loading}
              />
              <Input
                label="Password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                required
                disabled={loading}
              />
              {loginError && <div className="text-red-600 text-center">{loginError}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Navigation ---
  if (page === "dashboard") {
    return <Dashboard token={token} onNavigate={setPage} />;
  }
  if (page === "surgrolator") {
    return <SurgrolatorPage token={token} onBack={() => setPage("dashboard")} />;
  }
  if (page === "admin") {
    return <AdminToolsPage token={token} onBack={() => setPage("dashboard")} />;
  }

  return null;
}
