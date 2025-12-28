// components/admin/RestaurantInitializer.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface RestaurantInitializerProps {
  onRestaurantCreated?: (restaurantId: string) => void;
}

export default function RestaurantInitializer({ onRestaurantCreated }: RestaurantInitializerProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create restaurant');
      }

      setMessage({ 
        type: 'success', 
        text: `Restaurant created successfully! ID: ${data.restaurantId}` 
      });
      setCreatedRestaurantId(data.restaurantId);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
      });

      if (onRestaurantCreated) {
        onRestaurantCreated(data.restaurantId);
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create restaurant' 
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.address && formData.phone && formData.email;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Initialize New Restaurant
        </CardTitle>
        <p className="text-muted-foreground text-center">
          Create a new restaurant (admin will add menu items and staff)
        </p>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {createdRestaurantId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">Restaurant Created Successfully!</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Your restaurant has been initialized as an empty tenant:
            </p>
            <ul className="text-sm space-y-1 mb-3">
              <li>• Ready to add food items via admin panel</li>
              <li>• Ready to add staff members via admin panel</li>
              <li>• Ready to add tables via admin panel</li>
              <li>• Default theme and settings configured</li>
            </ul>
            <p className="text-sm font-medium">
              Restaurant URL: <code className="bg-white px-2 py-1 rounded">
                /RESTAURANT/{createdRestaurantId}/admin/admindash
              </code>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Restaurant Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter restaurant name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Restaurant Address *
            </label>
            <Textarea
              id="address"
              name="address"
              placeholder="Enter complete address"
              value={formData.address}
              onChange={handleInputChange}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description about your restaurant"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full"
          >
            {loading ? 'Creating Restaurant...' : 'Create Empty Restaurant'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}