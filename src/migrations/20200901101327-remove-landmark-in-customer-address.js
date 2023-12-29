'use strict'

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.removeColumn('customer_address', 'landmark', {})
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer_address', 'landmark')
  },
}
