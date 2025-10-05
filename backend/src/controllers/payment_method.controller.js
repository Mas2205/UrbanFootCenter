const { PaymentMethod, Field, User } = require('../models');

// Récupérer tous les moyens de paiement du terrain de l'admin
exports.getPaymentMethods = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    let paymentMethods;

    if (user.role === 'super_admin') {
      // Super admin peut voir tous les moyens de paiement
      paymentMethods = await PaymentMethod.findAll({
        include: [
          {
            model: Field,
            as: 'field',
            attributes: ['id', 'name']
          }
        ],
        order: [['payment_type', 'ASC']]
      });
    } else if (user.role === 'admin' && user.field_id) {
      // Admin de terrain ne voit que ses moyens de paiement
      paymentMethods = await PaymentMethod.findAll({
        where: { field_id: user.field_id },
        include: [
          {
            model: Field,
            as: 'field',
            attributes: ['id', 'name']
          }
        ],
        order: [['payment_type', 'ASC']]
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur d\'un terrain ou super administrateur.'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des moyens de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer un nouveau moyen de paiement
exports.createPaymentMethod = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur.'
      });
    }

    // Pour les admins de terrain, vérifier qu'ils ont un field_id
    if (user.role === 'admin' && !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const { field_id, payment_type, api_url, api_key, api_secret, merchant_id, is_active, configuration, ignore_validation } = req.body;

    // Déterminer le field_id à utiliser
    let targetFieldId;
    if (user.role === 'super_admin') {
      // Super admin peut spécifier le field_id ou créer pour tous les terrains
      targetFieldId = field_id;
      if (!targetFieldId) {
        return res.status(400).json({
          success: false,
          message: 'Le field_id est requis pour les super administrateurs.'
        });
      }
    } else {
      // Admin de terrain utilise son field_id
      targetFieldId = user.field_id;
    }

    // Vérifier si ce type de paiement existe déjà pour ce terrain
    const existingPaymentMethod = await PaymentMethod.findOne({
      where: {
        field_id: targetFieldId,
        payment_type: payment_type
      }
    });

    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Ce moyen de paiement existe déjà pour ce terrain.'
      });
    }

    // Validation de l'URL - pas nécessaire pour les paiements en espèces
    if (payment_type !== 'especes') {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(api_url)) {
        return res.status(400).json({
          success: false,
          message: 'L\'URL de l\'API doit être une URL valide (commencer par http:// ou https://)'
        });
      }
    }

    const paymentMethod = await PaymentMethod.create({
      field_id: targetFieldId,
      payment_type,
      api_url,
      api_key,
      api_secret,
      merchant_id,
      is_active: is_active !== undefined ? is_active : true,
      configuration: configuration || {},
      ignore_validation: ignore_validation || false
    });

    const paymentMethodWithField = await PaymentMethod.findByPk(paymentMethod.id, {
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Moyen de paiement créé avec succès',
      data: paymentMethodWithField
    });
  } catch (error) {
    console.error('Erreur lors de la création du moyen de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un moyen de paiement
exports.updatePaymentMethod = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur.'
      });
    }

    // Pour les admins de terrain, vérifier qu'ils ont un field_id
    if (user.role === 'admin' && !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const { id } = req.params;
    const { payment_type, api_url, api_key, api_secret, merchant_id, is_active, configuration, ignore_validation } = req.body;

    let whereClause = { id: id };
    
    // Admin de terrain ne peut modifier que ses moyens de paiement
    if (user.role === 'admin') {
      whereClause.field_id = user.field_id;
    }
    // Super admin peut modifier tous les moyens de paiement

    const paymentMethod = await PaymentMethod.findOne({
      where: whereClause
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Moyen de paiement non trouvé ou non autorisé.'
      });
    }

    // Vérifier si le changement de type de paiement ne crée pas de doublon
    if (payment_type && payment_type !== paymentMethod.payment_type) {
      const existingPaymentMethod = await PaymentMethod.findOne({
        where: {
          field_id: user.field_id,
          payment_type: payment_type,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingPaymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Ce moyen de paiement existe déjà pour votre terrain.'
        });
      }
    }

    // Validation de l'URL si elle est fournie - pas nécessaire pour les paiements en espèces
    if (api_url !== undefined && payment_type !== 'especes') {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(api_url)) {
        return res.status(400).json({
          success: false,
          message: 'L\'URL de l\'API doit être une URL valide (commencer par http:// ou https://)'
        });
      }
    }

    const updateData = {};
    if (payment_type !== undefined) updateData.payment_type = payment_type;
    if (api_url !== undefined) updateData.api_url = api_url;
    if (api_key !== undefined) updateData.api_key = api_key;
    if (api_secret !== undefined) updateData.api_secret = api_secret;
    if (merchant_id !== undefined) updateData.merchant_id = merchant_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (configuration !== undefined) updateData.configuration = configuration;
    if (ignore_validation !== undefined) updateData.ignore_validation = ignore_validation;

    await paymentMethod.update(updateData);

    const updatedPaymentMethod = await PaymentMethod.findByPk(paymentMethod.id, {
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Moyen de paiement mis à jour avec succès',
      data: updatedPaymentMethod
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du moyen de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un moyen de paiement
exports.deletePaymentMethod = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur.'
      });
    }

    // Pour les admins de terrain, vérifier qu'ils ont un field_id
    if (user.role === 'admin' && !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const { id } = req.params;

    let whereClause = { id: id };
    
    // Admin de terrain ne peut supprimer que ses moyens de paiement
    if (user.role === 'admin') {
      whereClause.field_id = user.field_id;
    }
    // Super admin peut supprimer tous les moyens de paiement

    const paymentMethod = await PaymentMethod.findOne({
      where: whereClause
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Moyen de paiement non trouvé ou non autorisé.'
      });
    }

    await paymentMethod.destroy();

    res.status(200).json({
      success: true,
      message: 'Moyen de paiement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du moyen de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un moyen de paiement spécifique
exports.getPaymentMethod = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur.'
      });
    }

    // Pour les admins de terrain, vérifier qu'ils ont un field_id
    if (user.role === 'admin' && !user.field_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Vous devez être administrateur d\'un terrain.'
      });
    }

    const { id } = req.params;

    let whereClause = { id: id };
    
    // Admin de terrain ne peut voir que ses moyens de paiement
    if (user.role === 'admin') {
      whereClause.field_id = user.field_id;
    }
    // Super admin peut voir tous les moyens de paiement

    const paymentMethod = await PaymentMethod.findOne({
      where: whereClause,
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Moyen de paiement non trouvé ou non autorisé.'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du moyen de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
