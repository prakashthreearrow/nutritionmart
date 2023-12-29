const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.hasMany(models.ProductInventory, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })
      Product.hasOne(models.Category, {
        sourceKey: 'category_id',
        foreignKey: 'id',
      })

      Product.hasOne(models.Category, {
        as: 'sub-category',
        sourceKey: 'id',
        foreignKey: 'parent_id',
      })

      Product.hasOne(models.Brand, {
        sourceKey: 'brand_id',
        foreignKey: 'id',
      })
      Product.hasMany(models.Cart, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })

      Product.hasMany(models.ProductStock, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })

      Product.hasMany(models.ProductViewCount, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })
      Product.hasOne(models.Favorites, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })
    }
  }
  Product.init(
    {
      name: DataTypes.STRING(200),
      slug: DataTypes.STRING(250),
      category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Category',
          key: 'id',
        },
      },
      sub_category_id: {
        type: DataTypes.INTEGER,
      },
      brand_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Brand',
          key: 'id',
        },
      },
      description: DataTypes.TEXT,
      authenticity: DataTypes.TEXT,
      country_of_origin: DataTypes.STRING(255),
      return_policy: DataTypes.TEXT,
      ingredients: {
        type: DataTypes.TEXT,
      },
      how_to_use: DataTypes.TEXT,
      tax: DataTypes.FLOAT,
      hsn: DataTypes.STRING(15),
      freebie: DataTypes.TEXT,
      specification_details: {
        type: DataTypes.TEXT,
        comment: '1:key,2:value',
      },
      food_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:none,1:veg,2:non-veg',
      },
      is_cod: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:available,2:non-available',
      },
      delivery_charge: DataTypes.FLOAT,
      meta_title: DataTypes.STRING(255),
      meta_description: DataTypes.STRING(255),
      meta_keyword: DataTypes.STRING(255),
      discount_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:nutricash,2:percent',
      },
      discount_value: DataTypes.INTEGER,
      in_stock: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:no,2:yes',
      },
      brand_sort_order: {
        type: DataTypes.INTEGER,
      },
      category_sort_order: {
        type: DataTypes.INTEGER,
      },
      display_image: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'product',
      timestamps: true,
    }
  )
  return Product
}
