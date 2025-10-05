const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration pour le stockage local (développement)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/fields';
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'field-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuration pour Cloudinary (production)
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary si les variables d'environnement sont définies
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Middleware pour upload avec Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'urban-foot-center/fields',
      public_id: `field-${Date.now()}`,
      overwrite: true,
      resource_type: 'image'
    });
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(file.path);
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

// Configuration du multer selon l'environnement
const upload = multer({
  storage: localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    // Vérifier le type de fichier
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
    }
  }
});

module.exports = {
  upload,
  uploadToCloudinary,
  localStorage
};
