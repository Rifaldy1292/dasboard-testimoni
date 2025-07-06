/**
 * Machine Cache Manager - Singleton class for managing machine cache
 */
class MachineCacheManager {
  constructor() {
    if (MachineCacheManager.instance) {
      return MachineCacheManager.instance;
    }

    /**
     * @typedef {Object} MachineData
     * @property {number} id - Unique identifier for the machine
     * @property {string} name - Name of the machine
     * @property {'Running' | 'Stopped' | 'DISCONNECT' | null} status - Current status of the machine
     * @property {number | null} transfer_file_id - ID from mqtt message
     * @property {Date | null} createdAt - Timestamp from the last log
     */

    /**
     * @private
     * @type {Map<string, MachineData>}
     */
    this.machineCache = new Map();

    MachineCacheManager.instance = this;
  }

  /**
   * Get machine data from cache
   * @param {string} machineName - Name of the machine
   * @returns {MachineData|null} Machine data or null if not found
   */
  get(machineName) {
    return this.machineCache.get(machineName) || null;
  }

  isNullStatus(machineName) {
    const machine = this.machineCache.get(machineName);
    return machine ? machine.status === null : true;
  }


  /**
   * Set machine data in cache
   * @param {string} machineName - Name of the machine
   * @param {MachineData} machineData - Machine data to store
   * @returns {MachineCacheManager} Returns this for method chaining
   */
  set(machineName, machineData = {}) {
    this.machineCache.set(machineName, { ...machineData });
    return this;
  }

  /**
   * Update cache data
   * @param {string} machineName
   * @param {{status: string, transfer_file_id: number, createdAt: Date}} data
   * @returns {boolean}
   */
  updateCacheData(machineName, data) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return false;

    machine.status = data.status;
    machine.transfer_file_id = data.transfer_file_id;
    machine.createdAt = data.createdAt;
    return true;
  }

  reset() {
    const machines = this.getAll();
    machines.forEach((machine) => {
      this.machineCache.set(machine.name, { ...machine, status: null, transfer_file_id: null, createdAt: null });
    });
    return this;
  }

  /**
   * Check if status or transfer_file_id has changed
   * @param {string} machineName - Name of the machine
   * @param {string} newStatus - New status to check
   * @param {number} newTransferFileId - New transfer_file_id to check
   * @returns {boolean} True if either status or transfer_file_id has changed
   */
  hasDataChanged(machineName, newStatus, newTransferFileId) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return true; // If machine not in cache, consider it as changed

    return machine.status !== newStatus || machine.transfer_file_id !== newTransferFileId;
  }

  /**
   * Check if machine exists in cache
   * @param {string} machineName - Name of the machine
   * @returns {boolean} True if machine exists
   */
  has(machineName) {
    return this.machineCache.has(machineName);
  }

  /**
   * Get all machines from cache
   * @returns {MachineData[]} Array of all machine data
   */
  getAll() {
    return Array.from(this.machineCache.values());
  }

  /**
   * Get all machine names
   * @returns {string[]} Array of machine names
   */
  getAllNames() {
    return Array.from(this.machineCache.keys());
  }



  /**
   * Clear all machines from cache
   * @returns {MachineCacheManager} Returns this for method chaining
   */
  clear() {
    this.machineCache.clear();
    return this;
  }

  /**
   * Get cache size
   * @returns {number} Number of machines in cache
   */
  size() {
    return this.machineCache.size;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const machines = this.getAll();
    const statusCounts = {};

    machines.forEach((machine) => {
      statusCounts[machine.status] = (statusCounts[machine.status] || 0) + 1;
    });

    return {
      totalMachines: machines.length,
      statusDistribution: statusCounts,
      machineNames: this.getAllNames(),
    };
  }
}

const machineCache = new MachineCacheManager();

module.exports = { machineCache };
