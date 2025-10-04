const { Notification } = require('../models');
const { User } = require('../models');
const socketIO = require('../config/socket');

/**
 * Service de gestion des notifications
 */
class NotificationService {
  /**
   * Crée une nouvelle notification
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise<Object>} - La notification créée
   */
  static async createNotification(notificationData) {
    try {
      const { user_id, title, message, type, related_entity_id, related_entity_type } = notificationData;
      
      // Vérifier que l'utilisateur existe
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      // Créer la notification
      const notification = await Notification.create({
        user_id,
        title,
        message,
        type,
        related_entity_id,
        related_entity_type,
        is_read: false
      });
      
      // Envoi d'une notification en temps réel via Socket.IO si disponible
      this.sendRealTimeNotification(user_id, notification);
      
      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }
  
  /**
   * Envoie une notification en temps réel via Socket.IO
   * @param {string} userId - ID de l'utilisateur destinataire
   * @param {Object} notification - Données de la notification
   */
  static sendRealTimeNotification(userId, notification) {
    try {
      const io = socketIO.getIO();
      if (io) {
        // Émettre la notification dans la salle de l'utilisateur
        io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          created_at: notification.created_at
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification temps réel:', error);
      // Ne pas bloquer le processus si la notification temps réel échoue
    }
  }
  
  /**
   * Récupère toutes les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage et pagination
   * @returns {Promise<Array>} - Liste des notifications
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, unread_only = false } = options;
      
      const whereClause = { user_id: userId };
      if (unread_only) {
        whereClause.is_read = false;
      }
      
      const notifications = await Notification.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }
  
  /**
   * Marque une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} - Succès de l'opération
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          user_id: userId
        }
      });
      
      if (!notification) {
        return false;
      }
      
      await notification.update({ is_read: true });
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      throw error;
    }
  }
  
  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de notifications mises à jour
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );
      
      return result[0]; // Nombre de lignes affectées
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      throw error;
    }
  }
  
  /**
   * Supprime une notification
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} - Succès de l'opération
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.destroy({
        where: {
          id: notificationId,
          user_id: userId
        }
      });
      
      return result > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }
  
  /**
   * Envoie une notification de système à tous les administrateurs
   * @param {string} title - Titre de la notification
   * @param {string} message - Message de la notification
   * @param {string} type - Type de la notification
   * @param {string} relatedEntityId - ID de l'entité liée (optionnel)
   * @param {string} relatedEntityType - Type de l'entité liée (optionnel)
   * @returns {Promise<Array>} - Notifications créées
   */
  static async notifyAdmins(title, message, type, relatedEntityId = null, relatedEntityType = null) {
    try {
      // Récupérer tous les administrateurs
      const admins = await User.findAll({
        where: {
          role: ['admin', 'super_admin']
        }
      });
      
      const notifications = [];
      
      // Créer une notification pour chaque administrateur
      for (const admin of admins) {
        const notification = await this.createNotification({
          user_id: admin.id,
          title,
          message,
          type,
          related_entity_id: relatedEntityId,
          related_entity_type: relatedEntityType
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la notification des administrateurs:', error);
      throw error;
    }
  }
}

// Pour une utilisation plus simple dans les contrôleurs
const createNotification = NotificationService.createNotification.bind(NotificationService);
const getUserNotifications = NotificationService.getUserNotifications.bind(NotificationService);
const markAsRead = NotificationService.markAsRead.bind(NotificationService);
const markAllAsRead = NotificationService.markAllAsRead.bind(NotificationService);
const deleteNotification = NotificationService.deleteNotification.bind(NotificationService);
const notifyAdmins = NotificationService.notifyAdmins.bind(NotificationService);

module.exports = {
  NotificationService,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyAdmins
};
