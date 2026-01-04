'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, CreditCard, MessageSquare, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Notification {
  id: string;
  type: 'subscription_expiry' | 'plan_expired' | 'payment_reminder' | 'general' | 'admin_message';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  daysRemaining?: number;
  from?: string;
}

interface NotificationIconProps {
  restaurantId: string;
  notifications: Notification[];
  onNotificationRead?: (notificationId: string) => void;
  onNotificationDelete?: (notificationId: string) => void;
  onUpgradeClick?: () => void;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  restaurantId,
  notifications = [],
  onNotificationRead,
  onNotificationDelete,
  onUpgradeClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationRead && !notification.read) {
      onNotificationRead(notification.id);
    }
    
    if (notification.type === 'subscription_expiry' || notification.type === 'plan_expired' || notification.type === 'payment_reminder') {
      if (onUpgradeClick) {
        onUpgradeClick();
      }
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    console.log('Delete button clicked for notification:', notificationId);
    
    if (confirm('Are you sure you want to delete this notification?')) {
      if (onNotificationDelete) {
        console.log('Calling delete handler...');
        onNotificationDelete(notificationId);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'subscription_expiry':
      case 'plan_expired':
      case 'payment_reminder':
        return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'admin_message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'subscription_expiry':
      case 'payment_reminder':
        return 'bg-orange-500';
      case 'plan_expired':
        return 'bg-red-500';
      case 'admin_message':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium min-w-[1.25rem]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {unreadCount} new
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <div className={`h-2 w-2 rounded-full ${getNotificationBadgeColor(notification.type)}`} />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                              title="Delete notification"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          
                        </div>
                        {notification.daysRemaining !== undefined && (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={notification.daysRemaining <= 2 ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {notification.daysRemaining === 0 
                                ? 'Expires today'
                                : `${notification.daysRemaining} days left`
                              }
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationIcon;