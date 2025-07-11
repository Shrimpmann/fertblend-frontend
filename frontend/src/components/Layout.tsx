// src/components/Layout.tsx
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-green-700 text-white px-6 py-4 shadow-md">
        <h1 className="text-xl font-bold">FertBlend Dashboard</h1>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
      <footer className="bg-gray-100 text-sm text-center py-4 text-gray-500">
        &copy; {new Date().getFullYear()} FertBlend. All rights reserved.
      </footer>
    </div>
  );
}
