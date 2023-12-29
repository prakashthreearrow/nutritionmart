const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const constant = require('../../../services/Constants')
const Helper = require('../../../services/Helper')
const { CartValidations } = require('../../../services/ApiValidation')
const {
  Cart,
  Product,
  ProductFlavors,
  ProductInventory,
  ProductImage,
  ProductStock,
  Offers,
  ProductStockDetails,
} = require('../../../models')
const Constants = require('../../../services/Constants')
const { cart_product } = require('../../../transformers/api/CartTransformer')

module.exports = {
  addProductToCart: async (req, res) => {
    const reqParams = req.body
    const { authCustomerId } = req
    if (authCustomerId) {
      CartValidations(reqParams, res, async (validate) => {
        if (validate) {
          const productStateCheck = await Product.findOne({
            include: [
              {
                model: ProductStock,
                where: {
                  id: reqParams.product_stock_id,
                },
                attributes: ['id'],
                include: {
                  model: ProductStockDetails,
                  where: {
                    id: reqParams.product_stock_detail_id,
                  },
                },
              },
            ],
            where: {
              slug: reqParams.slug,
              status: constant.ACTIVE,
            },
          })
          if (productStateCheck && productStateCheck.ProductStocks !== []) {
            const cartObj = {
              customer_id: authCustomerId,
              product_id: productStateCheck.dataValues.id,
              product_stock_id: reqParams.product_stock_id,
              product_stock_detail_id: reqParams.product_stock_detail_id,
              quantity: reqParams.quantity,
            }
            const cartItem = await Cart.findOne({
              where: {
                customer_id: authCustomerId,
                product_id: productStateCheck.dataValues.id,
                product_stock_id: reqParams.product_stock_id,
                product_stock_detail_id: reqParams.product_stock_detail_id,
              },
            })
            if (cartItem) {
              await Cart.update(cartObj, {
                where: {
                  customer_id: authCustomerId,
                  product_id: productStateCheck.dataValues.id,
                  product_stock_id: reqParams.product_stock_id,
                  product_stock_detail_id: reqParams.product_stock_detail_id,
                },
              })
            } else {
              await Cart.create(cartObj)
            }
            const CartItems = await Cart.findOne({
              include: [
                {
                  model: Product,
                  where: {
                    status: constant.ACTIVE,
                  },
                  include: [
                    {
                      model: ProductStock,
                      required: true,
                      where: {
                        is_default: constant.ACTIVE,
                      },
                      attributes: ['id'],
                      include: [
                        {
                          model: ProductFlavors,
                          attributes: ['id', 'flavor_name'],
                          // required:true
                        },
                        {
                          model: ProductStockDetails,
                          attributes: [
                            'id',
                            'mrp_price',
                            'customer_price',
                            'size',
                          ],
                          required: true,
                        },
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
                      ],
                    },
                  ],
                  attributes: ['id', 'name', 'slug', 'freebie'],
                },
              ],
              where: {
                customer_id: authCustomerId,
                product_id: productStateCheck.dataValues.id,
                product_stock_id: reqParams.product_stock_id,
                product_stock_detail_id: reqParams.product_stock_detail_id,
              },
              attributes: ['id', 'quantity'],
            })
            CartItems.dataValues.name = CartItems.dataValues.Product.name
            CartItems.dataValues.flavor_id =
              CartItems.dataValues.Product.ProductStocks[0].ProductFlavor.id

            CartItems.dataValues.product_stock_detail_id =
              CartItems.dataValues.Product.ProductStocks[0].dataValues.ProductStockDetails[0].dataValues.id
            CartItems.dataValues.product_stock_id =
              CartItems.dataValues.Product.ProductStocks[0].dataValues.id

            CartItems.dataValues.product_id = CartItems.dataValues.Product.id
            CartItems.dataValues.slug = CartItems.dataValues.Product.slug
            CartItems.dataValues.freebie = CartItems.dataValues.Product.freebie
            CartItems.dataValues.flavor_name =
              CartItems.dataValues.Product.ProductStocks[0].ProductFlavor.flavor_name
            CartItems.dataValues.mrp_price =
              CartItems.dataValues.Product.ProductStocks[0].ProductStockDetails[0].mrp_price
            CartItems.dataValues.customer_price =
              CartItems.dataValues.Product.ProductStocks[0].ProductStockDetails[0].customer_price
            CartItems.dataValues.size =
              CartItems.dataValues.Product.ProductStocks[0].ProductStockDetails[0].size
            CartItems.dataValues.display_image = Helper.mediaUrlForS3(
              constant.PRODUCT_STOCKS_DETAIL_IMAGE,
              CartItems.dataValues.Product.ProductStocks[0].ProductImages[0]
                .image
            )

            const bulkOffer = await Offers.findAll({
              where: {
                offer_type: 1,
                end_date: {
                  [Op.gte]: Date.now(),
                },
              },
              attributes: ['product_id', 'bulk_product_number'],
            })
            if (bulkOffer.length > 0) {
              for (let a of bulkOffer) {
                a.dataValues.productid = a.dataValues.product_id.split(',')
                if (
                  a.dataValues.productid.includes(
                    CartItems.Product.id.toString()
                  )
                ) {
                  CartItems.dataValues.bulk_quantity_offer = true
                  CartItems.dataValues.bulk_quantity_offer_value = JSON.parse(
                    a.dataValues.bulk_product_number
                  )
                } else {
                  CartItems.dataValues.bulk_quantity_offer = false
                  CartItems.dataValues.bulk_quantity_offer_value = []
                }
              }
            }
            const product_inventory = await Product.findOne({
              include: [
                {
                  model: ProductInventory,
                  where: {
                    flavor_id: CartItems.dataValues.flavor_id,
                    product_id: CartItems.dataValues.product_id,
                    status: constant.ACTIVE,
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
              CartItems.dataValues.is_sold = false

              CartItems.dataValues.best_before = Helper.utctolocaldateWithoutDate(
                product_inventory.dataValues.ProductInventories[0].dataValues
                  .expiry_date
              )
            } else {
              CartItems.dataValues.is_sold = true
              CartItems.dataValues.best_before = ''
            }
            delete CartItems.dataValues.flavor_id
            CartItems.dataValues = new Transformer.Single(
              CartItems.dataValues,
              cart_product
            ).parse()

            Response.successResponseData(
              res,
              CartItems,
              constant.SUCCESS,
              res.locals.__('CartAddedSuccessfully')
            )
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('pleaseEnterValidProduct'),
              constant.FAIL
            )
          }
        }
      })
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseLoginFirst'),
        constant.FAIL
      )
    }
  },
  deleteProductInCart: async (req, res) => {
    const reqParams = req.body
    const { authCustomerId } = req
    Cart.destroy({
      where: {
        customer_id: authCustomerId,
        id: reqParams.id,
      },
    }).then((data) => {
      if (data === 1) {
        Response.successResponseWithoutData(
          res,
          res.__('ItemDeletedSuccessFully'),
          Constants.SUCCESS
        )
      } else {
        Response.successResponseWithoutData(
          res,
          res.__('ThisItemDoesNotExist'),
          Constants.FAIL
        )
      }
    })
  },
  getCart: async (req, res) => {
    const reqParams = req.body
    let limit = constant.PER_PAGE
    const { authCustomerId } = req
    if (authCustomerId) {
      if (reqParams.per_page && reqParams.per_page > 0) {
        limit = parseInt(reqParams.per_page, 10)
      }
      let pageNo = 1
      if (reqParams.page && reqParams.page > 0) {
        pageNo = parseInt(reqParams.page, 10)
      }
      const offset = (pageNo - 1) * limit
      const CartItems = await Cart.findAndCountAll({
        include: [
          {
            model: Product,
            where: {
              status: constant.ACTIVE,
            },
            include: [
              {
                model: ProductStock,
                required: true,
                where: {
                  is_default: constant.ACTIVE,
                },
                attributes: ['id'],
                include: [
                  {
                    model: ProductFlavors,
                    attributes: ['id', 'flavor_name'],
                    // required:true
                  },
                  {
                    model: ProductStockDetails,
                    attributes: ['id', 'mrp_price', 'customer_price', 'size'],
                    required: true,
                  },
                  {
                    model: ProductImage,
                    attributes: ['image', 'sort_order', 'image', 'media_type'],
                    required: true,
                  },
                ],
              },
            ],
            attributes: ['id', 'name', 'slug', 'freebie'],
          },
        ],
        where: {
          customer_id: authCustomerId,
        },
        offset: offset,
        distinct: true,
        limit: limit,
        attributes: ['id', 'quantity'],
      })
      const datass = CartItems.rows
      Object.keys(datass).forEach(async (key) => {
        if ({}.hasOwnProperty.call(datass, key)) {
          datass[key].dataValues.name = datass[key].dataValues.Product.name
          datass[key].dataValues.flavor_id =
            datass[key].dataValues.Product.ProductStocks[0].ProductFlavor.id

          datass[key].dataValues.product_stock_detail_id =
            datass[
              key
            ].dataValues.Product.ProductStocks[0].dataValues.ProductStockDetails[0].dataValues.id
          datass[key].dataValues.product_stock_id =
            datass[key].dataValues.Product.ProductStocks[0].dataValues.id

          datass[key].dataValues.product_id = datass[key].dataValues.Product.id
          datass[key].dataValues.slug = datass[key].dataValues.Product.slug
          datass[key].dataValues.freebie =
            datass[key].dataValues.Product.freebie
          datass[key].dataValues.flavor_name =
            datass[
              key
            ].dataValues.Product.ProductStocks[0].ProductFlavor.flavor_name
          datass[key].dataValues.mrp_price =
            datass[
              key
            ].dataValues.Product.ProductStocks[0].ProductStockDetails[0].mrp_price
          datass[key].dataValues.customer_price =
            datass[
              key
            ].dataValues.Product.ProductStocks[0].ProductStockDetails[0].customer_price
          datass[key].dataValues.size =
            datass[
              key
            ].dataValues.Product.ProductStocks[0].ProductStockDetails[0].size
          datass[key].dataValues.display_image = Helper.mediaUrlForS3(
            constant.PRODUCT_STOCKS_DETAIL_IMAGE,
            datass[key].dataValues.Product.ProductStocks[0].ProductImages[0]
              .image
          )
          datass[key].dataValues = new Transformer.Single(
            datass[key].dataValues,
            cart_product
          ).parse()
        }
      })

      const bulkOffer = await Offers.findAll({
        where: {
          offer_type: 1,
          end_date: {
            [Op.gte]: Date.now(),
          },
        },
        attributes: ['product_id', 'bulk_product_number'],
      })
      if (bulkOffer.length > 0) {
        for (let a of bulkOffer) {
          for (let productId of datass) {
            a.dataValues.productid = a.dataValues.product_id.split(',')
            if (
              a.dataValues.productid.includes(productId.Product.id.toString())
            ) {
              productId.dataValues.bulk_quantity_offer = true
              productId.dataValues.bulk_quantity_offer_value = JSON.parse(
                a.dataValues.bulk_product_number
              )
            } else {
              productId.dataValues.bulk_quantity_offer = false
              productId.dataValues.bulk_quantity_offer_value = []
            }
          }
        }
      }

      for (const productItem of datass) {
        const product_inventory = await Product.findOne({
          include: [
            {
              model: ProductInventory,
              where: {
                flavor_id: productItem.dataValues.flavor_id,
                product_id: productItem.dataValues.id,
                status: constant.ACTIVE,
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
          productItem.dataValues.is_sold = false

          productItem.dataValues.best_before = Helper.utctolocaldateWithoutDate(
            product_inventory.dataValues.ProductInventories[0].dataValues
              .expiry_date
          )
        } else {
          productItem.dataValues.is_sold = true

          productItem.dataValues.best_before = ''
        }
        delete productItem.dataValues.flavor_id
      }

      const extra = []
      extra.per_page = limit
      extra.total = CartItems.count
      extra.page = pageNo
      return Response.successResponseData(
        res,
        datass,
        constant.SUCCESS,
        res.locals.__('success'),
        extra
      )
    } else {
      return Response.successResponseData(
        res,
        [],
        constant.SUCCESS,
        res.locals.__('noDataFound')
      )
    }
  },
  async totalCartPrice(prodcutArry) {
    prodcutArry.map((product) => {
      // product.totalTax = product.price
      product.totalPriceWithQuantity = product.quantity * product.mrp_price
      product.productTax = (product.totalPriceWithQuantity * product.tax) / 100
      product.productSubTotal =
        product.totalPriceWithQuantity +
        product.delivery_charge +
        product.productTax
    })
    return prodcutArry
  },
  getCartTotal: async (req, res) => {
    const abc = module.exports
      .totalCartPrice([
        { quantity: 1, mrp_price: 200, tax: 10, delivery_charge: 10 },
        { quantity: 2, mrp_price: 100, tax: 10, delivery_charge: 100 },
      ])
      .then((data) => {
        res.send(data)
      })
  },

  /*CartTotal: async () => {
    // TODO Cart total functionality
    return await module.exports.totalCartPrice([
      { quantity: 1, mrp_price: 200.15, tax: 10, delivery_charge: 10 },
      { quantity: 2, mrp_price: 100, tax: 10, delivery_charge: 100 },
    ])
  },

  addRemoveNutricash: async (req, res) => {
    const totalCart = await module.exports.CartTotal()
    const { authCustomerId } = req
    let availableNutricash = 0
    const reqParams = req.body

    await CustomerWallet.findAndCountAll({
      where: {
        customer_id: authCustomerId,
      },
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        let totalAmount = 0
        let expiredNutricash = 0
        let usedNutricash = 0

        result.forEach((raw) => {
          totalAmount += raw.amount
          // expired
          raw.order_id = raw.order_id ? raw.order_id : ''
          raw.expiry = raw.expiry ? raw.expiry : ''
          if (raw.expiry && raw.expiry < new Date()) {
            expiredNutricash += raw.amount
          }
          // used cash
          if (
            raw.transaction_type === Constants.WALLET_REMOVE_BY_ADMIN ||
            raw.transaction_type === Constants.WALLET_PURCHASE
          ) {
            usedNutricash += raw.amount
          }
        })
        availableNutricash =
          totalAmount - (expiredNutricash + usedNutricash) < 0
            ? 0
            : totalAmount - (expiredNutricash + usedNutricash)
      }
    })
    if (reqParams.wallet_amount > availableNutricash) {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('invalidAmount'),
        Constants.FAIL
      )
    }
    let finalTotalAmount = {}
    let total = 0
    totalCart.forEach((item) => {
      total += item.productSubTotal
    })
    if (reqParams.wallet_amount > 0 && availableNutricash > 0) {
      finalTotalAmount.final_amount =
        Number(total) - Number(reqParams.wallet_amount)
    } else finalTotalAmount.final_amount = total
    return Response.successResponseData(
      res,
      finalTotalAmount,
      Constants.SUCCESS,
      res.locals.__('success')
    )
  },*/
}
