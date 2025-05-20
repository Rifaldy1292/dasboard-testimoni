const userMessageCache = {
    /**
     * Store client message preferences
     * @type {Map<WebSocket, {
     *  types?: Set<string>,
     *  lastDate?: string,
     *  shift?: 0|1|2 
     * }>}
     */
    clientData: new Map(),

    /**
     * Add or update client message type
     * @param {WebSocket} client - WebSocket client
     * @param {string} type - Message type
     * @param {object} data - Additional data
     */
    addMessageType(client, type, data = {}) {
        if (!this.clientData.has(client)) {
            this.clientData.set(client, {
                types: new Set(),
                lastDate: data.date,
                shift: data.shift
            })
        }

        const userData = this.clientData.get(client)
        userData.types.add(type)

        if (data.date) {
            userData.lastDate = data.date
        }
        if (data.shift !== undefined) {
            userData.shift = data.shift
        }
    },

    /**
     * Check if client has requested specific message type
     * @param {WebSocket} client 
     * @param {string} type 
     * @returns {boolean}
     */
    hasMessageType(client, type) {
        return this.clientData.get(client)?.types.has(type) || false
    },

    /**
     * Get client last requested date
     * @param {WebSocket} client 
     * @returns {string|undefined}
     */
    getLastDate(client) {
        return this.clientData.get(client)?.lastDate
    },

    /**
     * Get client last requested shift
     * @param {WebSocket} client
     * @returns {number|undefined} 
     */
    getShift(client) {
        return this.clientData.get(client)?.shift
    },

    /**
     * Remove client data when disconnected
     * @param {WebSocket} client 
     */
    removeClient(client) {
        this.clientData.delete(client)
    },

    /**
     * Check if client date matches current date
     * @param {WebSocket} client
     * @returns {boolean} 
     */
    isCurrentDate(client) {
        const lastDate = this.getLastDate(client)
        if (!lastDate) return false
        return new Date(lastDate).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
    },

    /**
     * Remove specific message type for a client
     * @param {WebSocket} client 
     * @param {string} type 
     */
    removeMessageType(client, type) {
        const userData = this.clientData.get(client)
        if (userData) {
            userData.types.delete(type)
            // If no types remain, remove client completely
            if (userData.types.size === 0) {
                this.clientData.delete(client)
            }
        }
    }
}

module.exports = userMessageCache