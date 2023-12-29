module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn(
        'customer',
        'new_mobile',
        {
          allowNull: true,
          type: Sequelize.STRING(15),
        },
        { transaction }
      )
      await queryInterface.addColumn(
        'customer',
        'last_otp_sent',
        {
          type: Sequelize.BIGINT,
          defaultValue: 0,
          comment: 'timestamp',
        },
        { transaction }
      )
      await queryInterface.changeColumn(
        'customer',
        'status',
        {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: '0-inactive, 1-active, 2-deleted ,4-unverify',
        },
        { transaction }
      )

      await transaction.commit()
      return Promise.resolve()
    } catch (err) {
      if (transaction) {
        await transaction.rollback()
      }
      return Promise.reject(err)
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn('customer', 'new_mobile', {
        transaction,
      })
      await queryInterface.removeColumn('customer', 'last_otp_sent', {
        transaction,
      })
      await queryInterface.removeColumn('customer', 'status', {
        transaction,
      })
      await transaction.commit()
      return Promise.resolve()
    } catch (err) {
      if (transaction) {
        await transaction.rollback()
      }
      return Promise.reject(err)
    }
  },
}
