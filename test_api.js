console.log('--- API PROBE ---');
console.log('process.type:', process.type);
console.log('process.versions:', process.versions);
console.log('module.paths:', module.paths);
try {
    const e = require('electron');
    console.log('require(electron) success:', Object.keys(e));
} catch (err) {
    console.log('require(electron) failed:', err.message);
}

try {
    const e = require('electron/main');
    console.log('require(electron/main) success');
} catch (err) {
    console.log('require(electron/main) failed:', err.message);
}
console.log('--- END PROBE ---');
if (process.type === 'browser') {
    // try to access internals?
    console.log('process.electronBinding:', typeof process.electronBinding);
}
