import { lendingService } from './lendingService.js';

class ReminderService {
  constructor() {
    this.checkInterval = null;
    this.notificationPermission = 'default';
  }

  async init() {
    // Request notification permission
    await this.requestNotificationPermission();
    
    // Start checking for overdue items
    this.startOverdueCheck();
    
    // Check immediately on init
    await this.checkOverdueItems();
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    this.notificationPermission = 'denied';
    return false;
  }

  startOverdueCheck() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkOverdueItems();
    }, 5 * 60 * 1000);
  }

  stopOverdueCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkOverdueItems() {
    try {
      const overdueItems = await lendingService.getOverdueItems();
      
      if (overdueItems.length > 0) {
        // Get items that are newly overdue (within last hour)
        const recentlyOverdue = overdueItems.filter(item => {
          const overdueTime = new Date() - new Date(item.expectedReturnDate);
          return overdueTime < 60 * 60 * 1000; // Less than 1 hour overdue
        });

        if (recentlyOverdue.length > 0) {
          this.sendOverdueNotification(recentlyOverdue);
        }

        // Also send reminders for items overdue by more than 3 days
        const longOverdue = overdueItems.filter(item => item.daysOverdue >= 3);
        if (longOverdue.length > 0) {
          this.sendLongOverdueNotification(longOverdue);
        }
      }
    } catch (error) {
      console.error('Failed to check overdue items:', error);
    }
  }

  sendOverdueNotification(items) {
    if (this.notificationPermission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const itemCount = items.length;
    const title = `${itemCount} card${itemCount > 1 ? 's' : ''} overdue`;
    
    const body = items.slice(0, 3).map(item => 
      `${item.card?.name || 'Unknown card'} - ${item.borrowerName}`
    ).join('\n');

    try {
      new Notification(title, {
        body: itemCount > 3 ? `${body}\n...and ${itemCount - 3} more` : body,
        icon: '/pokemon-icon.png',
        tag: 'overdue-notification',
        requireInteraction: true
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  sendLongOverdueNotification(items) {
    if (this.notificationPermission !== 'granted') {
      return;
    }

    const itemCount = items.length;
    const title = `⚠️ ${itemCount} card${itemCount > 1 ? 's' : ''} long overdue`;
    
    const body = items.slice(0, 2).map(item => 
      `${item.card?.name || 'Unknown'} - ${item.daysOverdue} days overdue (${item.borrowerName})`
    ).join('\n');

    try {
      new Notification(title, {
        body: itemCount > 2 ? `${body}\n...and ${itemCount - 2} more` : body,
        icon: '/pokemon-icon.png',
        tag: 'long-overdue-notification',
        requireInteraction: true
      });
    } catch (error) {
      console.error('Failed to send long overdue notification:', error);
    }
  }

  sendReturnReminder(lending) {
    if (this.notificationPermission !== 'granted') {
      return;
    }

    const daysUntilDue = Math.ceil(
      (new Date(lending.expectedReturnDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue === 1) {
      try {
        new Notification('Card return reminder', {
          body: `${lending.card?.name || 'Card'} borrowed by ${lending.borrowerName} is due tomorrow`,
          icon: '/pokemon-icon.png',
          tag: `reminder-${lending.id}`
        });
      } catch (error) {
        console.error('Failed to send return reminder:', error);
      }
    }
  }

  async sendTestNotification() {
    const permission = await this.requestNotificationPermission();
    
    if (permission) {
      try {
        new Notification('Pokemon Inventory Manager', {
          body: 'Notifications are enabled! You\'ll receive reminders for overdue cards.',
          icon: '/pokemon-icon.png'
        });
        return true;
      } catch (error) {
        console.error('Failed to send test notification:', error);
        return false;
      }
    }
    
    return false;
  }

  // Schedule a specific reminder
  scheduleReminder(lending) {
    const now = new Date();
    const returnDate = new Date(lending.expectedReturnDate);
    const oneDayBefore = new Date(returnDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);

    if (oneDayBefore > now) {
      const timeUntilReminder = oneDayBefore - now;
      
      setTimeout(() => {
        this.sendReturnReminder(lending);
      }, timeUntilReminder);
    }
  }

  // Get notification status
  getNotificationStatus() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }

  // Check if notifications are enabled
  areNotificationsEnabled() {
    return this.notificationPermission === 'granted';
  }
}

// Create singleton instance
const reminderService = new ReminderService();

export default reminderService;