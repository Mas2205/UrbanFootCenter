const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// Récupérer les KPIs principaux du tableau de bord
exports.getDashboardKPIs = async (req, res) => {
  try {
    // Calculer les KPIs directement depuis les tables réelles
    const kpis = await sequelize.query(`
      SELECT 
        -- Revenus totaux (somme des réservations confirmées)
        (SELECT COALESCE(SUM(total_price), 0) FROM reservations WHERE status = 'confirmed') as total_revenue,
        
        -- Revenus aujourd'hui
        (SELECT COALESCE(SUM(total_price), 0) FROM reservations 
         WHERE status = 'confirmed' AND DATE(reservation_date) = CURRENT_DATE) as today_revenue,
        
        -- Réservations aujourd'hui
        (SELECT COUNT(*) FROM reservations WHERE DATE(reservation_date) = CURRENT_DATE) as today_reservations,
        
        -- Total réservations
        (SELECT COUNT(*) FROM reservations) as total_reservations,
        
        -- Utilisateurs actifs (ayant fait une réservation dans les 30 derniers jours)
        (SELECT COUNT(DISTINCT user_id) FROM reservations 
         WHERE reservation_date >= CURRENT_DATE - INTERVAL '30 days') as active_users,
        
        -- Total utilisateurs
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_users,
        
        -- Terrain le plus populaire
        (SELECT f.name FROM fields f 
         JOIN reservations r ON f.id = r.field_id 
         GROUP BY f.id, f.name 
         ORDER BY COUNT(r.id) DESC 
         LIMIT 1) as most_popular_field,
        
        -- Paiements en attente (réservations pending)
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending') as pending_payments
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: kpis[0] || {}
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des KPIs',
      error: error.message
    });
  }
};

// Statistiques des paiements
exports.getPaymentStatistics = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND reservation_date BETWEEN '${startDate}' AND '${endDate}'`;
    }

    // Répartition par statut (utiliser les réservations)
    const statusStats = await sequelize.query(`
      SELECT 
        status as payment_status,
        COUNT(*) as count,
        SUM(total_price) as total_amount
      FROM reservations 
      WHERE reservation_date IS NOT NULL ${dateFilter}
      GROUP BY status
    `, { type: QueryTypes.SELECT });

    // Répartition par méthode de paiement (simulée avec les statuts)
    const methodStats = await sequelize.query(`
      SELECT 
        CASE 
          WHEN status = 'confirmed' THEN 'wave'
          WHEN status = 'pending' THEN 'orange_money'
          ELSE 'cash'
        END as payment_method,
        COUNT(*) as count,
        SUM(total_price) as total_amount
      FROM reservations 
      WHERE reservation_date IS NOT NULL ${dateFilter}
      GROUP BY CASE 
        WHEN status = 'confirmed' THEN 'wave'
        WHEN status = 'pending' THEN 'orange_money'
        ELSE 'cash'
      END
    `, { type: QueryTypes.SELECT });

    // Évolution dans le temps
    const timeStats = await sequelize.query(`
      SELECT 
        reservation_date as period,
        SUM(total_price) as total_amount
      FROM reservations 
      WHERE status = 'confirmed' AND reservation_date IS NOT NULL ${dateFilter}
      GROUP BY reservation_date
      ORDER BY reservation_date
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        statusStats,
        methodStats,
        timeStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de paiements',
      error: error.message
    });
  }
};

// Statistiques des terrains
exports.getFieldStatistics = async (req, res) => {
  try {
    // Statistiques par terrain avec détail des statuts
    const fieldStats = await sequelize.query(`
      SELECT 
        f.id as field_id,
        f.name as field_name,
        f.location,
        f.price_per_hour,
        f.size,
        f.surface_type,
        COUNT(r.id) as total_reservations,
        SUM(CASE WHEN r.status = 'confirmed' THEN r.total_price ELSE 0 END) as confirmed_revenue,
        SUM(CASE WHEN r.status = 'pending' THEN r.total_price ELSE 0 END) as pending_revenue,
        SUM(CASE WHEN r.status = 'cancelled' THEN r.total_price ELSE 0 END) as cancelled_revenue,
        SUM(r.total_price) as total_revenue,
        COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_reservations,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reservations,
        COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as cancelled_reservations
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id
      GROUP BY f.id, f.name, f.location, f.price_per_hour, f.size, f.surface_type
      ORDER BY total_reservations DESC
    `, { type: QueryTypes.SELECT });

    // Répartition par type de surface
    const surfaceStats = await sequelize.query(`
      SELECT 
        f.surface_type,
        COUNT(DISTINCT f.id) as field_count,
        COUNT(r.id) as total_reservations,
        SUM(CASE WHEN r.status = 'confirmed' THEN r.total_price ELSE 0 END) as total_revenue
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id
      GROUP BY f.surface_type
    `, { type: QueryTypes.SELECT });

    // Répartition par taille
    const sizeStats = await sequelize.query(`
      SELECT 
        f.size,
        COUNT(DISTINCT f.id) as field_count,
        AVG(f.price_per_hour) as avg_price_per_hour,
        COUNT(r.id) as total_reservations
      FROM fields f
      LEFT JOIN reservations r ON f.id = r.field_id
      GROUP BY f.size
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        fieldStats,
        surfaceStats,
        sizeStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de terrains:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de terrains',
      error: error.message
    });
  }
};

