const Transformer = require('object-transformer')
const {
  fetureCategory,
  fetureCategoryItem,
} = require('../../../transformers/api/FetureCategoryTransformer')
const {
  ACTIVE,
  PRODUCT_STOCKS_DETAIL_IMAGE,
  SUCCESS,
  PER_PAGE,
  HOME_PER_PAGE,
  FEATURED_CATEGORIES_IMAGE,
} = require('../../../services/Constants')
const Response = require('../../../services/Response')
const {
  Product,
  Favorites,
  ProductStockDetails,
  ProductStock,
  ProductFlavors,
  ProductInventory,
  FeatureCategoryProduct,
  FeatureCategory,
  ProductImage,
} = require('../../../models')
const { Op } = require('sequelize')
const Helper = require('../../../services/Helper')
const Constants = require('../../../services/Constants')

module.exports = {
  fixFetureCategory: async (req, res) => {
    const { authCustomerId } = req
    const category = await FeatureCategory.findAll({
      include: [
        {
          model: FeatureCategoryProduct,
          // limit: HOME_PER_PAGE,
          required: true,
          where: {
            status: ACTIVE,
          },
          attributes: ['product_id'],
          include: {
            model: Product,
            required: true,
            where: {
              status: ACTIVE,
            },
            attributes: [
              'id',
              'name',
              'slug',
              'discount_type',
              'discount_value',
            ],
            include: [
              {
                model: ProductStock,
                required: true,
                where: {
                  is_default: ACTIVE,
                },
                attributes: ['id'],
                include: [
                  {
                    model: ProductImage,
                    attributes: ['image', 'sort_order', 'image', 'media_type'],
                    required: true,
                  },
                  {
                    model: ProductFlavors,
                    attributes: ['id', 'flavor_name'],
                    required: true,
                  },
                  {
                    model: ProductStockDetails,
                    attributes: ['mrp_price', 'customer_price', 'size'],
                    required: true,
                  },
                ],
              },
              {
                model: Favorites,
                required: false,
                where: {
                  customer_id: authCustomerId,
                  is_favorite: ACTIVE,
                },
                attributes: ['is_favorite'],
              },
            ],
          },
        },
      ],
      where: {
        status: ACTIVE,
        end_date: {
          [Op.gte]: Date.now(),
        },
      },
      order: [[FeatureCategoryProduct, Product, 'createdAt', 'DESC']],
      attributes: ['name', 'slug', 'start_date', 'end_date', 'image'],
    })

    const td = new Transformer.List(category, fetureCategory).parse()

    Object.keys(td).forEach(async (key) => {
      if ({}.hasOwnProperty.call(td, key)) {
        td[key].start_date = Helper.utctolocaldate(td[key].start_date)
        td[key].image = Helper.mediaUrlForS3(
          FEATURED_CATEGORIES_IMAGE,
          category[key].image
        )
        td[key].end_date = Helper.utctolocaldate(td[key].end_date)
        td[key].FeatureCategoryProducts.map(async (data) => {
          data.Product.dataValues.rating = 0

          if (data.Product.Favorite !== null) {
            data.Product.dataValues.is_favorite =
              data.Product.Favorite.is_favorite
          } else {
            data.Product.dataValues.is_favorite = 0
          }
          data.Product.dataValues.productFlavor =
            data.Product.ProductStocks[0].ProductFlavor.flavor_name
          data.Product.dataValues.mrp_price =
            data.Product.ProductStocks[0].ProductStockDetails[0].mrp_price
          data.Product.dataValues.customer_price =
            data.Product.ProductStocks[0].ProductStockDetails[0].customer_price
          data.Product.dataValues.size =
            data.Product.ProductStocks[0].ProductStockDetails[0].size
          data.Product.dataValues.productImage = Helper.mediaUrlForS3(
            PRODUCT_STOCKS_DETAIL_IMAGE,
            data.Product.ProductStocks[0].ProductImages[0].image
          )
          data.dataValues = new Transformer.Single(
            data.dataValues.Product.dataValues,
            fetureCategoryItem
          ).parse()
        })
      }
    })
    for (let category of td) {
      for (let product of category.FeatureCategoryProducts) {
        await Product.findOne({
          include: [
            {
              model: ProductInventory,
              required: true,
              where: {
                flavor_id: product.Product.ProductStocks[0].ProductFlavor.id,
                product_id: product.Product.dataValues.id,
                status: ACTIVE,
                total_quantity: {
                  [Op.gt]: 0,
                },
                expiry_date: {
                  [Op.gte]: Date.now(),
                },
              },
            },
          ],
          attributes: ['id'],
        }).then(async (datas) => {
          if (datas && datas.ProductInventories.length > 0) {
            product.dataValues.is_sold = false
          } else {
            product.dataValues.is_sold = true
          }
        })
      }
    }
    return td
  },
  fixFetureCategoryProduct: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body,
      productArray = []
    let limit = PER_PAGE
    if (reqParam.per_page && reqParam.per_page > 0) {
      limit = parseInt(reqParam.per_page, 10)
    }
    let pageNo = 1
    if (reqParam.page && reqParam.page > 0) {
      pageNo = parseInt(reqParam.page, 10)
    }
    const offset = (pageNo - 1) * limit
    let query = {
      status: ACTIVE,
      slug: reqParam.slug,
      end_date: {
        [Op.gte]: Date.now(),
      },
    }
    const cartegoryProducts = await FeatureCategory.findOne({
      include: [
        {
          model: FeatureCategoryProduct,
          attributes: ['product_id'],
          where: {
            status: ACTIVE,
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: Product,
              where: {
                status: ACTIVE,
              },
              attributes: [
                'id',
                'name',
                'slug',
                'discount_type',
                'discount_value',
              ],
              include: [
                {
                  model: ProductStock,
                  required: true,
                  where: {
                    is_default: ACTIVE,
                  },
                  attributes: ['id'],
                  include: [
                    {
                      model: ProductImage,
                      attributes: [
                        'image',
                        'sort_order',
                        'image',
                        'media_type',
                      ],
                      required: true,
                    },
                    {
                      model: ProductFlavors,
                      attributes: ['id', 'flavor_name'],
                      // required:true
                    },
                    {
                      model: ProductStockDetails,
                      attributes: ['mrp_price', 'customer_price', 'size'],
                      required: true,
                    },
                  ],
                },
                {
                  model: Favorites,
                  required: false,
                  where: {
                    customer_id: authCustomerId,
                    is_favorite: ACTIVE,
                  },
                  attributes: ['is_favorite'],
                },
              ],
            },
          ],
        },
      ],
      where: query,
      attributes: ['slug'],
    })
    if (cartegoryProducts) {
      const td = new Transformer.Single(
        cartegoryProducts,
        fetureCategory
      ).parse()
      for (const productItem of td.FeatureCategoryProducts) {
        const product_inventory = await Product.findOne({
          include: [
            {
              model: ProductInventory,
              where: {
                flavor_id:
                  productItem.Product.ProductStocks[0].ProductFlavor.id,
                product_id: productItem.Product.id,
                status: ACTIVE,
                total_quantity: {
                  [Op.gt]: 0,
                },
                expiry_date: {
                  [Op.gte]: Date.now(),
                },
              },
              required: true,
              attributes: [
                'id',
                'status',
                'product_id',
                'total_quantity',
                'expiry_date',
              ],
            },
          ],
          attributes: ['id'],
        })

        if (
          product_inventory &&
          product_inventory.ProductInventories.length > 0
        ) {
          productItem.dataValues.Product.dataValues.is_sold = false
        } else {
          productItem.dataValues.Product.dataValues.is_sold = true
        }
      }
      td.FeatureCategoryProducts.map((data) => {
        data.Product.dataValues.rating = 0
        if (data.Product.Favorite !== null) {
          data.Product.dataValues.is_favorite =
            data.Product.Favorite.is_favorite
        } else {
          data.Product.dataValues.is_favorite = 0
        }
        data.Product.dataValues.productFlavor =
          data.Product.ProductStocks[0].ProductFlavor.flavor_name
        data.Product.dataValues.mrp_price =
          data.Product.ProductStocks[0].ProductStockDetails[0].mrp_price
        data.Product.dataValues.customer_price =
          data.Product.ProductStocks[0].ProductStockDetails[0].customer_price
        data.Product.dataValues.size =
          data.Product.ProductStocks[0].ProductStockDetails[0].size
        data.Product.dataValues.display_image = Helper.mediaUrlForS3(
          PRODUCT_STOCKS_DETAIL_IMAGE,
          data.Product.ProductStocks[0].ProductImages[0].image
        )
        data.dataValues = new Transformer.Single(
          data.dataValues.Product.dataValues,
          fetureCategoryItem
        ).parse()
        productArray.push(data.dataValues)
      })
      const extra = []
      extra.per_page = limit
      //TODO
      // extra.total = productArray.length
      extra.page = pageNo
      return Response.successResponseData(
        res,
        productArray,
        SUCCESS,
        res.locals.__('success'),
        extra
      )
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidSlug'),
        Constants.FAIL
      )
    }
  },
}
