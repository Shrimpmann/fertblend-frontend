import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import SurgrolatorPage from "./SurgrolatorPage";
import AdminToolsPage from "./AdminToolsPage";
import IngredientsAdmin from "./IngredientsAdmin";
import ChemicalsAdmin from "./ChemicalsAdmin";
import CustomerAdmin from "./CustomerAdmin";
import LoginPage from "./LoginPage";
import TagGeneratorPage from "./TagGeneratorPage";

function AppRoutes() {
  // Token (login state)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  // If not logged in, only show login
  if (!token) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-muted">
              <LoginPage onLogin={handleLogin} />
            </div>
          }
        />
      </Routes>
    );
  }

  // If logged in, show nav and all routes
  return (
    <>
      <div className="flex justify-between items-center px-6 py-3 bg-green-900 text-white shadow">
        <div
          className="text-xl font-bold cursor-pointer flex items-center gap-2"
          onClick={() => window.location.href = "/"}
        >
          Bulloch Fertilizer App
        </div>
        <div className="space-x-4">
          <button className="hover:underline" onClick={() => window.location.href = "/"}>Dashboard</button>
          <button className="hover:underline" onClick={() => window.location.href = "/admin"}>Admin Tools</button>
          <button className="hover:underline" onClick={handleLogout}>Log Out</button>
        </div>
      </div>
      <div className="py-8">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onSurgrolator={() => window.location.href = "/surgrolator"}
                onAdminTools={() => window.location.href = "/admin"}
                onTagGenerator={() => window.location.href = "/tag-generator"} // <-- This line enables the Tag Generator tile!
              />
            }
          />
          <Route
            path="/surgrolator"
            element={<SurgrolatorPage token={token} onBack={() => window.location.href = "/"} />}
          />
          <Route path="/admin" element={<AdminToolsPage />} />
          <Route path="/admin/ingredients" element={<IngredientsAdmin token={token} />} />
          <Route path="/admin/chemicals" element={<ChemicalsAdmin token={token} />} />
          <Route path="/admin/customers" element={<CustomerAdmin token={token} />} />
          <Route path="/tag-generator" element={<TagGeneratorPage token={token} />} />
          {/* If someone lands on an unknown page, send them home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
