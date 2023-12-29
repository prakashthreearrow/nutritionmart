module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'config',
      [
        {
          penalty_for_late_dispatch: 20.5,
          penalty_for_flavor_change: 15.9,
          nutricash_expiry_days: 7,
          promo_message:
            'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,',
          refer_earn_type: 1,
          refer_earn_value: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('config', null, {})
  },
}
