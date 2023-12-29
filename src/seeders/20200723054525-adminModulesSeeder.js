const Constants = require('../services/Constants')

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert('admin_module', [
      {
        name: 'Dashboard',
        slug: 'dashboard',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Vendor',
        slug: 'vendor',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Customer',
        slug: 'customer',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Brands',
        slug: 'brand',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Product Categories',
        slug: 'product_category',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Products',
        slug: 'products',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Inventory',
        slug: 'inventory',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Orders',
        slug: 'orders',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Offers',
        slug: 'offers',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Manage Refunds',
        slug: 'refunds',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },
  down: (queryInterface) => {
    return queryInterface.bulkDelete('admin_module', null, {})
  },
}
