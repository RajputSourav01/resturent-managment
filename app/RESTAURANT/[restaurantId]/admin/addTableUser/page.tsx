'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import restaurantService, { Table } from '@/lib/restaurant-service';
import { Hash, Pencil, Trash2 } from 'lucide-react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TableUser = {
  id: string;
  username: string;
  tableNo: string;
};

export default function AddTablePage() {
  const { restaurantId } = useParams();   // ⭐ GET RESTAURANT ID FROM URL

  const [formData, setFormData] = useState({
    tableNo: '',
  });

  const [tables, setTables] = useState<TableUser[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [qrTableNo, setQrTableNo] = useState<string | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ⭐ LOAD TABLE USERS FOR THIS RESTAURANT
  const loadTables = async () => {
    if (!restaurantId) return;

    try {
      const tablesData = await restaurantService.getTables(restaurantId as string);
      const data: TableUser[] = tablesData.map((table) => ({
        id: table.id!,
        username: `Table ${table.number}`, // Convert table number to username format
        tableNo: table.number.toString(),
      }));
      setTables(data);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  useEffect(() => {
    loadTables();
  }, [restaurantId]);

  // ⭐ SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tableNo) {
      alert('Table number is required');
      return;
    }

    try {
      setLoading(true);

      // Check duplicate table number
      const existingTables = await restaurantService.getTables(restaurantId as string);
      const existing = existingTables.find((table) => 
        table.number.toString() === formData.tableNo && table.id !== editId
      );

      if (existing) {
        setSuccess("❌ Table number already exists!");
        setLoading(false);
        return;
      }

      if (editId) {
        await restaurantService.updateTable(restaurantId as string, editId, {
          number: parseInt(formData.tableNo),
          capacity: 4, // Default capacity
          isOccupied: false,
          isActive: true
        });
        setSuccess("Table updated ✅");
      } else {
        await restaurantService.createTable(restaurantId as string, {
          number: parseInt(formData.tableNo),
          capacity: 4, // Default capacity
          isOccupied: false,
          isActive: true
        });
        setSuccess("Table added ✅");
      }

      setFormData({ tableNo: '' });
      setEditId(null);
      loadTables();
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: TableUser) => {
    setEditId(item.id);
    setFormData({
      tableNo: item.tableNo,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table?")) return;

    try {
      await restaurantService.deleteTable(restaurantId as string, id);
      loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    }
  };

  // ⭐ OPEN QR
  const handleGenerateQR = (tableNo: string) => setQrTableNo(tableNo);

  // ⭐ DOWNLOAD QR
  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `table-${qrTableNo}-qr.png`;
    link.click();
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10 gap-10">

        {/* Form */}
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Add / Edit Table
          </h1>

          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                name="tableNo"
                placeholder="Table No."
                value={formData.tableNo}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {loading
                ? "Saving..."
                : editId
                ? "Update Table"
                : "Create Table"}
            </button>
          </form>
        </div>

        {/* Table List */}
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
              <tr>
                
                <th className="p-3 border">Table No</th>
                <th className="p-3 border text-center">Actions</th>
                <th className="p-3 border text-center">QR_CODE</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                 
                  <td className="p-3 border">{item.tableNo}</td>

                  <td className="p-3 border text-center space-x-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>

                  <td className="p-3 border text-center">
                    <button
                      onClick={() => handleGenerateQR(item.tableNo)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Generate QR
                    </button>
                  </td>
                </tr>
              ))}

              {tables.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 p-6">
                    No tables found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* QR Modal */}
        <Dialog open={!!qrTableNo} onOpenChange={() => setQrTableNo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code</DialogTitle>
            </DialogHeader>

            {qrTableNo && (
              <div className="flex flex-col items-center gap-4 py-6">
                <QRCodeCanvas
                  value={`${window.location.origin}/RESTAURANT/${restaurantId}/customerMenu?table=${qrTableNo}`}
                  size={240}
                  ref={qrRef}
                />

                <button
                  onClick={downloadQR}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Download QR
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AdminProtectedRoute>
  );
}
