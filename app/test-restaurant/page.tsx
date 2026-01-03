// app/test-restaurant/page.tsx
"use client";

import React, { useState } from 'react';
import RestaurantInitializer from '@/components/admin/RestaurantInitializer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function TestRestaurantPage() {
  const [createdRestaurants, setCreatedRestaurants] = useState<string[]>([]);

  const handleRestaurantCreated = (restaurantId: string) => {
    setCreatedRestaurants(prev => [...prev, restaurantId]);
  };

  const openRestaurant = (restaurantId: string) => {
    window.open(`/RESTAURANT/${restaurantId}/admin/admindash`, '_blank');
  };

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Multi-Tenant Restaurant System</h1>
          <p className="text-muted-foreground">
            Test the multi-tenant functionality by creating new restaurants with completely isolated data
          </p>
        </div>

        <RestaurantInitializer onRestaurantCreated={handleRestaurantCreated} />

        {createdRestaurants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {createdRestaurants.map((restaurantId, index) => (
                  <div 
                    key={restaurantId} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Restaurant #{index + 1}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        ID: {restaurantId}
                      </p>
                    </div>
                    <Button
                      onClick={() => openRestaurant(restaurantId)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      Open Dashboard <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2">Testing Multi-Tenant Isolation</h3>
                <ul className="text-sm space-y-1">
                  <li>• Each restaurant has its own isolated database collections</li>
                  <li>• Data is stored under: <code>restaurants/{'{restaurantId}'}/{'{'} foods | staff | orders | tables {'}'}</code></li>
                  <li>• Each restaurant starts completely empty - admin adds all data</li>
                  <li>• Food, staff, tables, orders, and settings are completely separate</li>
                  <li>• No shared or static data between restaurants</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Database Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`restaurants/
├── {restaurantId1}/
│   ├── Restaurant document (name, address, settings, theme, etc.)
│   ├── foods/ (empty until admin adds items)
│   ├── staff/ (empty until admin adds staff)
│   ├── tables/ (empty until admin adds tables)
│   └── orders/ (empty until customers place orders)
├── {restaurantId2}/
│   ├── Restaurant document
│   ├── foods/ (isolated - different from restaurantId1)
│   ├── staff/ (isolated - different from restaurantId1)
│   ├── tables/ (isolated - different from restaurantId1)
│   └── orders/ (isolated - different from restaurantId1)
└── ...`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}