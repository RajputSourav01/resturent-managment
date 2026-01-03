// lib/notification-service.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';

export interface Notification {
  id?: string;
  restaurantId: string;
  type: 'subscription_expiry' | 'plan_expired' | 'payment_reminder' | 'general' | 'admin_message';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  daysRemaining?: number;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'normal';
  from?: string;
}

class NotificationService {
  private getNotificationsPath(restaurantId: string): string {
    return `restaurants/${restaurantId}/notifications`;
  }

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    try {
      const notificationDoc = {
        ...notification,
        createdAt: Timestamp.now(),
        read: false
      };

      const docRef = await addDoc(
        collection(db, this.getNotificationsPath(notification.restaurantId)), 
        notificationDoc
      );
      
      console.log(`Notification created for restaurant ${notification.restaurantId}: ${notification.title}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get all notifications for a restaurant
  async getNotifications(restaurantId: string): Promise<Notification[]> {
    try {
      console.log(`Fetching notifications for restaurant: ${restaurantId}`);
      console.log(`Notifications path: ${this.getNotificationsPath(restaurantId)}`);
      
      const q = query(
        collection(db, this.getNotificationsPath(restaurantId)),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.docs.length} notifications`);
      snapshot.docs.forEach(doc => {
        console.log(`Notification ID: ${doc.id}`, doc.data());
      });
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(restaurantId: string, notificationId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.getNotificationsPath(restaurantId), notificationId);
      await updateDoc(docRef, {
        read: true
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(restaurantId: string, notificationId: string): Promise<boolean> {
    try {
      const notificationPath = this.getNotificationsPath(restaurantId);
      console.log(`Deleting notification at path: ${notificationPath}/${notificationId}`);
      
      const docRef = doc(db, notificationPath, notificationId);
      await deleteDoc(docRef);
      
      console.log(`✅ Notification ${notificationId} deleted successfully from restaurant ${restaurantId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return false;
    }
  }

  // Check subscription status and create notifications
  async checkAndCreateSubscriptionNotifications(restaurantId: string, restaurantData: any): Promise<void> {
    try {
      const plan = restaurantData.plan;
      
      if (!plan?.purchasedAt) {
        // No active plan - create notification for expired/no plan
        const existingNotifications = await this.getNotifications(restaurantId);
        const hasRecentNoPlanNotification = existingNotifications.some(
          n => n.type === 'plan_expired' && 
          Date.now() - n.createdAt.toMillis() < 24 * 60 * 60 * 1000 // Within last 24 hours
        );

        if (!hasRecentNoPlanNotification) {
          await this.createNotification({
            restaurantId,
            type: 'plan_expired',
            title: 'No Active Plan',
            message: 'Your restaurant does not have an active subscription plan. Please upgrade to continue using our services.',
            priority: 'urgent',
            actionUrl: `/RESTAURANT/${restaurantId}/admin/upgrade`
          });
        }
        return;
      }

      const purchaseDate = plan.purchasedAt.toDate();
      const now = new Date();
      const daysInMonth = 30; // Assuming monthly plans are 30 days
      const expiryDate = new Date(purchaseDate.getTime() + (daysInMonth * 24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get existing notifications to avoid duplicates
      const existingNotifications = await this.getNotifications(restaurantId);
      const recentNotifications = existingNotifications.filter(
        n => (n.type === 'subscription_expiry' || n.type === 'plan_expired') &&
        Date.now() - n.createdAt.toMillis() < 24 * 60 * 60 * 1000 // Within last 24 hours
      );

      // Plan expired
      if (daysRemaining <= 0 && recentNotifications.length === 0) {
        await this.createNotification({
          restaurantId,
          type: 'plan_expired',
          title: 'Plan Expired',
          message: `Your ${plan.name} plan has expired. Please upgrade immediately to avoid service interruption.`,
          priority: 'urgent',
          daysRemaining: 0,
          actionUrl: `/RESTAURANT/${restaurantId}/admin/upgrade`
        });
      }
      // Plan expiring soon (2 days or less)
      else if (daysRemaining <= 2 && daysRemaining > 0 && recentNotifications.length === 0) {
        await this.createNotification({
          restaurantId,
          type: 'subscription_expiry',
          title: 'Plan Expiring Soon',
          message: `Your ${plan.name} plan expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Please upgrade to continue your service.`,
          priority: daysRemaining === 1 ? 'urgent' : 'high',
          daysRemaining,
          actionUrl: `/RESTAURANT/${restaurantId}/admin/upgrade`
        });
      }
    } catch (error) {
      console.error('Error checking subscription notifications:', error);
    }
  }

  // Batch check all restaurants for expiring subscriptions
  async checkAllRestaurantsSubscriptions(): Promise<void> {
    try {
      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      
      for (const restaurantDoc of restaurantsSnapshot.docs) {
        const restaurantData = restaurantDoc.data();
        if (restaurantData.isActive !== false) { // Only check active restaurants
          await this.checkAndCreateSubscriptionNotifications(restaurantDoc.id, restaurantData);
        }
      }
      
      console.log(`Checked subscriptions for ${restaurantsSnapshot.size} restaurants`);
    } catch (error) {
      console.error('Error checking all restaurant subscriptions:', error);
    }
  }

  // Create general notification for a restaurant
  async createGeneralNotification(
    restaurantId: string, 
    title: string, 
    message: string, 
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<string> {
    return this.createNotification({
      restaurantId,
      type: 'general',
      title,
      message,
      priority
    });
  }
}

export default new NotificationService();