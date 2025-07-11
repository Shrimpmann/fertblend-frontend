import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Customer = {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export default function CustomerAdmin({ token }: { token: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({});
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch("http://192.168.1.175:8000/customers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => setError("Failed to load customers"))
      .finally(() => setLoading(false));
  }, [token]);

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `http://192.168.1.175:8000/customers/${editingId}`
        : "http://192.168.1.175:8000/customers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact || "",
          email: form.email || "",
          phone: form.phone || "",
          address: form.address || "",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await fetch("http://192.168.1.175:8000/customers", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      setCustomers(updated);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save customer");
    }
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      contact: customer.contact,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://192.168.1.175:8000/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setCustomers(customers.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted pt-10">
      {/* CONSISTENT BACK BUTTON: */}
      <Button
        onClick={() => navigate("/admin")}
        className="mb-6 self-start ml-4"
        variant="secondary"
      >
        &larr; Back to Admin Tools
      </Button>
      <h1 className="text-3xl font-bold mb-6">Customers Management</h1>
      <Card className="w-full max-w-3xl shadow-lg mb-10">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="name">Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Customer Name"
                  value={form.name || ""}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="contact">Contact</label>
                <Input
                  id="contact"
                  name="contact"
                  placeholder="Contact Name"
                  value={form.contact || ""}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="email">Email</label>
                <Input
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={form.email || ""}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-56"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="phone">Phone</label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold" htmlFor="address">Address</label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Address"
                  value={form.address || ""}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-80"
                />
              </div>
            </div>
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {editingId ? "Update Customer" : "Add Customer"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="w-full max-w-3xl shadow-lg">
        <CardContent className="p-8 space-y-2">
          <h2 className="text-xl font-bold mb-2">Customer List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">Name</th>
                  <th className="py-2 px-3 text-left">Contact</th>
                  <th className="py-2 px-3 text-left">Email</th>
                  <th className="py-2 px-3 text-left">Phone</th>
                  <th className="py-2 px-3 text-left">Address</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 px-3">{i.name}</td>
                    <td className="py-2 px-3">{i.contact}</td>
                    <td className="py-2 px-3">{i.email}</td>
                    <td className="py-2 px-3">{i.phone}</td>
                    <td className="py-2 px-3">{i.address}</td>
                    <td className="py-2 px-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleEdit(i)}
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleDelete(i.id)}
                        variant="outline"
                        className="text-red-600 border-red-600"
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && (
              <div className="text-gray-500 text-center py-4">No customers found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
