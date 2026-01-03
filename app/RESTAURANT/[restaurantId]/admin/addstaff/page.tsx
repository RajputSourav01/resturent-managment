// components/admin/AddStaffForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useParams } from 'next/navigation';

export default function AddStaffForm() {
  // ⛳ Get restaurantId from URL → /restaurant/[restaurantId]/admin/staff
  const { restaurantId }: any = useParams();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);



  // ----------------------------------------------------
  // 🔥 FETCH STAFF (Isolated Per Restaurant)
  // ----------------------------------------------------
  const fetchStaff = async () => {
    if (!restaurantId) return;

    console.log("Fetching staff for restaurant:", restaurantId);
    const ref = collection(db, "restaurants", restaurantId, "staff");
    const snapshot = await getDocs(ref);

    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    console.log("Staff list fetched:", list);
    setStaffList(list);
  };

  useEffect(() => {
    fetchStaff();
  }, [restaurantId]);

  // ----------------------------------------------------
  // 🔥 Image Preview
  // ----------------------------------------------------
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  // ----------------------------------------------------
  // 🔥 ADD STAFF (API Route OR Firestore Direct)
  // ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!restaurantId) {
      setMessage("Restaurant ID missing");
      return;
    }

    if (!fullName.trim()) {
      setMessage("❌ Full Name is required");
      return;
    }

    if (!address.trim()) {
      setMessage("❌ Address is required");
      return;
    }

    if (!mobile.trim()) {
      setMessage("❌ Mobile number is required");
      return;
    }

    if (!aadhaar.trim()) {
      setMessage("❌ Aadhaar number is required");
      return;
    }

    if (!designation.trim()) {
      setMessage("❌ Designation is required");
      return;
    }

    if (!imageFile && !editingId) {
      setMessage("❌ Staff image is required");
      return;
    }

    // If editing, update existing staff
    if (editingId) {
      try {
        setLoading(true);
        const ref = doc(db, "restaurants", restaurantId, "staff", editingId);
        
        const updateData: any = {
          fullName,
          address,
          mobile,
          aadhaar,
          designation,
          updatedAt: new Date(),
        };

        // Only update password if provided
        if (password.trim()) {
          updateData.password = password;
        }

        // Only update image if new file selected
        if (imageFile) {
          // You can add image upload logic here if needed
          // For now, we'll keep the existing imageUrl
        }

        await setDoc(ref, updateData, { merge: true });
        
        setMessage("✅ Staff updated successfully");
        // Clear form immediately
        setFullName('');
        setAddress('');
        setMobile('');
        setAadhaar('');
        setDesignation('');
        setPassword('');
        setImageFile(null);
        setPreview(null);
        setEditingId(null);
        fetchStaff();
        
        // Clear message after delay
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage("❌ Failed to update staff");
        console.error("Update failed:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Add new staff
    if (!password.trim()) {
      setMessage("❌ Password is required for new staff");
      return;
    }

    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("fullName", fullName);
    formData.append("address", address);
    formData.append("mobile", mobile);
    formData.append("aadhaar", aadhaar);
    formData.append("designation", designation);
    formData.append("password", password);
    if (imageFile) formData.append("image", imageFile);

    try {
      setLoading(true);

      const res = await fetch(`/RESTAURANT/${restaurantId}/api/admin/add-staff`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || "Upload failed");
      } else {
        setMessage("✅ Staff added successfully");
        // Clear form immediately
        setFullName('');
        setAddress('');
        setMobile('');
        setAadhaar('');
        setDesignation('');
        setPassword('');
        setImageFile(null);
        setPreview(null);
        setEditingId(null);
        fetchStaff();
        
        // Clear message after delay
        setTimeout(() => setMessage(null), 3000);
      }

    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setAddress('');
    setMobile('');
    setAadhaar('');
    setDesignation('');
    setPassword('');
    setImageFile(null);
    setPreview(null);
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  // ----------------------------------------------------
  // 🔥 EDIT STAFF - Load data into main form
  // ----------------------------------------------------
  const startEdit = (staff: any) => {
    setEditingId(staff.id);
    setFullName(staff.fullName || '');
    setAddress(staff.address || '');
    setMobile(staff.mobile || '');
    setAadhaar(staff.aadhaar || '');
    setDesignation(staff.designation || '');
    setPassword(''); // Don't prefill password for security
    setPreview(staff.imageUrl || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // ----------------------------------------------------
  // 🔥 DELETE STAFF
  // ----------------------------------------------------
  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff?")) return;

    const ref = doc(db, "restaurants", restaurantId, "staff", id);
    await deleteDoc(ref);
    fetchStaff();
  };

  const filteredStaff = staffList.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        Add Staff — Restaurant: {restaurantId}
      </h2>

      {/* ADD/EDIT STAFF FORM */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
        </h3>
        
        <form onSubmit={handleSubmit} key={editingId || 'new'}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name *"
          className="border p-2 w-full mb-3"
          required
        />

        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Mobile Number *"
          className="border p-2 w-full mb-3"
          required
        />

        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address *"
          className="border p-2 w-full mb-3"
          required
        />

        <input
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
          placeholder="Aadhaar Number *"
          className="border p-2 w-full mb-3"
          required
        />

        <input
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="Designation *"
          className="border p-2 w-full mb-3"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={editingId ? "Password (leave blank to keep current)" : "Password *"}
          type="password"
          className="border p-2 w-full mb-3"
          required={!editingId}
        />

        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="border p-2 w-full mb-3"
          required={!editingId}
        />
        {!editingId && (
          <p className="text-xs text-gray-600 mb-3">* Staff image is required for new staff</p>
        )}

        {preview && <img src={preview} className="h-24 rounded mb-3" />}

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : (editingId ? "Update Staff" : "Add Staff")}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>

        {message && <p className="mt-2">{message}</p>}
        </form>
      </div>

      {/* STAFF LIST */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Staff List</h3>

        {filteredStaff.map((staff) => (
          <div key={staff.id} className="border p-3 rounded mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              {/* Staff Image - Mobile Responsive */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {staff.imageUrl ? (
                  <img 
                    src={staff.imageUrl} 
                    alt={staff.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    👤
                  </div>
                )}
              </div>
              
              {/* Staff Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base truncate">{staff.fullName}</p>
                <p className="text-xs sm:text-sm text-gray-600">{staff.mobile}</p>
                <p className="text-xs sm:text-sm text-gray-600">{staff.designation}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 self-start sm:self-center">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => startEdit(staff)}
              >
                Edit
              </button>

              <button
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => deleteStaff(staff.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
