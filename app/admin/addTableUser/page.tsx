'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { User, Lock, Hash, Pencil, Trash2 } from 'lucide-react';

type TableUser = {
  id: string;
  username: string;
  tableNo: string;
  password: string;
};

export default function AddTablePage() {
  const [formData, setFormData] = useState({
    email: '',
    tableNo: '',
    password: '',
  });

  const [tables, setTables] = useState<TableUser[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Load table users
  const loadTables = async () => {
    const snap = await getDocs(collection(db, 'tables'));
    const data: TableUser[] = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<TableUser, 'id'>),
    }));
    setTables(data);
  };

  useEffect(() => {
    loadTables();
  }, []);

  // ✅ Create / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.tableNo || !formData.password) {
      alert('All fields are required');
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        // ✅ Update existing
        await updateDoc(doc(db, 'tables', editId), {
          username: formData.email,
          tableNo: formData.tableNo,
          password: formData.password,
        });
        setSuccess('Table updated ✅');
      } else {
        // ✅ Create new
        await addDoc(collection(db, 'tables'), {
          username: formData.email,
          tableNo: formData.tableNo,
          password: formData.password,
          createdAt: serverTimestamp(),
        });
        setSuccess('Table added ✅');
      }

      setFormData({ email: '', tableNo: '', password: '' });
      setEditId(null);
      loadTables();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit handler
  const handleEdit = (item: TableUser) => {
    setEditId(item.id);
    setFormData({
      email: item.username,
      tableNo: item.tableNo,
      password: item.password,
    });
  };

  // ✅ Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await deleteDoc(doc(db, 'tables', id));
    loadTables();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10 gap-10">

      {/* ✅ Form */}
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Add / Edit Table Login
        </h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="email"
              placeholder="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="tableNo"
              placeholder="Table No."
              value={formData.tableNo}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading
              ? 'Saving...'
              : editId
              ? 'Update Table'
              : 'Create Table Login'}
          </button>
        </form>
      </div>

      {/* ✅ Excel-like Table List */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Table No</th>
              <th className="p-3 border">Password</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-3 border">{item.username}</td>
                <td className="p-3 border">{item.tableNo}</td>
                <td className="p-3 border">{item.password}</td>
                <td className="p-3 border text-center space-x-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={18} className="inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} className="inline" />
                  </button>
                </td>
              </tr>
            ))}

            {tables.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-500 p-6"
                >
                  No tables found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
