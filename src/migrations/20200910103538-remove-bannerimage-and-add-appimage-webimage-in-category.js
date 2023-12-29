const { Sequelize } = require('sequelize')
module.exports = {
  up: async (queryInterface) => {
    {
      return queryInterface.sequelize.transaction((t) => {
        return Promise.all([
          queryInterface.removeColumn('category', 'banner_image', {
            transaction: t,
          }),
          queryInterface.addColumn('category', 'app_image', {
            type: Sequelize.DataTypes.STRING,
          }),
          queryInterface.addColumn('category', 'web_image', {
            type: Sequelize.DataTypes.STRING,
          }),
        ])
      })
    }
  },
  down: async (queryInterface) => {
    {
      return queryInterface.sequelize.transaction((t) => {
        return Promise.all([
          queryInterface.removeColumn('category', 'banner_image', {
            transaction: t,
          }),
          queryInterface.removeColumn('category', 'app_image', {
            transaction: t,
          }),
          queryInterface.removeColumn('category', 'web_image', {
            transaction: t,
          }),
        ])
      })
    }
  },
}
