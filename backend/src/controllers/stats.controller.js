const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Récupérer les statistiques globales pour un terrain spécifique
 */
exports.getFieldStats = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate, status } = req.query;
    let fieldId;

    // Déterminer le field_id selon le rôle
    if (user.role === 'admin' && user.field_id) {
      // Admin de terrain : utiliser son terrain assigné
      fieldId = user.field_id;
    } else if (user.role === 'super_admin' && req.query.field_id) {
      // Super admin : peut spécifier un terrain
      fieldId = req.query.field_id;
    } else if (user.role === 'super_admin') {
      // Super admin sans terrain spécifié : retourner une erreur
      return res.status(400).json({
        success: false,
        message: 'Veuillez spécifier un terrain (field_id) pour les statistiques'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé aux statistiques'
      });
    }

    // Construire les filtres dynamiques
    let dateFilter = '';
    let statusFilter = '';
    const replacements = { fieldId };

    if (startDate && endDate) {
      dateFilter = 'AND reservation_date BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate; // DATEONLY ne nécessite pas d'heure
    } else if (startDate) {
      dateFilter = 'AND reservation_date >= :startDate';
      replacements.startDate = startDate;
    } else if (endDate) {
      dateFilter = 'AND reservation_date <= :endDate';
      replacements.endDate = endDate; // DATEONLY ne nécessite pas d'heure
    }

    if (status && status !== 'all') {
      statusFilter = 'AND status = :status';
      replacements.status = status;
    }

    // Statistiques globales du terrain avec filtres
    const globalStatsQuery = `
      SELECT 
        COUNT(*) as total_reservations,
        COALESCE(SUM(total_price), 0) as total_revenue
      FROM reservations 
      WHERE field_id = :fieldId ${dateFilter} ${statusFilter}
    `;

    const globalStats = await sequelize.query(globalStatsQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Statistiques par statut avec filtres
    const statusStatsQuery = `
      SELECT 
        status,
        COUNT(*) as total_reservations,
        COALESCE(SUM(total_price), 0) as total_revenue
      FROM reservations 
      WHERE field_id = :fieldId ${dateFilter} ${statusFilter}
      GROUP BY status
      ORDER BY total_revenue DESC
    `;

    const statusStats = await sequelize.query(statusStatsQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Statistiques des 30 derniers jours avec filtres
    let dateRangeFilter = '';
    let dateRangeReplacements = { ...replacements };
    
    if (startDate && endDate) {
      dateRangeFilter = 'AND reservation_date BETWEEN :startDate AND :endDate';
      dateRangeReplacements.startDate = startDate;
      dateRangeReplacements.endDate = endDate;
    } else if (startDate) {
      dateRangeFilter = 'AND reservation_date >= :startDate';
      dateRangeReplacements.startDate = startDate;
    } else if (endDate) {
      dateRangeFilter = 'AND reservation_date <= :endDate';
      dateRangeReplacements.endDate = endDate;
    } else {
      dateRangeFilter = 'AND reservation_date >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    const last30DaysStatsQuery = `
      SELECT 
        reservation_date,
        status,
        COUNT(*) as total_reservations,
        COALESCE(SUM(total_price), 0) as total_revenue
      FROM reservations 
      WHERE field_id = :fieldId ${dateRangeFilter} ${statusFilter}
      GROUP BY reservation_date, status
      ORDER BY reservation_date DESC, status
    `;

    const last30DaysStats = await sequelize.query(last30DaysStatsQuery, {
      replacements: dateRangeReplacements,
      type: QueryTypes.SELECT
    });

    // Top 10 des créneaux les plus populaires avec filtres
    const topTimeSlotsQuery = `
      SELECT 
        start_time,
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_price), 0) as total_revenue
      FROM reservations 
      WHERE field_id = :fieldId ${dateFilter} ${statusFilter}
      GROUP BY start_time
      ORDER BY total_bookings DESC
      LIMIT 10
    `;

    const topTimeSlots = await sequelize.query(topTimeSlotsQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.status(200).json({
      success: true,
      data: {
        fieldId,
        globalStats: globalStats[0] || { total_reservations: 0, total_revenue: 0 },
        statusStats,
        last30DaysStats,
        topTimeSlots
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Récupérer les statistiques détaillées par date pour un terrain
 */
exports.getFieldStatsByDate = async (req, res) => {
  try {
    const user = req.user;
    const { start_date, end_date } = req.query;
    let fieldId;

    // Déterminer le field_id selon le rôle
    if (user.role === 'admin' && user.field_id) {
      fieldId = user.field_id;
    } else if (user.role === 'super_admin' && req.query.field_id) {
      fieldId = req.query.field_id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé aux statistiques'
      });
    }

    let dateFilter = '';
    const replacements = { fieldId };

    if (start_date && end_date) {
      dateFilter = 'AND reservation_date BETWEEN :startDate AND :endDate';
      replacements.startDate = start_date;
      replacements.endDate = end_date;
    } else if (start_date) {
      dateFilter = 'AND reservation_date >= :startDate';
      replacements.startDate = start_date;
    } else if (end_date) {
      dateFilter = 'AND reservation_date <= :endDate';
      replacements.endDate = end_date;
    }

    const statsQuery = `
      SELECT * FROM kpi_reservations_by_field_date 
      WHERE field_id = :fieldId ${dateFilter}
      ORDER BY reservation_date DESC
    `;

    const stats = await sequelize.query(statsQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.status(200).json({
      success: true,
      data: {
        fieldId,
        dateRange: { start_date, end_date },
        stats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par date:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par date',
      error: error.message
    });
  }
};

/**
 * Récupérer les statistiques par heure pour un terrain et une date
 */
exports.getFieldStatsByHour = async (req, res) => {
  try {
    const user = req.user;
    const { date } = req.query;
    let fieldId;

    // Déterminer le field_id selon le rôle
    if (user.role === 'admin' && user.field_id) {
      fieldId = user.field_id;
    } else if (user.role === 'super_admin' && req.query.field_id) {
      fieldId = req.query.field_id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé aux statistiques'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise pour les statistiques par heure'
      });
    }

    const stats = await sequelize.query(`
      SELECT * FROM kpi_reservations_by_field_date_hour 
      WHERE field_id = :fieldId AND reservation_date = :date
      ORDER BY start_time ASC
    `, {
      replacements: { fieldId, date },
      type: QueryTypes.SELECT
    });

    res.status(200).json({
      success: true,
      data: {
        fieldId,
        date,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par heure:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par heure',
      error: error.message
    });
  }
};

// Statistiques globales par date (tous terrains confondus)
const getStatsByDate = async (req, res) => {
  try {
    const query = `
      SELECT 
        reservation_date,
        total_reservations,
        total_revenue
      FROM kpi_reservations_by_date
      ORDER BY reservation_date DESC
      LIMIT 30
    `;

    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats par date:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par date'
    });
  }
};

module.exports = {
  getFieldStats: exports.getFieldStats,
  getFieldStatsByDate: exports.getFieldStatsByDate,
  getFieldStatsByHour: exports.getFieldStatsByHour,
  getStatsByDate
};
