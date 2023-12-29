module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable('customer', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        first_name: {
          allowNull: false,
          type: Sequelize.STRING(50),
        },
        last_name: {
          allowNull: true,
          type: Sequelize.STRING(50),
        },
        email: {
          type: Sequelize.STRING(200),
          unique: true,
        },
        password: {
          allowNull: false,
          type: Sequelize.STRING(100),
        },
        mobile: {
          allowNull: false,
          type: Sequelize.STRING(15),
        },
        image: {
          allowNull: true,
          type: Sequelize.STRING(40),
        },
        gender: {
          type: Sequelize.INTEGER,
          defaultValue: 3,
          comment: '1:male,2:female,3:others',
        },
        dob: {
          defaultValue: null,
          type: Sequelize.DATE,
        },
        is_cod_active: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: '0:no,1:yes',
        },
        otp: {
          allowNull: true,
          type: Sequelize.INTEGER,
          defaultValue: null,
        },
        reset_token: {
          defaultValue: '',
          type: Sequelize.TEXT,
        },
        reset_expiry: {
          defaultValue: null,
          type: Sequelize.DATE,
        },
        resend_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        signup_details: {
          allowNull: true,
          type: Sequelize.TEXT,
        },
        is_notify: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: '0:no,1:yes',
        },
        user_type: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment:
            '1:new_customer,2:old_customer,3:new_customer_unsuccess_order,4:retail_customer',
        },
        referrer_code: {
          type: Sequelize.STRING(50),
          unique: true,
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING(90),
          defaultValue: '',
        },
        pincode: {
          type: Sequelize.STRING(10),
          defaultValue: '',
        },
        nutricash: {
          type: Sequelize.FLOAT,
          defaultValue: 0,
        },
        status: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: '0:inactive,1:active,2:delete',
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })
      .then(() => {
        queryInterface.addIndex('customer', [
          'id',
          'first_name',
          'last_name',
          'email',
          'mobile',
          'referrer_code',
        ])
      })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('customer')
  },
}
