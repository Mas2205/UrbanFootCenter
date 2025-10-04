const { Payment, Reservation, User, Field } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Créer un paiement en espèces (pour les employés)
exports.createCashPayment = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { payment_method = 'cash', payment_status = 'paid' } = req.body;
    
    // Vérifier que l'utilisateur est un employé ou admin
    if (req.user.role !== 'employee' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les employés et administrateurs peuvent effectuer des paiements en espèces.'
      });
    }

    // Trouver la réservation
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        { model: User, as: 'user' },
        { model: Field, as: 'field' }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que le paiement est en attente
    if (reservation.payment_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation a déjà été payée ou n\'est pas en attente de paiement'
      });
    }

    // Créer le paiement en espèces
    const payment = await Payment.create({
      id: uuidv4(),
      reservation_id: reservationId,
      user_id: reservation.user_id,
      amount: reservation.total_price,
      payment_method: 'cash',
      payment_status: 'completed',
      transaction_id: `CASH_${Date.now()}`,
      payment_date: new Date(),
      processed_by: req.user.id
    });

    // Mettre à jour le statut de paiement de la réservation
    await reservation.update({
      payment_status: 'paid',
      payment_method: 'cash'
    });

    res.status(201).json({
      success: true,
      message: 'Paiement en espèces effectué avec succès',
      data: {
        payment_id: payment.id,
        reservation_id: reservationId,
        amount: payment.amount,
        payment_method: 'cash',
        payment_status: 'paid'
      }
    });

  } catch (error) {
    console.error('Erreur lors du paiement en espèces:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors du paiement en espèces'
    });
  }
};
