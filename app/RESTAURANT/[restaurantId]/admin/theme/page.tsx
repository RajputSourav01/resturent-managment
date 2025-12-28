"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Theme({ restaurantId }: { restaurantId?: string }) {
  // Form state
  const [restaurantName, setRestaurantName] = useState("");
  const [colorPicker, setColorPicker] = useState("#000000");
  const [themeImgUrl, setThemeImgUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [seasonalVideoUrl, setSeasonalVideoUrl] = useState("");

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTheme, setUploadingTheme] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // ⭐ ADDED: LIST STATES
  const [themeList, setThemeList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadExistingData();
    loadThemeList();   // ⭐ ADDED
  }, []);

  const loadExistingData = async () => {
    try {
      const docRef = doc(db, "restaurants", restaurantId, "themeSettings", "globalTheme");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setRestaurantName(data.restaurantName || "");
        setColorPicker(data.colorPicker || "#000000");
        setThemeImgUrl(data.themeImgUrl || "");
        setLogoUrl(data.logoUrl || "");
        setSeasonalVideoUrl(data.seasonalVideoUrl || "");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // ⭐ ADDED: Load All Theme Items
  const loadThemeList = async () => {
    const snap = await getDocs(collection(db, "restaurants", restaurantId, "themeSettings"));
    const list: any[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setThemeList(list);
  };

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Handle theme image upload
  const handleThemeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTheme(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setThemeImgUrl(url);
    }
    setUploadingTheme(false);
    e.target.value = ""; 
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setLogoUrl(url);
    }
    setUploadingLogo(false);
    e.target.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setSeasonalVideoUrl(url);
    }
    setUploadingVideo(false);
    e.target.value = "";
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!restaurantName.trim()) {
      alert("Please enter restaurant name");
      return;
    }

    setIsSaving(true);

    try {
      const docRef = doc(db, "restaurants", restaurantId, "themeSettings", editingId ?? Date.now().toString()); // ⭐ CHANGED FOR MULTIPLE ITEMS
      await setDoc(docRef, {
        restaurantName: restaurantName.trim(),
        colorPicker,
        themeImgUrl,
        logoUrl,
        seasonalVideoUrl,
        updatedAt: new Date().toISOString(),
      });

      alert(editingId ? "Updated Successfully!" : "Saved Successfully!");

      setEditingId(null);
      loadThemeList(); // ⭐ ADDED REFRESH LIST
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ⭐ ADDED: Delete
  const deleteTheme = async (id: string) => {
    if (!confirm("Delete this theme?")) return;
    await deleteDoc(doc(db, "restaurants", restaurantId, "themeSettings", id));
    loadThemeList();
  };

  // ⭐ ADDED: Edit
  const editTheme = (item: any) => {
    setEditingId(item.id);
    setRestaurantName(item.restaurantName);
    setColorPicker(item.colorPicker);
    setThemeImgUrl(item.themeImgUrl);
    setLogoUrl(item.logoUrl);
    setSeasonalVideoUrl(item.seasonalVideoUrl);
  };

  const isAnyUploading = uploadingTheme || uploadingLogo || uploadingVideo;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Restaurant Theme Settings
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* EXISTING FORM UNTOUCHED */}
              {/* ------------------------- */}
              {/* Restaurant Name */}
              <div>
                <Label htmlFor="restaurantName">Restaurant Name *</Label>
                <Input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Enter restaurant name"
                  required
                  className="mt-2"
                />
              </div>

              {/* Color Picker */}
              <div>
                <Label htmlFor="colorPicker">Theme Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="colorPicker"
                    type="color"
                    value={colorPicker}
                    onChange={(e) => setColorPicker(e.target.value)}
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-gray-600">{colorPicker}</span>
                </div>
              </div>

              {/* Theme Image */}
              <div>
                <Label htmlFor="themeImage">Theme Background Image</Label>
                <Input
                  id="themeImage"
                  type="file"
                  accept="image/*"
                  onChange={handleThemeImageUpload}
                  disabled={uploadingTheme}
                  className="mt-2"
                />
                {uploadingTheme && (
                  <p className="text-blue-600 text-sm mt-2">Uploading...</p>
                )}
                {themeImgUrl && (
                  <div className="mt-3">
                    <img
                      src={themeImgUrl}
                      alt="Theme"
                      className="w-full h-40 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setThemeImgUrl("")}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Logo */}
              <div>
                <Label htmlFor="logo">Restaurant Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="mt-2"
                />
                {uploadingLogo && (
                  <p className="text-blue-600 text-sm mt-2">Uploading...</p>
                )}
                {logoUrl && (
                  <div className="mt-3">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoUrl("")}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Video */}
              <div>
                <Label htmlFor="video">Seasonal Video</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="mt-2"
                />
                {uploadingVideo && (
                  <p className="text-blue-600 text-sm mt-2">Uploading...</p>
                )}
                {seasonalVideoUrl && (
                  <div className="mt-3">
                    <video
                      src={seasonalVideoUrl}
                      controls
                      className="w-full max-h-60 rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSeasonalVideoUrl("")}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSaving || isAnyUploading}
                className="w-full py-3"
              >
                {isSaving
                  ? "Saving..."
                  : isAnyUploading
                  ? "Uploading..."
                  : editingId
                  ? "Update Theme"
                  : "Save Theme Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ⭐ ADDED: LIST BELOW */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Saved Themes</h2>

          {themeList.map((item) => (
            <Card key={item.id} className="mb-4">
              <CardContent className="p-4">
                <p><b>Name:</b> {item.restaurantName}</p>
                <p><b>Color:</b> {item.colorPicker}</p>

                {item.themeImgUrl && (
                  <img className="w-full h-32 rounded mt-2 object-cover" src={item.themeImgUrl} />
                )}

                <div className="flex gap-3 mt-4">
                  <Button size="sm" onClick={() => editTheme(item)}>
                    Edit
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => deleteTheme(item.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
