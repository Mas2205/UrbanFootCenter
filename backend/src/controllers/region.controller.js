const { Region } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

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

// Créer une nouvelle région
exports.createRegion = async (req, res) => {
  try {
    const {
      region_name,
      department_name,
      city_name,
      region_code,
      department_code,
      population,
      area_km2,
      latitude,
      longitude
    } = req.body;

    // Validation des champs obligatoires
    if (!region_name || !department_name || !city_name) {
      return res.status(400).json({
        success: false,
        message: 'Les champs région, département et ville sont obligatoires'
      });
    }

    // Vérifier si la région existe déjà
    const existingRegion = await Region.findOne({
      where: {
        region_name,
        department_name,
        city_name
      }
    });

    if (existingRegion) {
      return res.status(409).json({
        success: false,
        message: 'Cette région existe déjà'
      });
    }

    const newRegion = await Region.create({
      region_name,
      department_name,
      city_name,
      region_code,
      department_code,
      population,
      area_km2,
      latitude,
      longitude
    });

    res.status(201).json({
      success: true,
      message: 'Région créée avec succès',
      data: newRegion
    });
  } catch (error) {
    console.error('Erreur lors de la création de la région:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la région',
      error: error.message
    });
  }
};

// Modifier une région
exports.updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      region_name,
      department_name,
      city_name,
      region_code,
      department_code,
      population,
      area_km2,
      latitude,
      longitude
    } = req.body;

    // Validation des champs obligatoires
    if (!region_name || !department_name || !city_name) {
      return res.status(400).json({
        success: false,
        message: 'Les champs région, département et ville sont obligatoires'
      });
    }

    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Région non trouvée'
      });
    }

    // Vérifier si une autre région avec les mêmes données existe déjà
    const existingRegion = await Region.findOne({
      where: {
        region_name,
        department_name,
        city_name,
        id: { [Op.ne]: id }
      }
    });

    if (existingRegion) {
      return res.status(409).json({
        success: false,
        message: 'Une région avec ces informations existe déjà'
      });
    }

    await region.update({
      region_name,
      department_name,
      city_name,
      region_code,
      department_code,
      population,
      area_km2,
      latitude,
      longitude
    });

    res.status(200).json({
      success: true,
      message: 'Région mise à jour avec succès',
      data: region
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la région:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la région',
      error: error.message
    });
  }
};

// Supprimer une région
exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Région non trouvée'
      });
    }

    await region.destroy();

    res.status(200).json({
      success: true,
      message: 'Région supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la région:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la région',
      error: error.message
    });
  }
};

// Récupérer une région par ID
exports.getRegionById = async (req, res) => {
  try {
    const { id } = req.params;

    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Région non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: region
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la région:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la région',
      error: error.message
    });
  }
};

// Configuration multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Middleware pour l'upload
exports.uploadMiddleware = upload.single('file');

// Exporter toutes les régions en Excel
exports.exportRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      order: [['region_name', 'ASC'], ['department_name', 'ASC'], ['city_name', 'ASC']]
    });

    // Préparer les données pour Excel
    const excelData = regions.map(region => ({
      'Nom Région': region.region_name,
      'Nom Département': region.department_name,
      'Nom Ville': region.city_name,
      'Code Région': region.region_code || '',
      'Code Département': region.department_code || '',
      'Population': region.population || '',
      'Superficie (km²)': region.area_km2 || '',
      'Latitude': region.latitude || '',
      'Longitude': region.longitude || '',
      'Date Création': region.created_at ? new Date(region.created_at).toLocaleDateString('fr-FR') : '',
      'Date Modification': region.updated_at ? new Date(region.updated_at).toLocaleDateString('fr-FR') : ''
    }));

    // Créer le workbook Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 20 }, // Nom Région
      { wch: 20 }, // Nom Département
      { wch: 20 }, // Nom Ville
      { wch: 15 }, // Code Région
      { wch: 15 }, // Code Département
      { wch: 12 }, // Population
      { wch: 15 }, // Superficie
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 15 }, // Date Création
      { wch: 15 }  // Date Modification
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Régions');

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Définir les headers pour le téléchargement
    const filename = `regions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export Excel',
      error: error.message
    });
  }
};

// Importer des régions depuis un fichier Excel
exports.importRegions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Lire le fichier Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le fichier Excel est vide'
      });
    }

    // Valider et préparer les données
    const regionsToImport = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 car Excel commence à 1 et on a un header

      // Vérifier les champs obligatoires
      if (!row['Nom Région'] || !row['Nom Département'] || !row['Nom Ville']) {
        errors.push(`Ligne ${rowNumber}: Les champs Région, Département et Ville sont obligatoires`);
        continue;
      }

      const regionData = {
        region_name: String(row['Nom Région']).trim(),
        department_name: String(row['Nom Département']).trim(),
        city_name: String(row['Nom Ville']).trim(),
        region_code: row['Code Région'] ? String(row['Code Région']).trim() : null,
        department_code: row['Code Département'] ? String(row['Code Département']).trim() : null,
        population: row['Population'] ? parseInt(row['Population']) : null,
        area_km2: row['Superficie (km²)'] ? parseFloat(row['Superficie (km²)']) : null,
        latitude: row['Latitude'] ? parseFloat(row['Latitude']) : null,
        longitude: row['Longitude'] ? parseFloat(row['Longitude']) : null
      };

      // Validation des coordonnées GPS
      if (regionData.latitude !== null && (regionData.latitude < -90 || regionData.latitude > 90)) {
        errors.push(`Ligne ${rowNumber}: Latitude invalide (doit être entre -90 et 90)`);
        continue;
      }

      if (regionData.longitude !== null && (regionData.longitude < -180 || regionData.longitude > 180)) {
        errors.push(`Ligne ${rowNumber}: Longitude invalide (doit être entre -180 et 180)`);
        continue;
      }

      regionsToImport.push(regionData);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation dans le fichier',
        errors: errors
      });
    }

    // Supprimer toutes les régions existantes et insérer les nouvelles (remplacement complet)
    await Region.destroy({ where: {} });
    await Region.bulkCreate(regionsToImport);

    res.status(200).json({
      success: true,
      message: `${regionsToImport.length} régions importées avec succès`,
      importedCount: regionsToImport.length
    });

  } catch (error) {
    console.error('Erreur lors de l\'import Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'import Excel',
      error: error.message
    });
  }
};
