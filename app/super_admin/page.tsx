"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Plus, Trash2, Pencil } from "lucide-react";

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", address: "", owner: "" });

  const [editing, setEditing] = useState<any>(null);

  // Fetch Restaurants (Real-time)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setRestaurants(list);
    });
    return () => unsub();
  }, []);

  // Add Restaurant
  const addRestaurant = async () => {
    if (!newRestaurant.name.trim()) return;

    await addDoc(collection(db, "restaurants"), {
      name: newRestaurant.name,
      address: newRestaurant.address,
      owner: newRestaurant.owner,
      createdAt: new Date(),
    });

    setNewRestaurant({ name: "", address: "", owner: "" });
  };

  // Delete Restaurant
  const deleteRestaurant = async (id: string) => {
    if (!confirm("Delete this restaurant?")) return;
    await deleteDoc(doc(db, "restaurants", id));
  };

  // Update Restaurant
  const updateRestaurant = async () => {
    await updateDoc(doc(db, "restaurants", editing.id), {
      name: editing.name,
      address: editing.address,
      owner: editing.owner,
    });
    setEditing(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Super Admin Dashboard
          </CardTitle>
          <p className="text-gray-500">Manage all restaurants from one place.</p>
        </CardHeader>
      </Card>

      {/* Add Restaurant Button & Dialog */}
      <div className="flex justify-end mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={18} /> Add Restaurant
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Restaurant</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <Input
                placeholder="Restaurant Name"
                value={newRestaurant.name}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, name: e.target.value })
                }
              />
              <Input
                placeholder="Address"
                value={newRestaurant.address}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, address: e.target.value })
                }
              />
              <Input
                placeholder="Owner Name"
                value={newRestaurant.owner}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, owner: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={addRestaurant} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Restaurants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Restaurants List</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Restaurent.ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {restaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No restaurants found
                  </TableCell>
                </TableRow>
              ) : (
                restaurants.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.name}</TableCell>
                     <TableCell className="font-medium">{res.id}</TableCell>
                    <TableCell>{res.address}</TableCell>
                    <TableCell>{res.owner}</TableCell>

                    {/* ACTIONS */}
                    <TableCell className="flex gap-3">

                      {/* Edit Button (Dialog) */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => setEditing(res)}
                          >
                            <Pencil size={16} />
                          </Button>
                        </DialogTrigger>

                        {editing?.id === res.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Restaurant</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                              <Input
                                placeholder="Name"
                                value={editing.name}
                                onChange={(e) =>
                                  setEditing({ ...editing, name: e.target.value })
                                }
                              />
                              <Input
                                placeholder="Address"
                                value={editing.address}
                                onChange={(e) =>
                                  setEditing({ ...editing, address: e.target.value })
                                }
                              />
                              <Input
                                placeholder="Owner"
                                value={editing.owner}
                                onChange={(e) =>
                                  setEditing({ ...editing, owner: e.target.value })
                                }
                              />
                            </div>

                            <DialogFooter>
                              <Button className="bg-blue-600" onClick={updateRestaurant}>
                                Update
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteRestaurant(res.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                      </Button>

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
