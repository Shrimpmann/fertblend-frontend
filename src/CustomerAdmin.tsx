// src/CustomerAdmin.tsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Customer = {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function CustomerAdmin({ token, onBack }: { token: string; onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    fetch("http://192.168.1.175:8000/customers", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setCustomers)
      .catch(() => setError("Failed to load customers"));
  }, [token]);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://192.168.1.175:8000/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error(await res.text());
      const added = await res.json();
      setCustomers((prev) => [...prev, added]);
      setNewCustomer({});
    } catch (err: any) {
      setError(err.message || "Create failed");
    }
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditing(customer);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://192.168.1.175:8000/customers/${editingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setCustomers((prev) => prev.map(c => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      setEditing({});
    } catch (err: any) {
      setError(err.message || "Update failed");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://192.168.1.175:8000/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setCustomers((prev) => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 self-start ml-4"
        onClick={onBack}
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-6">Customers</h1>
      <Card className="w-full max-w-2xl shadow-lg mb-10">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Input
                label="Name"
                placeholder="Customer Name"
                value={newCustomer.name || ""}
                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                required
                className="w-48"
                disabled={loading}
              />
              <Input
                label="Contact"
                placeholder="Contact"
                value={newCustomer.contact || ""}
                onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                className="w-40"
                disabled={loading}
              />
              <Input
                label="Email"
                placeholder="Email"
                value={newCustomer.email || ""}
                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-40"
                disabled={loading}
              />
              <Input
                label="Phone"
                placeholder="Phone"
                value={newCustomer.phone || ""}
                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-36"
                disabled={loading}
              />
              <Input
                label="Address"
                placeholder="Address"
                value={newCustomer.address || ""}
                onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="w-60"
                disabled={loading}
              />
              <Button type="submit" className="h-12" disabled={loading}>
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="w-full max-w-3xl">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <table className="w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-green-800 text-white">
              <th className="p-2">Name</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Address</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer =>
              editingId === customer.id ? (
                <tr key={customer.id} className="bg-yellow-50">
                  <td className="p-2">
                    <Input
                      value={editing.name || ""}
                      onChange={e => setEditing({ ...editing, name: e.target.value })}
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={editing.contact || ""}
                      onChange={e => setEditing({ ...editing, contact: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={editing.email || ""}
                      onChange={e => setEditing({ ...editing, email: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={editing.phone || ""}
                      onChange={e => setEditing({ ...editing, phone: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={editing.address || ""}
                      onChange={e => setEditing({ ...editing, address: e.target.value })}
                    />
                  </td>
                  <td className="p-2 space-x-1">
                    <Button size="sm" type="button" onClick={handleUpdate} disabled={loading}>Save</Button>
                    <Button size="sm" type="button" variant="secondary" onClick={() => setEditingId(null)} disabled={loading}>Cancel</Button>
                  </td>
                </tr>
              ) : (
                <tr key={customer.id} className="border-b">
                  <td className="p-2">{customer.name}</td>
                  <td className="p-2">{customer.contact}</td>
                  <td className="p-2">{customer.email}</td>
                  <td className="p-2">{customer.phone}</td>
                  <td className="p-2">{customer.address}</td>
                  <td className="p-2 space-x-1">
                    <Button size="sm" type="button" onClick={() => handleEdit(customer)} disabled={loading}>Edit</Button>
                    <Button size="sm" type="button" variant="destructive" onClick={() => handleDelete(customer.id)} disabled={loading}>Delete</Button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
