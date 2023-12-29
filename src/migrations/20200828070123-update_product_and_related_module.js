const { Sequelize } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('product', 'description', {
          type: Sequelize.TEXT,
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product', 'return_policy', {
          type: Sequelize.TEXT,
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product', 'how_to_use', {
          type: Sequelize.TEXT,
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product', 'delivery_charge', {
          type: Sequelize.FLOAT,
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'sku', {
          type: Sequelize.DataTypes.STRING(30),
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'upc_code', {
          type: Sequelize.STRING(40),
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'size', {
          type: Sequelize.STRING(50),
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'serving_day', {
          type: Sequelize.INTEGER,
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'mrp_price', {
          type: Sequelize.FLOAT(10, 2),
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'customer_price', {
          type: Sequelize.FLOAT(10, 2),
          allowNull: true,
          transaction: t,
        }),
        queryInterface.changeColumn('product_stock_details', 'quantity', {
          type: Sequelize.INTEGER,
          allowNull: true,
          transaction: t,
        }),
      ])
    })
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('product', 'description', {
          transaction: t,
        }),
        queryInterface.removeColumn('product', 'return_policy', {
          transaction: t,
        }),
        queryInterface.removeColumn('product', 'how_to_use', {
          transaction: t,
        }),
        queryInterface.removeColumn('product', 'delivery_charge', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'sku', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'upc_code', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'size', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'serving_day', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'mrp_price', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'customer_price', {
          transaction: t,
        }),
        queryInterface.removeColumn('product_stock_details', 'quantity', {
          transaction: t,
        }),
      ])
    })
  },
}
