const axios = require('axios');
const fs = require('fs');

async function testExport() {
  try {
    // D'abord, se connecter pour obtenir un token
    console.log('🔐 Connexion en tant que super admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@admin.com',
      password: 'test123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Échec de la connexion:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu');

    // Tester l'export
    console.log('📊 Test de l\'export Excel...');
    const exportResponse = await axios.get('http://localhost:5001/api/admin/regions/export', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });

    // Sauvegarder le fichier Excel
    const filename = `test_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    fs.writeFileSync(filename, exportResponse.data);
    
    console.log('✅ Export réussi! Fichier sauvegardé:', filename);
    console.log('📁 Taille du fichier:', exportResponse.data.length, 'bytes');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testExport();
