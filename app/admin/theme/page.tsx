"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Theme() {
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

  // Load existing data from Firebase on component mount
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const docRef = doc(db, "themeSettings", "globalTheme");
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
    e.target.value = ""; // Clear input
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setLogoUrl(url);
    }
    setUploadingLogo(false);
    e.target.value = ""; // Clear input
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setSeasonalVideoUrl(url);
    }
    setUploadingVideo(false);
    e.target.value = ""; // Clear input
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
      const docRef = doc(db, "themeSettings", "globalTheme");
      await setDoc(docRef, {
        restaurantName: restaurantName.trim(),
        colorPicker,
        themeImgUrl,
        logoUrl,
        seasonalVideoUrl,
        updatedAt: new Date().toISOString()
      });

      alert("Theme settings saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving || isAnyUploading}
                className="w-full py-3"
              >
                {isSaving ? "Saving..." : isAnyUploading ? "Uploading..." : "Save Theme Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}