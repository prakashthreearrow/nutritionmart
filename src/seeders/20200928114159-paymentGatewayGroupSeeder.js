module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'payment_gateway_group',
      [
        {
          name: 'WALLETS',
          payment_method_type: 'WALLET',
          position: 3,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'UPI/BHIM',
          payment_method_type: 'UPI',
          position: 4,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'CREDIT/DEBIT CARDS',
          payment_method_type: 'CARD',
          position: 1,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'NETBANKING',
          payment_method_type: 'NB',
          position: 2,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'PAY ON DELIVERY',
          payment_method_type: 'COD',
          position: 5,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('payment_gateway_group', null, {})
  },
}
