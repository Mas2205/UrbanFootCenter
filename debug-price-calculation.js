// Test pour reproduire le problème de calcul de prix

console.log('🔍 === TEST CALCUL PRIX ===');

// Simulation des données comme elles arrivent probablement
const field = {
  price_per_hour: "25500.00", // Chaîne depuis la DB
  equipment_fee: "3000.00"    // Chaîne depuis la DB
};

console.log('📋 Données terrain:');
console.log('  price_per_hour:', typeof field.price_per_hour, '=', field.price_per_hour);
console.log('  equipment_fee:', typeof field.equipment_fee, '=', field.equipment_fee);

// ❌ PROBLÈME: Addition sans conversion
let totalPriceWrong = field.price_per_hour;
if (field.equipment_fee) {
  totalPriceWrong += field.equipment_fee; // Concaténation !
}
console.log('\n❌ Calcul INCORRECT (concaténation):');
console.log('  Résultat:', typeof totalPriceWrong, '=', totalPriceWrong);

// ✅ SOLUTION: Conversion en nombre
let totalPriceCorrect = parseFloat(field.price_per_hour) || 0;
if (field.equipment_fee) {
  totalPriceCorrect += parseFloat(field.equipment_fee) || 0;
}
totalPriceCorrect = Math.round(totalPriceCorrect * 100) / 100;

console.log('\n✅ Calcul CORRECT (conversion):');
console.log('  Résultat:', typeof totalPriceCorrect, '=', totalPriceCorrect);
console.log('  Pour DB:', totalPriceCorrect.toFixed(2));

// Test avec différents types de données
console.log('\n🧪 Tests avec différents types:');

const testCases = [
  { price: 25500, fee: 3000 },           // Nombres
  { price: "25500", fee: "3000" },       // Chaînes
  { price: "25500.00", fee: "3000.00" }, // Chaînes avec décimales
  { price: 25500.00, fee: 3000.00 }      // Nombres décimaux
];

testCases.forEach((test, i) => {
  let result = parseFloat(test.price) + parseFloat(test.fee);
  result = Math.round(result * 100) / 100;
  console.log(`  Test ${i+1}: ${test.price} + ${test.fee} = ${result.toFixed(2)}`);
});

console.log('\n💡 CONCLUSION:');
console.log('En production, PostgreSQL est plus strict sur les types numeric.');
console.log('Il faut TOUJOURS convertir en nombre avant les calculs.');
