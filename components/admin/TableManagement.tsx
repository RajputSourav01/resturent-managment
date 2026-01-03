"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, QrCode, Users, MapPin } from 'lucide-react';
import restaurantService, { Table } from '@/lib/restaurant-service';
import QRCode from 'qrcode';

interface TableManagementProps {
  restaurantId: string;
}

const TableManagement: React.FC<TableManagementProps> = ({ restaurantId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    location: '',
    isActive: true
  });

  useEffect(() => {
    loadTables();
  }, [restaurantId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesData = await restaurantService.getTables(restaurantId);
      setTables(tablesData);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (tableNumber: number) => {
    try {
      const menuUrl = `${window.location.origin}/RESTAURANT/${restaurantId}/customerMenu?table=${tableNumber}`;
      const qrCodeData = await QRCode.toDataURL(menuUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeData;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.capacity) return;

    try {
      setLoading(true);
      const qrCode = await generateQRCode(parseInt(formData.number));
      
      const tableData = {
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity),
        location: formData.location,
        isOccupied: false,
        isActive: formData.isActive,
        qrCode
      };

      if (editingTable) {
        await restaurantService.updateTable(restaurantId, editingTable.id!, tableData);
      } else {
        await restaurantService.createTable(restaurantId, tableData);
      }

      await loadTables();
      resetForm();
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      location: table.location || '',
      isActive: table.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (tableId: string) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        setLoading(true);
        await restaurantService.deleteTable(restaurantId, tableId);
        await loadTables();
      } catch (error) {
        console.error('Error deleting table:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleOccupancy = async (table: Table) => {
    try {
      await restaurantService.updateTable(restaurantId, table.id!, {
        isOccupied: !table.isOccupied
      });
      await loadTables();
    } catch (error) {
      console.error('Error updating table occupancy:', error);
    }
  };

  const downloadQRCode = (table: Table) => {
    if (!table.qrCode) return;
    
    const link = document.createElement('a');
    link.download = `table-${table.number}-qr.png`;
    link.href = table.qrCode;
    link.click();
  };

  const resetForm = () => {
    setFormData({ number: '', capacity: '', location: '', isActive: true });
    setEditingTable(null);
    setShowForm(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Table Management
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form */}
        {showForm && (
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Table Number *</Label>
                  <Input
                    id="number"
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="e.g., 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g., 4"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Near window, Patio"
                  />
                </div>
                <div className="col-span-2 flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingTable ? 'Update Table' : 'Add Table'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tables List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tables ({tables.length})</h3>
            <div className="text-sm text-muted-foreground">
              Occupied: {tables.filter(t => t.isOccupied).length} / {tables.length}
            </div>
          </div>

          {loading && !showForm ? (
            <div className="text-center py-8">Loading tables...</div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tables found. Add your first table to get started.
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <Card key={table.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">Table {table.number}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {table.capacity} seats
                          </div>
                          {table.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {table.location}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={table.isOccupied ? "destructive" : "default"}
                          className="cursor-pointer"
                          onClick={() => handleToggleOccupancy(table)}
                        >
                          {table.isOccupied ? 'Occupied' : 'Available'}
                        </Badge>
                      </div>

                      {/* QR Code Display */}
                      {table.qrCode && (
                        <div className="mb-3 flex justify-center">
                          <img
                            src={table.qrCode}
                            alt={`QR Code for Table ${table.number}`}
                            className="w-20 h-20 border rounded cursor-pointer"
                            onClick={() => downloadQRCode(table)}
                            title="Click to download QR code"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(table)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadQRCode(table)}
                          disabled={!table.qrCode}
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(table.id!)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableManagement;