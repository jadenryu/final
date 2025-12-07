// Test polyslice module structure
const polyslice = await import('@jgphilpott/polyslice');

console.log('=== polyslice module ===');
console.log('Keys:', Object.keys(polyslice));
console.log('');

console.log('=== polyslice.default ===');
console.log('Type:', typeof polyslice.default);
if (polyslice.default) {
  console.log('Keys:', Object.keys(polyslice.default));
  console.log('Printer:', polyslice.default.Printer);
  console.log('Filament:', polyslice.default.Filament);
}
