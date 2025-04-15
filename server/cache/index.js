/**
 * A map that stores encrypted numbers and their corresponding original text.
 * @type {Map<number, string>}
 */
const encryptionCache = new Map();

/**
 * A map that stores the latest status of each machine. The key is the machine name.
 * @type {Map<string, { id: number; name: string; status: 'Running' | 'Stopped' |'DISCONNECT'| null }>}
 */
const existMachinesCache = new Map();
// existMachinesCache.set('MC-1', { id: 1, name: 'MC-1', status: 'Running' });
// console.log(existMachinesCache.get('MC-1'));
// // change status
// existMachinesCache.set('MC-1', { status: 'Stopped' });
// // console.log(existMachinesCache.get('MC-1'), 'update');
// const test = existMachinesCache.get('MC-1');
// if (test) {
//     test.status = 'Stopped';
// }
// console.log(existMachinesCache, 'update');

module.exports = { encryptionCache, existMachinesCache };
