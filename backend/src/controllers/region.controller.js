const { Region } = require('../models');

// Récupérer toutes les villes uniques
exports.getCities = async (req, res) => {
  try {
    const cities = await Region.findAll({
      attributes: ['city_name'],
      group: ['city_name'],
      order: [['city_name', 'ASC']]
    });

    const cityList = cities.map(city => city.city_name);

    res.status(200).json({
      success: true,
      data: cityList
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des villes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des villes',
      error: error.message
    });
  }
};

// Récupérer toutes les régions
exports.getRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      order: [['region_name', 'ASC'], ['department_name', 'ASC'], ['city_name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des régions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des régions',
      error: error.message
    });
  }
};

// Récupérer les villes par région
exports.getCitiesByRegion = async (req, res) => {
  try {
    const { regionName } = req.params;
    
    const cities = await Region.findAll({
      where: { region_name: regionName },
      attributes: ['city_name'],
      group: ['city_name'],
      order: [['city_name', 'ASC']]
    });

    const cityList = cities.map(city => city.city_name);

    res.status(200).json({
      success: true,
      data: cityList
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des villes par région:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des villes par région',
      error: error.message
    });
  }
};
