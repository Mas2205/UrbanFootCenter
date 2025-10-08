const fs = require('fs');
const path = require('path');

const modelsToFix = [
  'membreEquipe.model.js',
  'tournoi.model.js', 
  'participationTournoi.model.js',
  'matchTournoi.model.js',
  'matchChampionnat.model.js',
  'classementChampionnat.model.js'
];

const modelsDir = path.join(__dirname, '../models');

modelsToFix.forEach(modelFile => {
  const filePath = path.join(modelsDir, modelFile);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer l'import et le début
    content = content.replace(
      /const { DataTypes } = require\('sequelize'\);\nconst { sequelize } = require\('\.\.\/config\/database'\);\n\nconst (\w+) = sequelize\.define\('(\w+)', {[\s\S]*?id: {\s*type: DataTypes\.UUID,\s*defaultValue: DataTypes\.UUIDV4,\s*primaryKey: true\s*},/,
      `module.exports = (sequelize, DataTypes, defaultOptions) => {
  const $1 = sequelize.define('$2', {
    id: {
      ...defaultOptions.id
    },`
    );
    
    // Remplacer la fin
    content = content.replace(
      /\s*]\s*}\);\s*module\.exports = (\w+);?\s*$/,
      `  ]
  });

  return $1;
};`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Modèle ${modelFile} corrigé`);
  } else {
    console.log(`❌ Fichier ${modelFile} non trouvé`);
  }
});

console.log('🎉 Correction des modèles terminée !');
