const Constants = require('../services/Constants')
module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('sub_admin_access', [
      {
        admin_id: 1,
        admin_module_id: 1,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        admin_id: 1,
        admin_module_id: 2,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('sub_admin_access', null, {})
  },
}
