module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'category',
          key: 'id',
        },
        allowNull: true,
      },
      sub_category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'category',
          key: 'id',
        },
        allowNull: true,
      },
      brand_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'brand',
          key: 'id',
        },
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      authenticity: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country_of_origin: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      return_policy: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ingredients: {
        type: Sequelize.TEXT,
        comment: '1:tag1,2:tag2',
        allowNull: true,
      },
      how_to_use: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tax: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      hsn: {
        type: Sequelize.STRING(15),
        allowNull: true,
        defaultValue: '',
      },
      freebie: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '',
      },
      specification_details: {
        type: Sequelize.TEXT,
        comment: '1:key,2:value',
        allowNull: true,
      },
      food_type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '0:none,1:veg,2:non-veg',
        allowNull: true,
      },
      is_cod: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:available,2:non-available',
        allowNull: true,
      },
      delivery_charge: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      meta_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      meta_description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      meta_keyword: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      discount_type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:nutricash,2:percent',
        allowNull: true,
      },
      discount_value: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      in_stock: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:no,2:yes',
        allowNull: false,
      },
      brand_sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      category_sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      display_image: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete,3:pending',
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
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('product')
  },
}
