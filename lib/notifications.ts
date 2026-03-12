import { db } from './db';
import { notifications, userPreferences } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Define notification types
type NotificationType = 'new_comment' | 'comment_reply' | 'image_approved' | 'image_rejected' | 'collection_add' | 'mention' | 'system';
type RelatedType = 'image' | 'comment' | 'user';

export interface CreateNotificationParams {
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: RelatedType;
  actionUrl?: string;
}









/**
 * Create a notification for a user
 * Respects user preferences - won't create notification if disabled
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    // Check user preferences
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, params.userId),
    });

    // If preferences exist, check if this notification type is enabled
    if (prefs) {
      let shouldNotify = true;

      switch (params.type) {
        case 'new_comment':
          shouldNotify = !!prefs.notifyOnComment;
          break;
        case 'comment_reply':
          shouldNotify = !!prefs.notifyOnReply;
          break;
        case 'image_approved':
        case 'image_rejected':
          shouldNotify = !!prefs.notifyOnImageStatus;
          break;
        case 'collection_add':
        case 'mention':
          // For these types, use general emailNotifications setting
          shouldNotify = !!prefs.emailNotifications;
          break;
        default:
          // For other types (including 'follow'), use general emailNotifications setting
          shouldNotify = !!prefs.emailNotifications;
          break;





      }

      if (!shouldNotify) {
        console.log(
          `[Notification] Skipped ${params.type} for user ${params.userId} - disabled in preferences`
        );
        return false;
      }
    }

    // Create the notification
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      relatedId: params.relatedId || null,
      relatedType: params.relatedType || null,
      isRead: false,
      actionUrl: params.actionUrl || null,
      createdAt: new Date(),
    });

    console.log(`[Notification] Created ${params.type} for user ${params.userId}`);
    return true;
  } catch (error) {
    console.error('[Notification] Failed to create notification:', error);
    return false;
  }
}

/**
 * Get or create user preferences
 */
export async function getOrCreateUserPreferences(userId: string) {
  try {
    let prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    if (!prefs) {
      // Create default preferences
      const newPrefs = {
        id: crypto.randomUUID(),
        userId,
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnReply: true,
        notifyOnFollow: true,
        notifyOnImageStatus: true,
        createdAt: new Date(),
      };

      await db.insert(userPreferences).values(newPrefs);

      prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
      });
    }

    return prefs;
  } catch (error) {
    console.error('[Notification] Failed to get/create preferences:', error);
    return null;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error('[Notification] Failed to get unread count:', error);
    return 0;
  }
}
