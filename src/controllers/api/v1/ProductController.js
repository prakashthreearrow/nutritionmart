const {
  Product,
  ProductStock,
  ProductFlavors,
  ProductStockDetails,
  Customer,
  ProductImage,
  Cart,
  ProductInventory,
  Favorites,
} = require('../../../models')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const Helper = require('../../../services/Helper')
const { offer } = require('../../../transformers/api/OffersTransformer')
const { favorites } = require('../../../transformers/api/FavoritesTransformer')
const {
  product_detail,
} = require('../../../transformers/api/ProductTransformer')
const {
  ACTIVE,
  PER_PAGE,
  PRODUCT_DISPLAY_IMAGE,
  DELETE,
  SUCCESS,
  INTERNAL_SERVER,
  PRODUCT_STOCKS_DETAIL_IMAGE,
  BAD_REQUEST,
  FAIL,
} = require('../../../services/Constants')
const { favoriteProductValidation } = require('../../../services/ApiValidation')

module.exports = {
  /**
   * @description function to get list of product with flavor,stock-details and images
   * @param req
   * @param res
   */

  displayProduct: async (req, res) => {
    const requestParams = req.params
    const { authCustomerId } = req
    if (requestParams.slug) {
      await Product.findOne({
        include: [
          {
            model: ProductStock,
            attributes: ['id', 'is_default'],
            include: [
              {
                model: ProductFlavors,
                attributes: ['id', 'flavor_name'],
              },
              {
                model: ProductStockDetails,
                where: {
                  status: ACTIVE,
                },
                attributes: ['id', 'mrp_price', 'customer_price', 'size'],
              },
              {
                model: ProductImage,
                where: {
                  status: ACTIVE,
                },
                attributes: ['image', 'sort_order', 'image', 'media_type'],
              },
            ],
          },
          {
            model: Cart,
            attributes: ['id', 'quantity'],
            where: {
              customer_id: authCustomerId,
            },
            required: false,
          },
          {
            model: Favorites,
            where: {
              customer_id: authCustomerId,
              is_favorite: ACTIVE,
            },
            attributes: ['is_favorite'],
            required: false,
          },
        ],
        where: {
          slug: requestParams.slug,
          status: {
            [Op.eq]: ACTIVE,
          },
        },
        attributes: [
          'id',
          'slug',
          'name',
          'freebie',
          'discount_type',
          'discount_value',
          'description',
          'authenticity',
          'country_of_origin',
          'delivery_charge',
          'how_to_use',
          'country_of_origin',
          'ingredients',
          'return_policy',
        ],
      })
        .then(async (result) => {
          if (result) {
            await Customer.findOne({
              where: {
                id: authCustomerId,
              },
            }).then(async (results) => {
              let updateValue
              if (
                results.dataValues.recently_viewed === null ||
                results.dataValues.recently_viewed === ''
              ) {
                updateValue = result.dataValues.id
              } else {
                const idCheck = results.dataValues.recently_viewed.split(',')
                if (idCheck.indexOf(result.dataValues.id.toString()) === -1) {
                  if (idCheck.length < 8) {
                    updateValue = (
                      results.dataValues.recently_viewed +
                      ',' +
                      result.dataValues.id
                    ).toString()
                  } else {
                    idCheck.splice(0, 1)
                    const joinIds = idCheck.join()
                    updateValue = joinIds + ',' + result.dataValues.id
                  }
                } else {
                  updateValue = results.dataValues.recently_viewed
                }
              }
              console.log(updateValue)
              await Customer.update(
                { recently_viewed: updateValue },
                {
                  where: {
                    id: authCustomerId,
                  },
                }
              )
            })

            //TODOS
            Object.keys(result).forEach((key) => {
              if ({}.hasOwnProperty.call(result, key)) {
                result.rating = 0
                result.offers = []
                result.rating_and_reviews = []
              }
            })
            // if (result.dataValues.Carts) {
            //   result.in_cart = true
            // } else {
            //   result.in_cart = false
            // }
            result.dataValues.Carts
              ? (result.in_cart = true)
              : (result.in_cart = false)
            result.dataValues.Favorite
              ? (result.is_favorite = 1)
              : (result.is_favorite = 0)
            // if (result.dataValues.Favorite) {
            //   result.is_favorite = true
            // } else {
            //   result.is_favorite = false
            // }
            if (result.ingredients === null) {
              result.ingredients = []
            } else {
              result.ingredients = JSON.parse(result.ingredients)
            }
            const product_inventory = await Product.findOne({
              include: [
                {
                  model: ProductInventory,
                  where: {
                    flavor_id:
                      result.dataValues.ProductStocks[0].dataValues
                        .ProductFlavor.id,
                    product_id: result.dataValues.id,
                    status: ACTIVE,
                    total_quantity: {
                      [Op.gt]: 0,
                    },
                    expiry_date: {
                      [Op.gte]: Date.now(),
                    },
                  },
                  attributes: [
                    'id',
                    'status',
                    'product_id',
                    'total_quantity',
                    'expiry_date',
                  ],
                  order: [['expiry_date', 'DESC']],
                },
              ],
              attributes: ['id'],
            })
            if (
              product_inventory &&
              product_inventory.ProductInventories.length > 0
            ) {
              result.is_sold = false
              result.best_before = Helper.utctolocaldateWithoutDate(
                product_inventory.dataValues.ProductInventories[0].dataValues
                  .expiry_date
              )
            } else {
              result.best_before = ''
              result.is_sold = true
            }
            result.ProductStocks.map((data) => {
              Object.keys(data).forEach((key) => {
                data[key].ProductFlavor = data.ProductFlavor.flavor_name
              })
              data.ProductImages.map(
                (data) =>
                  (data.image = Helper.mediaUrlForS3(
                    PRODUCT_STOCKS_DETAIL_IMAGE,
                    data.image
                  ))
              )
            })
            const td = new Transformer.Single(result, product_detail).parse()
            return Response.successResponseData(
              res,
              td,
              SUCCESS,
              res.__('success')
            )
          } else {
            return Response.successResponseData(
              res,
              null,
              SUCCESS,
              res.locals.__('noDataFound')
            )
          }
        })
        .catch((err) => {
          Response.errorResponseWithoutData(
            res,
            res.__('internalError'),
            INTERNAL_SERVER
          )
        })
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('validSlugRequired'),
        FAIL
      )
    }
  },

  /**
   * @description function to store favorite item by customer
   * @param req
   * @param res
   */

  addFavoriteProduct: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body

    favoriteProductValidation(reqParam, res, async (validate) => {
      if (parseInt(reqParam.is_move, 10) === 0) {
        Product.findOne({
          where: {
            slug: reqParam.slug,
            status: ACTIVE,
          },
        }).then((data) => {
          if (data !== null) {
            const favoriteobj = {
              customer_id: authCustomerId,
              product_id: data.id,
              is_favorite: reqParam.is_favorite,
            }
            Favorites.findAndCountAll({
              where: { customer_id: authCustomerId, product_id: data.id },
            }).then((datas) => {
              if (datas.count === 0) {
                Favorites.create(favoriteobj).then(async (result) => {
                  if (result) {
                    Response.successResponseWithoutData(
                      res,
                      res.locals.__('success'),
                      SUCCESS
                    )
                  }
                })
              } else {
                Favorites.update(favoriteobj, {
                  where: {
                    customer_id: authCustomerId,
                    product_id: data.id,
                  },
                }).then((result) => {
                  if (result) {
                    Response.successResponseWithoutData(
                      res,
                      res.locals.__('success'),
                      SUCCESS
                    )
                  }
                  return null
                })
              }
            })
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('productNotExist'),
              FAIL
            )
          }
        })
      } else {
        Product.findOne({
          where: {
            slug: reqParam.slug,
            status: ACTIVE,
          },
        }).then((product) => {
          if (product !== null) {
            Cart.destroy({
              where: {
                id: reqParam.id,
              },
            }).then((data) => {
              if (data === 1) {
                const favoriteobj = {
                  customer_id: authCustomerId,
                  product_id: product.id,
                  is_favorite: reqParam.is_favorite,
                }
                Favorites.findAndCountAll({
                  where: {
                    customer_id: authCustomerId,
                    product_id: product.id,
                  },
                }).then((datas) => {
                  if (datas.count === 0) {
                    Favorites.create(favoriteobj).then(async (result) => {
                      if (result) {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('success'),
                          SUCCESS
                        )
                      }
                    })
                  } else {
                    Favorites.update(favoriteobj, {
                      where: {
                        customer_id: authCustomerId,
                        product_id: product.id,
                      },
                    }).then((result) => {
                      if (result) {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('success'),
                          SUCCESS
                        )
                      }
                      return null
                    })
                  }
                })
              } else {
                Response.successResponseWithoutData(
                  res,
                  res.__('ThisItemDoesNotExist'),
                  FAIL
                )
              }
            })
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('productNotExist'),
              FAIL
            )
          }
        })
      }
    })
  },

  getFavoriteProduct: async (req, res) => {
    const { authCustomerId } = req
    const requestParams = req.body
    let limit = PER_PAGE
    if (requestParams.per_page && requestParams.per_page > 0) {
      limit = parseInt(requestParams.per_page, 10)
    }
    let pageNo = 1
    if (requestParams.page && requestParams.page > 0) {
      pageNo = parseInt(requestParams.page, 10)
    }
    const offset = (pageNo - 1) * limit
    if (authCustomerId) {
      const allProductArry = await Favorites.findAndCountAll({
        include: [
          {
            model: Product,
            attributes: [
              'id',
              'name',
              'slug',
              'discount_type',
              'discount_value',
            ],
            where: {
              status: ACTIVE,
            },
            include: [
              {
                model: ProductStock,
                where: {
                  is_default: ACTIVE,
                },
                required: true,
                attributes: ['id'],
                include: [
                  {
                    model: ProductStockDetails,
                    attributes: ['mrp_price', 'customer_price', 'size'],
                    required: true,
                  },
                  {
                    model: ProductImage,
                    attributes: ['image', 'sort_order', 'image', 'media_type'],
                    required: true,
                  },
                  {
                    model: ProductFlavors,
                    attributes: ['id', 'flavor_name'],
                  },
                ],
              },
            ],
          },
        ],
        where: {
          customer_id: authCustomerId,
          is_favorite: ACTIVE,
        },
        offset: offset,
        limit: limit,
        order: [['updatedAt', 'DESC']],
      })
      for (const productItem of allProductArry.rows) {
        const product_inventory = await Product.findOne({
          include: [
            {
              model: ProductInventory,
              required: true,
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
          productItem.is_sold = false
        } else {
          productItem.is_sold = true
        }
      }
      const allProducts = allProductArry.rows
      if (allProducts.length > 0) {
        Object.keys(allProducts).forEach((key) => {
          if ({}.hasOwnProperty.call(allProducts, key)) {
            allProducts[key].is_favorite = ACTIVE
            allProducts[key].mrp_price =
              allProducts[
                key
              ].Product.ProductStocks[0].ProductStockDetails[0].mrp_price
            allProducts[key].customer_price =
              allProducts[
                key
              ].Product.ProductStocks[0].ProductStockDetails[0].customer_price

            allProducts[key].size =
              allProducts[
                key
              ].Product.ProductStocks[0].ProductStockDetails[0].size
            allProducts[key].display_image = Helper.mediaUrlForS3(
              PRODUCT_STOCKS_DETAIL_IMAGE,
              allProducts[key].Product.ProductStocks[0].ProductImages[0].image
            )
            allProducts[key].name = allProducts[key].Product.name
            allProducts[key].slug = allProducts[key].Product.slug
            allProducts[key].discount_type =
              allProducts[key].Product.discount_type
            allProducts[key].discount_value =
              allProducts[key].Product.discount_value
          }
        })
        const transformeddata = new Transformer.List(
          allProducts,
          favorites
        ).parse()
        const extra = []
        extra.per_page = limit
        extra.total = allProductArry.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          transformeddata,
          SUCCESS,
          res.locals.__('success'),
          extra
        )
      } else {
        return Response.successResponseData(
          res,
          [],
          SUCCESS,
          res.locals.__('noDataFound')
        )
      }
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseLoginFirst'),
        FAIL
      )
    }
  },
}
