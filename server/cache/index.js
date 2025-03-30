/**
 * A map that stores encrypted numbers and their corresponding original text.
 * @type {Map<number, string>}
 */
const encryptionCache = new Map();

/**
 * A map that stores the latest status of each machine. The key is the machine name.
 * @type {Map<string, { id: number; status: 'Running' | 'Stopped' }>} 
 */
const existMachinesCache = new Map();

module.exports = { encryptionCache, existMachinesCache };
