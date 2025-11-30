// components/admin/AddStaffForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

export default function AddStaffForm() {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [designation, setDesignation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ STAFF STATE
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editData, setEditData] = useState<any>({
    fullName: '',
    address: '',
    mobile: '',
    aadhaar: '',
    designation: '',
    imageUrl: '',
  });

  // ✅ FETCH STAFF
  const fetchStaff = async () => {
    const ref = collection(db, 'staff');
    const snapshot = await getDocs(ref);
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    setStaffList(list);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ IMAGE SELECT
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  // ✅ FORM SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !mobile.trim()) {
      setMessage('Name and Mobile are required');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('address', address);
    formData.append('mobile', mobile);
    formData.append('aadhaar', aadhaar);
    formData.append('designation', designation);
    if (imageFile) formData.append('image', imageFile);

    try {
      setLoading(true);
      const res = await fetch('/api/admin/add-staff', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || 'Upload failed');
      } else {
        setMessage('✅ Staff added successfully');
        setFullName('');
        setAddress('');
        setMobile('');
        setAadhaar('');
        setDesignation('');
        setImageFile(null);
        setPreview(null);
        fetchStaff();
      }
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ START EDIT
  const startEdit = (staff: any) => {
    setEditingId(staff.id);
    setEditData({ ...staff });
  };

  // ✅ SAVE UPDATE
  const saveUpdate = async (id: string) => {
    try {
      const ref = doc(db, 'staff', id);
      await updateDoc(ref, {
        fullName: editData.fullName,
        address: editData.address,
        mobile: editData.mobile,
        aadhaar: editData.aadhaar,
        designation: editData.designation,
        imageUrl: editData.imageUrl,
      });
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ DELETE
  const deleteStaff = async (id: string) => {
    if (!confirm('Delete this staff?')) return;
    const ref = doc(db, 'staff', id);
    await deleteDoc(ref);
    fetchStaff();
  };

  return (
    <AdminProtectedRoute>
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* ✅ ADD FORM */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Add Staff</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              placeholder="Full Name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              placeholder="Mobile No" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <textarea 
            placeholder="Address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            rows={3}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input 
              placeholder="Aadhaar No" 
              value={aadhaar} 
              onChange={(e) => setAadhaar(e.target.value)} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              placeholder="Designation" 
              value={designation} 
              onChange={(e) => setDesignation(e.target.value)} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={onFileChange} 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>

          {preview && (
            <div className="flex justify-center">
              <img src={preview} className="h-24 w-24 rounded-lg object-cover shadow-md" />
            </div>
          )}

          <button 
            disabled={loading} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Add Staff'}
          </button>

          {message && (
            <p className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>
      </div>

      {/* ✅ SEARCH & STAFF LIST */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-0">Staff List</h3>
          <div className="w-full sm:w-64">
            <input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ✅ STAFF LIST */}
        <div className="space-y-4">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No staff members found</p>
            </div>
          ) : (
            filteredStaff.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Staff Image and Basic Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {staff.imageUrl && (
                      <img
                        src={staff.imageUrl}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0"
                        alt={staff.fullName}
                      />
                    )}

                    {/* ✅ VIEW OR EDIT */}
                    {editingId === staff.id ? (
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                            value={editData.fullName} 
                            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} 
                            placeholder="Full Name"
                            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          />
                          <input 
                            value={editData.mobile} 
                            onChange={(e) => setEditData({ ...editData, mobile: e.target.value })} 
                            placeholder="Mobile"
                            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          />
                        </div>
                        <input 
                          value={editData.address} 
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })} 
                          placeholder="Address"
                          className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                            value={editData.aadhaar} 
                            onChange={(e) => setEditData({ ...editData, aadhaar: e.target.value })} 
                            placeholder="Aadhaar"
                            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          />
                          <input 
                            value={editData.designation} 
                            onChange={(e) => setEditData({ ...editData, designation: e.target.value })} 
                            placeholder="Designation"
                            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          />
                        </div>
                        <input 
                          value={editData.imageUrl || ''} 
                          placeholder="Image URL" 
                          onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })} 
                          className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900">{staff.fullName}</h4>
                        <p className="text-sm font-medium text-blue-600">{staff.designation}</p>
                        <p className="text-sm text-gray-600 mt-1">📱 {staff.mobile}</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {staff.address}</p>
                        {staff.aadhaar && (
                          <p className="text-xs text-gray-500 mt-1">🆔 {staff.aadhaar}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ✅ ACTIONS */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    {editingId === staff.id ? (
                      <>
                        <button 
                          onClick={() => saveUpdate(staff.id)} 
                          className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="flex-1 lg:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(staff)} 
                          className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteStaff(staff.id)} 
                          className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </AdminProtectedRoute>
  );
}
