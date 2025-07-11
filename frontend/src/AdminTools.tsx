// src/AdminTools.tsx
import { useState } from "react";
import IngredientsAdmin from "./IngredientsAdmin";

export default function AdminTools({
  token,
  onBack,
}: {
  token: string;
  onBack: () => void;
}) {
  const [page, setPage] = useState<"home" | "ingredients">("home");

  if (page === "ingredients") {
    return (
      <IngredientsAdmin
        token={token}
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 self-start ml-4"
        onClick={onBack}
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-8">Admin Tools</h1>
      <div className="flex flex-col gap-6 w-full max-w-md">
        <button
          className="bg-green-800 text-white px-6 py-3 rounded-lg shadow-lg text-lg hover:bg-green-900 transition"
          onClick={() => setPage("ingredients")}
        >
          Manage Ingredients
        </button>
        {/* In the future, add more buttons here for Chemicals, Customers, etc. */}
      </div>
    </div>
  );
}
