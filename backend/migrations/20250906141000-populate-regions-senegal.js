'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const regions = [
      // DAKAR
      { region_name: 'Dakar', department_name: 'Dakar', city_name: 'Dakar', region_code: 'DK', department_code: 'DK01', population: 1146053, latitude: 14.6937, longitude: -17.4441 },
      { region_name: 'Dakar', department_name: 'Dakar', city_name: 'Guédiawaye', region_code: 'DK', department_code: 'DK01', population: 311394, latitude: 14.7667, longitude: -17.4167 },
      { region_name: 'Dakar', department_name: 'Dakar', city_name: 'Pikine', region_code: 'DK', department_code: 'DK01', population: 1170791, latitude: 14.7549, longitude: -17.3985 },
      { region_name: 'Dakar', department_name: 'Guédiawaye', city_name: 'Guédiawaye', region_code: 'DK', department_code: 'DK02', population: 311394, latitude: 14.7667, longitude: -17.4167 },
      { region_name: 'Dakar', department_name: 'Pikine', city_name: 'Pikine', region_code: 'DK', department_code: 'DK03', population: 1170791, latitude: 14.7549, longitude: -17.3985 },
      { region_name: 'Dakar', department_name: 'Rufisque', city_name: 'Rufisque', region_code: 'DK', department_code: 'DK04', population: 221066, latitude: 14.7167, longitude: -17.2667 },
      
      // THIÈS
      { region_name: 'Thiès', department_name: 'Thiès', city_name: 'Thiès', region_code: 'TH', department_code: 'TH01', population: 320000, latitude: 14.7886, longitude: -16.9260 },
      { region_name: 'Thiès', department_name: 'Mbour', city_name: 'Mbour', region_code: 'TH', department_code: 'TH02', population: 232777, latitude: 14.4197, longitude: -16.9692 },
      { region_name: 'Thiès', department_name: 'Tivaouane', city_name: 'Tivaouane', region_code: 'TH', department_code: 'TH03', population: 45000, latitude: 14.9500, longitude: -16.8167 },
      
      // SAINT-LOUIS
      { region_name: 'Saint-Louis', department_name: 'Saint-Louis', city_name: 'Saint-Louis', region_code: 'SL', department_code: 'SL01', population: 254171, latitude: 16.0200, longitude: -16.4889 },
      { region_name: 'Saint-Louis', department_name: 'Dagana', city_name: 'Dagana', region_code: 'SL', department_code: 'SL02', population: 30000, latitude: 16.5167, longitude: -15.5000 },
      { region_name: 'Saint-Louis', department_name: 'Podor', city_name: 'Podor', region_code: 'SL', department_code: 'SL03', population: 15000, latitude: 16.6500, longitude: -14.9667 },
      
      // DIOURBEL
      { region_name: 'Diourbel', department_name: 'Diourbel', city_name: 'Diourbel', region_code: 'DB', department_code: 'DB01', population: 132317, latitude: 14.6522, longitude: -16.2317 },
      { region_name: 'Diourbel', department_name: 'Bambey', city_name: 'Bambey', region_code: 'DB', department_code: 'DB02', population: 25000, latitude: 14.7000, longitude: -16.4500 },
      { region_name: 'Diourbel', department_name: 'Mbacké', city_name: 'Mbacké', region_code: 'DB', department_code: 'DB03', population: 200000, latitude: 14.7833, longitude: -15.9167 },
      { region_name: 'Diourbel', department_name: 'Mbacké', city_name: 'Touba', region_code: 'DB', department_code: 'DB03', population: 753315, latitude: 14.8500, longitude: -15.8833 },
      
      // KAOLACK
      { region_name: 'Kaolack', department_name: 'Kaolack', city_name: 'Kaolack', region_code: 'KL', department_code: 'KL01', population: 233708, latitude: 14.1667, longitude: -16.0667 },
      { region_name: 'Kaolack', department_name: 'Guinguinéo', city_name: 'Guinguinéo', region_code: 'KL', department_code: 'KL02', population: 15000, latitude: 14.2667, longitude: -15.9500 },
      { region_name: 'Kaolack', department_name: 'Nioro du Rip', city_name: 'Nioro du Rip', region_code: 'KL', department_code: 'KL03', population: 25000, latitude: 13.7500, longitude: -15.7833 },
      
      // TAMBACOUNDA
      { region_name: 'Tambacounda', department_name: 'Tambacounda', city_name: 'Tambacounda', region_code: 'TC', department_code: 'TC01', population: 78800, latitude: 13.7667, longitude: -13.6667 },
      { region_name: 'Tambacounda', department_name: 'Bakel', city_name: 'Bakel', region_code: 'TC', department_code: 'TC02', population: 18939, latitude: 14.9000, longitude: -12.4667 },
      { region_name: 'Tambacounda', department_name: 'Goudiry', city_name: 'Goudiry', region_code: 'TC', department_code: 'TC03', population: 12000, latitude: 14.1833, longitude: -12.7167 },
      { region_name: 'Tambacounda', department_name: 'Koumpentoum', city_name: 'Koumpentoum', region_code: 'TC', department_code: 'TC04', population: 8000, latitude: 14.5500, longitude: -14.5500 },
      
      // KOLDA
      { region_name: 'Kolda', department_name: 'Kolda', city_name: 'Kolda', region_code: 'KD', department_code: 'KD01', population: 63007, latitude: 12.8833, longitude: -14.9500 },
      { region_name: 'Kolda', department_name: 'Médina Yoro Foulah', city_name: 'Médina Yoro Foulah', region_code: 'KD', department_code: 'KD02', population: 8000, latitude: 12.3000, longitude: -12.3000 },
      { region_name: 'Kolda', department_name: 'Vélingara', city_name: 'Vélingara', region_code: 'KD', department_code: 'KD03', population: 25000, latitude: 13.1500, longitude: -14.1167 },
      
      // ZIGUINCHOR
      { region_name: 'Ziguinchor', department_name: 'Ziguinchor', city_name: 'Ziguinchor', region_code: 'ZG', department_code: 'ZG01', population: 230000, latitude: 12.5833, longitude: -16.2667 },
      { region_name: 'Ziguinchor', department_name: 'Bignona', city_name: 'Bignona', region_code: 'ZG', department_code: 'ZG02', population: 26000, latitude: 12.8167, longitude: -16.2333 },
      { region_name: 'Ziguinchor', department_name: 'Oussouye', city_name: 'Oussouye', region_code: 'ZG', department_code: 'ZG03', population: 12000, latitude: 12.4833, longitude: -16.5500 },
      
      // LOUGA
      { region_name: 'Louga', department_name: 'Louga', city_name: 'Louga', region_code: 'LG', department_code: 'LG01', population: 104986, latitude: 15.6167, longitude: -16.2167 },
      { region_name: 'Louga', department_name: 'Linguère', city_name: 'Linguère', region_code: 'LG', department_code: 'LG02', population: 20000, latitude: 15.3833, longitude: -15.1167 },
      { region_name: 'Louga', department_name: 'Kébémer', city_name: 'Kébémer', region_code: 'LG', department_code: 'LG03', population: 15000, latitude: 15.3667, longitude: -16.4500 },
      
      // FATICK
      { region_name: 'Fatick', department_name: 'Fatick', city_name: 'Fatick', region_code: 'FK', department_code: 'FK01', population: 28000, latitude: 14.3333, longitude: -16.4167 },
      { region_name: 'Fatick', department_name: 'Foundiougne', city_name: 'Foundiougne', region_code: 'FK', department_code: 'FK02', population: 18000, latitude: 14.1333, longitude: -16.4667 },
      { region_name: 'Fatick', department_name: 'Gossas', city_name: 'Gossas', region_code: 'FK', department_code: 'FK03', population: 12000, latitude: 14.4833, longitude: -16.0667 },
      
      // MATAM
      { region_name: 'Matam', department_name: 'Matam', city_name: 'Matam', region_code: 'MT', department_code: 'MT01', population: 18123, latitude: 15.6500, longitude: -13.2500 },
      { region_name: 'Matam', department_name: 'Kanel', city_name: 'Kanel', region_code: 'MT', department_code: 'MT02', population: 12000, latitude: 15.4833, longitude: -13.1833 },
      { region_name: 'Matam', department_name: 'Ranérou', city_name: 'Ranérou', region_code: 'MT', department_code: 'MT03', population: 8000, latitude: 15.3000, longitude: -13.9667 },
      
      // KAFFRINE
      { region_name: 'Kaffrine', department_name: 'Kaffrine', city_name: 'Kaffrine', region_code: 'KF', department_code: 'KF01', population: 45000, latitude: 14.1000, longitude: -15.5500 },
      { region_name: 'Kaffrine', department_name: 'Birkelane', city_name: 'Birkelane', region_code: 'KF', department_code: 'KF02', population: 15000, latitude: 14.1667, longitude: -15.6333 },
      { region_name: 'Kaffrine', department_name: 'Koungheul', city_name: 'Koungheul', region_code: 'KF', department_code: 'KF03', population: 18000, latitude: 13.9833, longitude: -14.8000 },
      { region_name: 'Kaffrine', department_name: 'Malem-Hodar', city_name: 'Malem-Hodar', region_code: 'KF', department_code: 'KF04', population: 10000, latitude: 13.8500, longitude: -15.3167 },
      
      // KÉDOUGOU
      { region_name: 'Kédougou', department_name: 'Kédougou', city_name: 'Kédougou', region_code: 'KE', department_code: 'KE01', population: 21000, latitude: 12.5667, longitude: -12.1833 },
      { region_name: 'Kédougou', department_name: 'Salémata', city_name: 'Salémata', region_code: 'KE', department_code: 'KE02', population: 8000, latitude: 12.8500, longitude: -12.0500 },
      { region_name: 'Kédougou', department_name: 'Saraya', city_name: 'Saraya', region_code: 'KE', department_code: 'KE03', population: 6000, latitude: 12.8167, longitude: -11.7500 },
      
      // SÉDHIOU
      { region_name: 'Sédhiou', department_name: 'Sédhiou', city_name: 'Sédhiou', region_code: 'SE', department_code: 'SE01', population: 35000, latitude: 12.7083, longitude: -15.5567 },
      { region_name: 'Sédhiou', department_name: 'Bounkiling', city_name: 'Bounkiling', region_code: 'SE', department_code: 'SE02', population: 8000, latitude: 13.0167, longitude: -15.5333 },
      { region_name: 'Sédhiou', department_name: 'Goudomp', city_name: 'Goudomp', region_code: 'SE', department_code: 'SE03', population: 12000, latitude: 12.6167, longitude: -15.1167 }
    ];

    await queryInterface.bulkInsert('regions', regions.map(region => ({
      ...region,
      id: require('uuid').v4(),
      created_at: new Date(),
      updated_at: new Date()
    })));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('regions', null, {});
  }
};
