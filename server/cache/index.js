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
     * @property {'Running' | 'Stopped' | 'DISCONNECT'} status - Current status of the machine
     * @property {string | null} k_num - K-number identifier
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

  resetStatusAndKNum() {
    this.machineCache.forEach((machine) => {
      machine.status = null;
      machine.k_num = null;

      this.machineCache.set(machine.name, {
        ...machine,
        status: null,
        k_num: null,
      });
    });
  }

  /**
   * Set machine data in cache
   * @param {string} machineName - Name of the machine
   * @param {MachineData} machineData - Machine data to store
   * @returns {MachineCacheManager} Returns this for method chaining
   */
  set(machineName, machineData) {
    this.machineCache.set(machineName, { ...machineData });
    return this;
  }

  /**
   * Update machine status
   * @param {string} machineName - Name of the machine
   * @param {'Running' | 'Stopped' | 'DISCONNECT'} status - New status
   * @returns {boolean} True if updated, false if machine not found
   */
  updateStatus(machineName, status) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return false;

    machine.status = status;
    return true;
  }

  /**
   * Update machine k_num
   * @param {string} machineName - Name of the machine
   * @param {string} kNum - New k_num
   * @returns {boolean} True if updated, false if machine not found
   */
  updateKNum(machineName, kNum) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return false;

    machine.k_num = kNum;
    return true;
  }

  /**
   * Update both status and k_num
   * @param {string} machineName - Name of the machine
   * @param {string} status - New status
   * @param {string} kNum - New k_num
   * @returns {boolean} True if updated, false if machine not found
   */
  updateStatusAndKNum(machineName, status, kNum) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return false;

    machine.status = status;
    machine.k_num = kNum;
    return true;
  }

  /**
   * Check if status or k_num has changed (sesuai revisi requirement)
   * @param {string} machineName - Name of the machine
   * @param {string} newStatus - New status to check
   * @param {string} newKNum - New k_num to check
   * @returns {boolean} True if either status or k_num has changed
   */
  hasStatusOrKNumChanged(machineName, newStatus, newKNum) {
    const machine = this.machineCache.get(machineName);
    if (!machine) return true; // If machine not in cache, consider it as changed

    return machine.status !== newStatus || machine.k_num !== newKNum;
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
   * Remove machine from cache
   * @param {string} machineName - Name of the machine to remove
   * @returns {boolean} True if machine was removed
   */
  remove(machineName) {
    return this.machineCache.delete(machineName);
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