// Statistiques des réservations
exports.getReservationStatistics = async (req, res) => {
  try {
    const { period = 'month', fieldId, startDate, endDate } = req.query;
    
    let fieldFilter = fieldId ? `AND field_id = '${fieldId}'` : '';
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND reservation_date BETWEEN '${startDate}' AND '${endDate}'`;
    }

    // Réservations par période
    const periodStats = await sequelize.query(`
      SELECT 
        DATE_TRUNC('${period}', reservation_date) as period,
        COUNT(*) as reservation_count,
        SUM(total_price) as total_revenue,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count
      FROM reservations 
      WHERE 1=1 ${fieldFilter} ${dateFilter}
      GROUP BY DATE_TRUNC('${period}', reservation_date)
      ORDER BY period
    `, { type: QueryTypes.SELECT });

    // Statistiques détaillées par date, terrain et statut
    const reservationStats = await sequelize.query(`
      SELECT 
        reservation_date,
        f.name as field_name,
        status, 
        SUM(total_price) as total_amount
      FROM reservations as re
      LEFT OUTER JOIN fields as f ON f.id = re.field_id
      GROUP BY reservation_date, f.name, status
      ORDER BY reservation_date DESC, f.name, status
    `, { type: QueryTypes.SELECT });

    // Statistiques par terrain et statut pour le graphique en barres
    const fieldStatusStats = await sequelize.query(`
      SELECT 
        f.name as field_name,
        status, 
        SUM(total_price) as total_amount
      FROM reservations as re
      LEFT OUTER JOIN fields as f ON f.id = re.field_id
      WHERE 1=1 ${dateFilter}
      GROUP BY f.name, status
      ORDER BY f.name, status
    `, { type: QueryTypes.SELECT });

    // Répartition par statut de paiement (global)
    const paymentStatusStats = await sequelize.query(`
      SELECT 
        status as payment_status,
        COUNT(*) as count,
        SUM(total_price) as total_amount
      FROM reservations
      GROUP BY status
    `, { type: QueryTypes.SELECT });

    // Répartition par terrain (global)
    const fieldSummaryStats = await sequelize.query(`
      SELECT 
        f.id as field_id,
        f.name as field_name,
        COUNT(re.id) as reservation_count,
        SUM(re.total_price) as total_revenue
      FROM fields f
      LEFT JOIN reservations re ON f.id = re.field_id
      GROUP BY f.id, f.name
      ORDER BY reservation_count DESC
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        periodStats,
        reservationStats,
        fieldStatusStats,
        paymentStatusStats,
        fieldStats: fieldSummaryStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de réservations',
      error: error.message
    });
  }
};

// Statistiques des utilisateurs
exports.getUserStatistics = async (req, res) => {
  try {
    // Répartition par rôle
    const roleStats = await sequelize.query(`
      SELECT 
        role,
        COUNT(*) as user_count
      FROM users
      GROUP BY role
    `, { type: QueryTypes.SELECT });

    // Évolution des inscriptions
    const registrationStats = await sequelize.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `, { type: QueryTypes.SELECT });

    // Utilisateurs par terrain réservé
    const userFieldStats = await sequelize.query(`
      SELECT 
        f.name as field_name,
        COUNT(DISTINCT r.user_id) as unique_users,
        COUNT(r.id) as total_reservations
      FROM reservations r
      JOIN fields f ON r.field_id = f.id
      GROUP BY f.id, f.name
      ORDER BY unique_users DESC
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        roleStats,
        registrationStats,
        userFieldStats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques d\'utilisateurs',
      error: error.message
    });
  }
};

// Heatmap horaire
exports.getHourlyHeatmap = async (req, res) => {
  try {
    const heatmapData = await sequelize.query(`
      SELECT * FROM hourly_heatmap
      ORDER BY day_of_week, hour
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la heatmap:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la heatmap',
      error: error.message
    });
  }
};

// Tendance des revenus
exports.getRevenueTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const trendData = await sequelize.query(`
      SELECT 
        DATE_TRUNC('day', p.payment_date) as date,
        SUM(p.amount) as daily_revenue,
        COUNT(*) as daily_payments,
        AVG(SUM(p.amount)) OVER (
          ORDER BY DATE_TRUNC('day', p.payment_date) 
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as moving_avg_7d
      FROM payments p
      WHERE p.payment_status = 'completed' 
        AND p.payment_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', p.payment_date)
      ORDER BY date
    `, { type: QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la tendance des revenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la tendance des revenus',
      error: error.message
    });
  }
};

// Export des données (préparation pour Excel/PDF)
exports.exportStatistics = async (req, res) => {
  try {
    const { type = 'summary', format = 'json' } = req.query;
    
    let data = {};
    
    switch (type) {
      case 'payments':
        const paymentStats = await sequelize.query(`
          SELECT 
            p.*,
            r.field_id,
            f.name as field_name,
            u.first_name,
            u.last_name
          FROM payments p
          LEFT JOIN reservations r ON p.reservation_id = r.id
          LEFT JOIN fields f ON r.field_id = f.id
          LEFT JOIN users u ON r.user_id = u.id
          ORDER BY p.payment_date DESC
        `, { type: QueryTypes.SELECT });
        data = paymentStats;
        break;
        
      case 'reservations':
        const reservationStats = await sequelize.query(`
          SELECT 
            r.*,
            f.name as field_name,
            f.location,
            u.first_name,
            u.last_name,
            u.email
          FROM reservations r
          JOIN fields f ON r.field_id = f.id
          JOIN users u ON r.user_id = u.id
          ORDER BY r.reservation_date DESC
        `, { type: QueryTypes.SELECT });
        data = reservationStats;
        break;
        
      default:
        // Summary avec tous les KPIs
        const kpis = await sequelize.query('SELECT * FROM dashboard_kpis', { type: QueryTypes.SELECT });
        data = kpis[0] || {};
    }

    res.status(200).json({
      success: true,
      data,
      exportType: type,
      format
    });
  } catch (error) {
    console.error('Erreur lors de l\'export des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des statistiques',
      error: error.message
    });
  }
};
