'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize, Sequelize, defaultOptions } = require('../config/database');
const DataTypes = Sequelize.DataTypes;
const basename = path.basename(__filename);

const db = {};

// Importation dynamique de tous les modèles
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== basename) && 
           (file.slice(-9) === '.model.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes, defaultOptions);
    db[model.name] = model;
  });

// Association des modèles
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Ajout de sequelize et Sequelize à l'objet db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Exporter tous les modèles individuellement pour un accès plus facile
db.User = require('./user.model')(sequelize, DataTypes, defaultOptions);
db.Field = require('./field.model')(sequelize, DataTypes, defaultOptions);
db.Reservation = require('./reservation.model')(sequelize, DataTypes, defaultOptions);
db.TimeSlot = require('./time_slot.model')(sequelize, DataTypes, defaultOptions);
db.Payment = require('./payment.model')(sequelize, DataTypes, defaultOptions);
db.PromoCode = require('./promo_code.model')(sequelize, DataTypes, defaultOptions);
db.Team = require('./team.model')(sequelize, DataTypes, defaultOptions);
db.TeamMember = require('./team_member.model')(sequelize, DataTypes, defaultOptions);
db.Notification = require('./notification.model')(sequelize, DataTypes, defaultOptions);
db.SpecialEvent = require('./special_event.model')(sequelize, DataTypes, defaultOptions);
db.HolidayAndClosure = require('./holiday_and_closure.model')(sequelize, DataTypes, defaultOptions);
db.PaymentMethod = require('./payment_method.model')(sequelize, DataTypes, defaultOptions);
db.Region = require('./region.model')(sequelize, DataTypes, defaultOptions);

// Définition des associations
// Utilisateur <-> Réservation
db.User.hasMany(db.Reservation, { foreignKey: 'user_id', as: 'reservations' });
db.Reservation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// Terrain <-> Réservation
db.Field.hasMany(db.Reservation, { foreignKey: 'field_id', as: 'reservations' });
db.Reservation.belongsTo(db.Field, { foreignKey: 'field_id', as: 'field' });

// Réservation <-> Paiement
db.Reservation.hasMany(db.Payment, { foreignKey: 'reservation_id', as: 'payments' });
db.Payment.belongsTo(db.Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

// Réservation <-> Code Promo
db.PromoCode.hasMany(db.Reservation, { foreignKey: 'promo_code_id' });
db.Reservation.belongsTo(db.PromoCode, { foreignKey: 'promo_code_id' });

// Équipe <-> Membres d'équipe
db.Team.hasMany(db.TeamMember, { foreignKey: 'team_id' });
db.TeamMember.belongsTo(db.Team, { foreignKey: 'team_id' });

// Utilisateur <-> Notifications
db.User.hasMany(db.Notification, { foreignKey: 'user_id' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

// Terrain <-> Créneaux horaires
db.Field.hasMany(db.TimeSlot, { foreignKey: 'field_id', as: 'timeSlots' });
db.TimeSlot.belongsTo(db.Field, { foreignKey: 'field_id' });

// Terrain <-> Moyens de paiement
db.Field.hasMany(db.PaymentMethod, { foreignKey: 'field_id', as: 'paymentMethods' });
db.PaymentMethod.belongsTo(db.Field, { foreignKey: 'field_id', as: 'field' });

module.exports = db;
