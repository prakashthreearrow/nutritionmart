const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const slugify = require('slugify')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const ProductController = require('../admin/ProductController')
const {
  searchList,
  inventoryList,
  inventoryLogList,
  outOfStockProductInventoryList,
} = require('../../transformers/admin/ProductInventoryTransformer')
const {
  productInventoryUpdateStatusValidation,
  addProductInventoryValidation,
  deductProductInventoryValidation,
  addScanProductValidation,
} = require('../../services/AdminValidation')
const {
  ProductStockDetails,
  Product,
  ProductStock,
  ProductFlavors,
  ProductInventory,
  ProductInventoryLog,
  sequelize,
} = require('../../models')

module.exports = {
  /**
   * @description function to get search product inventory
   * @param req
   * @param res
   */
  productInventorySearch: async (req, res) => {
    const requestParams = req.query
    const search = requestParams.search ? requestParams.search : undefined
    const productId = requestParams.product_id
      ? requestParams.product_id
      : undefined
    const stockId = requestParams.stock_id ? requestParams.stock_id : undefined

    let query = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }
    if (search) {
      query = {
        ...query,
        [Op.or]: {
          upc_code: {
            [Op.like]: `%${search}%`,
          },
          sku: {
            [Op.like]: `%${search}%`,
          },
          '$Product.name$': {
            [Op.like]: `%${search}%`,
          },
          '$Product.slug$': {
            [Op.like]: `%${search}%`,
          },
        },
      }
    }

    if (productId) {
      query = {
        ...query,
        product_id: productId,
      }
    }

    if (stockId) {
      query = {
        ...query,
        product_stock_id: stockId,
      }
    }

    await ProductStockDetails.findAndCountAll({
      include: [
        {
          model: Product,
          where: {
            status: {
              [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
            },
          },
          required: false,
        },
        {
          model: ProductInventory,
          attributes: [
            'id',
            'total_quantity',
            'batch_no',
            'flavor_id',
            'expiry_date',
          ],
          where: {
            status: Constants.ACTIVE,
          },
          required: false,
        },
        {
          model: ProductStock,
          include: {
            model: ProductFlavors,
            attributes: ['id', 'flavor_name'],
          },
          required: false,
        },
      ],
      where: query,
      order: [['updatedAt', 'DESC']],
      distinct: true,
      subQuery: false,
    })
      .then(async (data) => {
        if (data.rows && data.rows.length > 0) {
          const responseData = []
          const result = data.rows
          let deduct_info = []

          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              if (result[key].ProductInventories) {
                deduct_info = result[key].ProductInventories
              }

              if (result[key].ProductStock) {
                responseData.push({
                  product_id: result[key].ProductStock.product_id,
                  stock_id: result[key].product_stock_id,
                  stock_detail_id: result[key].id,
                  upc_code: result[key].upc_code,
                  size: result[key].size,
                  deduct_info: deduct_info,
                  product_name: result[key].Product
                    ? result[key].Product.name
                    : '',
                  flavor_id:
                    result[key].ProductStock &&
                    result[key].ProductStock.ProductFlavor
                      ? result[key].ProductStock.ProductFlavor.id
                      : 0,
                  flavor_name:
                    result[key].ProductStock &&
                    result[key].ProductStock.ProductFlavor
                      ? result[key].ProductStock.ProductFlavor.flavor_name
                      : 0,
                })
              }
            }
          })

          return Response.successResponseData(
            res,
            new Transformer.List(responseData, searchList).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            {}
          )
        } else {
          return Response.successResponseData(
            res,
            [],
            Constants.SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description function to get list of product inventory
   * @param req
   * @param res
   */
  productInventoryList: async (req, res) => {
    const requestParams = req.query
    let search = false
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : Constants.PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit

    const query = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }
    let searchQuery = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }
    if (requestParams.search && requestParams.search !== '') {
      search = true
      searchQuery = {
        ...searchQuery,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }
    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    ProductInventory.findAndCountAll({
      attributes: ['id', 'total_quantity', 'expiry_date', 'status'],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug'],
          where: searchQuery,
        },
        {
          model: ProductFlavors,
          attributes: ['id', 'flavor_name'],
        },
        {
          model: ProductStockDetails,
          attributes: ['id', 'mrp_price'],
        },
      ],
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              result[key].product_id = result[key].Product.id
              result[key].product_name = result[key].Product.name
              result[key].slug = result[key].Product.slug
              result[key].flavor_id = result[key].ProductFlavor.id
              result[key].flavor_name = result[key].ProductFlavor.flavor_name
              result[key].mrp = result[key].ProductStockDetail
                ? result[key].ProductStockDetail.mrp_price
                : ''
              result[key].qty_blocked = 0 // TODO as per discussion will do after complete order module
              result[key].qty_available = result[key].total_quantity
            }
          })
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, inventoryList).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            extra
          )
        } else {
          return Response.successResponseData(
            res,
            [],
            Constants.SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
      .catch((e) => {
        console.log('e', e)
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description 'Change the status of product inventory'
   * @param req
   * @param res
   */
  productInventoryUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    productInventoryUpdateStatusValidation(
      requestParams,
      res,
      async (validate) => {
        if (validate) {
          await ProductInventory.findOne({
            where: {
              id: requestParams.id,
            },
          })
            .then(async (inventoryData) => {
              if (inventoryData) {
                // eslint-disable-next-line no-param-reassign
                inventoryData.status = requestParams.status
                inventoryData
                  .save()
                  .then((result) => {
                    if (result) {
                      if (
                        parseInt(requestParams.status, 10) === Constants.ACTIVE
                      ) {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('productInventoryStatusActivated'),
                          Constants.SUCCESS
                        )
                      } else {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('productInventoryStatusDeactivated'),
                          Constants.SUCCESS
                        )
                      }
                    }
                  })
                  .catch(() => {
                    Response.errorResponseData(
                      res,
                      res.__('internalError'),
                      Constants.INTERNAL_SERVER
                    )
                  })
              } else {
                return Response.successResponseWithoutData(
                  res,
                  res.locals.__('noDataFound'),
                  Constants.SUCCESS
                )
              }
              return null
            })
            .catch(() => {
              Response.errorResponseData(
                res,
                res.__('internalError'),
                Constants.INTERNAL_SERVER
              )
            })
        }
      }
    )
  },

  productInventoryLogList: async (req, res) => {
    const { logType } = req.params
    const { partyName } = req.query
    if (!['1', '2'].includes(logType)) {
      return Response.errorResponseData(res, res.locals.__('inValidLogType'))
    }
    const requestParams = req.query
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : Constants.PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit

    let query = {
      log_type: logType,
    }
    if (requestParams.search && requestParams.search !== '') {
      query = {
        ...query,
        [Op.or]: {
          '$Product.name$': {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }
    if (parseInt(logType, 10) === 2 && partyName && partyName !== '') {
      query = {
        ...query,
        party_name: partyName,
      }
    }
    let sorting = [['updatedAt', 'DESC']]
    if (requestParams.order_by && requestParams.order_by !== '') {
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    ProductInventoryLog.findAndCountAll({
      include: [
        {
          model: Product,
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: ProductFlavors,
          attributes: ['id', 'flavor_name'],
          required: false,
        },
        {
          model: ProductStockDetails,
          attributes: ['id', 'sku'],
          required: false,
        },
      ],
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              result[key].date = result[key].expiry_date
              result[key].product_id = result[key].Product.id
              result[key].product_name = result[key].Product.name
              result[key].flavor_id = result[key].ProductFlavor.id
              result[key].flavor_name = result[key].ProductFlavor.flavor_name
              result[key].sku = result[key].ProductStockDetail.sku
            }
          })
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, inventoryLogList).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            extra
          )
        } else {
          return Response.successResponseData(
            res,
            [],
            Constants.SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description function to get list of out of stock product inventory
   * @param req
   * @param res
   */
  outOfStockProductInventoryList: async (req, res) => {
    const requestParams = req.query
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : Constants.PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit

    const query = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
      total_quantity: 0,
    }
    let searchQuery = {}
    if (requestParams.search && requestParams.search !== '') {
      searchQuery = {
        ...searchQuery,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }
    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    ProductInventory.findAndCountAll({
      include: [
        {
          model: Product,
          attributes: ['id', 'name'],
          where: searchQuery,
        },
        {
          model: ProductFlavors,
          attributes: ['id', 'flavor_name'],
        },
        {
          model: ProductStockDetails,
          attributes: ['id', 'size', 'weight'],
        },
      ],
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
    })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              result[key].product_id = result[key].Product
                ? result[key].Product.id
                : ''
              result[key].product_name = result[key].Product
                ? result[key].Product.name
                : ''
              result[key].flavor_id = result[key].ProductFlavor
                ? result[key].ProductFlavor.id
                : ''
              result[key].flavor_name = result[key].ProductFlavor
                ? result[key].ProductFlavor.flavor_name
                : ''
              result[key].size = result[key].ProductStockDetail
                ? result[key].ProductStockDetail.size
                : ''
              result[key].weight = result[key].ProductStockDetail
                ? result[key].ProductStockDetail.weight
                : ''
              result[key].blocked_stock = 0 // TODO
              result[key].available_stock = 0 // TODO
              result[key].date = result[key].createdAt // TODO
            }
          })
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(
              result,
              outOfStockProductInventoryList
            ).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            extra
          )
        } else {
          return Response.successResponseData(
            res,
            [],
            Constants.SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
      .catch((e) => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description 'Product Inventory add function'
   * @param req
   * @param res
   */
  addProductInventory: async (req, res) => {
    const requestParams = req.body
    addProductInventoryValidation(requestParams, res, async (validate) => {
      if (validate) {
        const productInventoryCreateAry = []
        const productInventoryLogCreateAry = []
        const productIds = []
        const flavorIds = []
        const stockIds = []

        const repeatBatch = requestParams.data
          .map(function (value) {
            return value.batch_no
          })
          .some(function (value, index, array) {
            return array.indexOf(value) !== array.lastIndexOf(value)
          })

        if (repeatBatch) {
          Response.successResponseWithoutData(
            res,
            res.__('batchIsRepeated'),
            Constants.FAIL
          )
        }

        requestParams.data.forEach((reqData) => {
          if (!productIds.includes(reqData.product_id)) {
            productIds.push(reqData.product_id)
          }
          if (!flavorIds.includes(reqData.flavor_id)) {
            flavorIds.push(reqData.flavor_id)
          }
          if (!stockIds.includes(reqData.product_stock_detail_id)) {
            stockIds.push(reqData.product_stock_detail_id)
          }
          //check for inventory with same product-id,batch and expiry_date
          const productsBatchWithExpExists = ProductInventory.findOne({
            where: {
              product_id: reqData.product_id,
              batch_no: reqData.batch_no,
              expiry_date: sequelize.where(
                sequelize.fn('date', sequelize.col('expiry_date')),
                '=',
                reqData.expiry
              ),
              status: Constants.ACTIVE,
            },
          }).then((batchWithExp) => {
            if (batchWithExp) {
              batchWithExp.total_quantity =
                batchWithExp.total_quantity + reqData.total_quantity
              batchWithExp.save()
            } else {
              productInventoryCreateAry.push({
                product_id: reqData.product_id,
                flavor_id: reqData.flavor_id,
                product_stock_detail_id: reqData.product_stock_detail_id,
                total_quantity: reqData.total_quantity,
                batch_no: reqData.batch_no,
                expiry_date: reqData.expiry,
              })
            }
          })

          productInventoryLogCreateAry.push({
            product_id: reqData.product_id,
            flavor_id: reqData.flavor_id,
            product_stock_detail_id: reqData.product_stock_detail_id,
            quantity: reqData.total_quantity,
            batch_no: reqData.batch_no,
            expiry_date: reqData.expiry,
            sale_offline: reqData.sale_offline,
          })
        })
        // check requested product id exist
        const productsExistsCount = await Product.count({
          where: {
            id: {
              [Op.in]: productIds,
            },
            status: {
              [Op.not]: Constants.DELETE,
            },
          },
        }).then((productsExistsData) => productsExistsData)
        if (
          productsExistsCount === 0 ||
          productsExistsCount !== productIds.length
        ) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('productNotExist'),
            Constants.FAIL
          )
        }
        // check requested flavor id exist
        const flavorExistsCount = await ProductFlavors.count({
          where: {
            id: {
              [Op.in]: flavorIds,
            },
            status: {
              [Op.not]: Constants.DELETE,
            },
          },
        }).then((flavorExistsData) => flavorExistsData)
        if (flavorExistsCount === 0 || flavorExistsCount !== flavorIds.length) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('flavorNotExist'),
            Constants.FAIL
          )
        }
        // check requested product stock detail id exist
        const stockExistsCount = await ProductStockDetails.count({
          where: {
            id: {
              [Op.in]: stockIds,
            },
          },
        }).then((stockExistsData) => stockExistsData)
        if (stockExistsCount === 0 || stockExistsCount !== stockIds.length) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('stockNotExist'),
            Constants.FAIL
          )
        }
        await ProductInventory.bulkCreate(productInventoryCreateAry)
          .then(async (result) => {
            if (result) {
              // insert inventory log
              await ProductInventoryLog.bulkCreate(productInventoryLogCreateAry)
                .then(async (productInventoryLogResult) => {
                  if (productInventoryLogResult) {
                    for (const reqData of requestParams.data) {
                      await new Promise(async (next) => {
                        await ProductStockDetails.findOne({
                          where: {
                            id: reqData.product_stock_detail_id,
                          },
                        }).then(async (getProductStockDetailsData) => {
                          // update quantity in stock detail
                          if (getProductStockDetailsData) {
                            await ProductStockDetails.update(
                              {
                                quantity:
                                  getProductStockDetailsData.quantity +
                                    reqData.total_quantity >
                                  0
                                    ? getProductStockDetailsData.quantity +
                                      reqData.total_quantity
                                    : 0,
                              },
                              {
                                where: {
                                  id: reqData.product_stock_detail_id,
                                },
                              }
                            ).then()
                            next()
                          } else next()
                        })
                      })
                    }
                    return Response.successResponseWithoutData(
                      res,
                      res.__('productInventoryCreatedSuccessfully'),
                      Constants.SUCCESS
                    )
                  }
                  return null
                })
                .catch(async (e) => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    Constants.INTERNAL_SERVER
                  )
                })
            }
            return null
          })
          .catch(async (e) => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      }
    })
  },

  /**
   * @description 'Deduct product Inventory'
   * @param req
   * @param res
   */
  deductProductInventory: async (req, res) => {
    const requestParams = req.body
    deductProductInventoryValidation(requestParams, res, async (validate) => {
      if (validate) {
        const productIds = []
        const flavorIds = []
        const stockIds = []
        // log entry and in inventory table manage quntity
        requestParams.data.forEach((reqData) => {
          if (!productIds.includes(reqData.product_id)) {
            productIds.push(reqData.product_id)
          }
          if (!flavorIds.includes(reqData.flavor_id)) {
            flavorIds.push(reqData.flavor_id)
          }
          if (!stockIds.includes(reqData.product_stock_detail_id)) {
            stockIds.push(reqData.product_stock_detail_id)
          }
        })
        // check requested product id exist
        const productsExistsCount = await Product.count({
          where: {
            id: {
              [Op.in]: productIds,
            },
            status: {
              [Op.not]: Constants.DELETE,
            },
          },
        }).then((productsExistsData) => productsExistsData)
        if (
          productsExistsCount === 0 ||
          productsExistsCount !== productIds.length
        ) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('productNotExist'),
            Constants.FAIL
          )
        }
        // check requested flavor id exist
        const flavorExistsCount = await ProductFlavors.count({
          where: {
            id: {
              [Op.in]: flavorIds,
            },
            status: {
              [Op.not]: Constants.DELETE,
            },
          },
        }).then((flavorExistsData) => flavorExistsData)
        if (flavorExistsCount === 0 || flavorExistsCount !== flavorIds.length) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('flavorNotExist'),
            Constants.FAIL
          )
        }
        // check requested product stock detail id exist
        const stockExistsCount = await ProductStockDetails.count({
          where: {
            id: {
              [Op.in]: stockIds,
            },
          },
        }).then((stockExistsData) => stockExistsData)
        if (stockExistsCount === 0 || stockExistsCount !== stockIds.length) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('stockNotExist'),
            Constants.FAIL
          )
        }
        for (const reqData of requestParams.data) {
          await new Promise(async (next) => {
            await ProductInventory.findOne({
              where: {
                product_id: reqData.product_id,
                flavor_id: reqData.flavor_id,
                product_stock_detail_id: reqData.product_stock_detail_id,
                batch_no: reqData.batch_no,
                expiry_date: sequelize.where(
                  sequelize.fn('date', sequelize.col('expiry_date')),
                  '=',
                  reqData.expiry_date
                ),
                status: {
                  [Op.not]: Constants.DELETE,
                },
              },
            }).then(async (productInventoryData) => {
              if (productInventoryData) {
                if (
                  reqData.total_quantity > productInventoryData.total_quantity
                ) {
                  return Response.successResponseWithoutData(
                    res,
                    res.__('deductQtyShouldNotBeGreaterAvailable'),
                    Constants.FAIL
                  )
                }

                await ProductInventory.update(
                  {
                    total_quantity:
                      productInventoryData.total_quantity -
                        reqData.total_quantity >
                      0
                        ? productInventoryData.total_quantity -
                          reqData.total_quantity
                        : 0,
                  },
                  {
                    where: {
                      id: productInventoryData.id,
                    },
                  }
                ).then(async () => {
                  const getProductStockDetailsData = await ProductStockDetails.findOne(
                    {
                      where: {
                        id: reqData.product_stock_detail_id,
                      },
                    }
                  ).then((productStockDetailsRes) => productStockDetailsRes)
                  // update quantity in stock detail
                  await ProductStockDetails.update(
                    {
                      quantity:
                        getProductStockDetailsData.quantity -
                          reqData.total_quantity >
                        0
                          ? getProductStockDetailsData.quantity -
                            reqData.total_quantity
                          : 0,
                    },
                    {
                      where: {
                        id: reqData.product_stock_detail_id,
                      },
                    }
                  ).then()

                  // insert deduct log
                  await ProductInventoryLog.create({
                    product_id: reqData.product_id,
                    flavor_id: reqData.flavor_id,
                    product_stock_detail_id: reqData.product_stock_detail_id,
                    quantity: reqData.total_quantity,
                    batch_no: reqData.batch_no,
                    party_name: requestParams.party_name,
                    expiry_date: reqData.expiry_date,
                    log_type: Constants.LOG_TYPE.OUTWARD,
                  }).then()
                })
                next()
              } else next()
            })
          })
        }
        return Response.successResponseWithoutData(
          res,
          res.__('productInventoryDeductSuccessfully'),
          Constants.SUCCESS
        )
      }
    })
  },

  /**
   * @description 'Add product function'
   * @param req
   * @param res
   */
  addScanProduct: async (req, res) => {
    const requestParams = req.body
    addScanProductValidation(requestParams, res, async (validate) => {
      if (validate) {
        // check batch number exist
        const slug = slugify(requestParams.name, {
          replacement: '-',
          remove: /[*+~.()'"!:@]/gi,
          lower: true,
          strict: true,
        })
        const projectNameSlug = await ProductController.checkUniqueSlug(slug)
        // save product
        await Product.create({
          name: requestParams.name,
          slug: projectNameSlug,
        })
          .then(async (savedProduct) => {
            if (savedProduct) {
              // save product stock
              await ProductStock.create({
                product_id: savedProduct.id,
                flavor_id: requestParams.flavor_id,
              })
                .then(async (savedProductStock) => {
                  if (savedProductStock) {
                    await ProductStockDetails.create({
                      product_id: savedProduct.id,
                      product_stock_id: savedProductStock.id,
                      upc_code: requestParams.upc_code,
                      size: requestParams.size,
                      quantity: requestParams.quantity,
                    })
                      .then(async (savedProductStockDetails) => {
                        if (savedProductStockDetails) {
                          await ProductInventory.create({
                            product_id: savedProduct.id,
                            flavor_id: requestParams.flavor_id,
                            product_stock_detail_id:
                              savedProductStockDetails.id,
                            total_quantity: requestParams.quantity,
                            batch_no: requestParams.batch_no,
                            expiry_date: requestParams.expiry,
                          })
                            .then(async (savedProductInventory) => {
                              if (savedProductInventory) {
                                await ProductInventoryLog.create({
                                  product_id: savedProduct.id,
                                  flavor_id: requestParams.flavor_id,
                                  product_stock_detail_id:
                                    savedProductStockDetails.id,
                                  quantity: requestParams.quantity,
                                  batch_no: requestParams.batch_no,
                                  expiry_date: requestParams.expiry,
                                })
                                  .then(async (savedProductInventoryLog) => {
                                    if (savedProductInventoryLog) {
                                      return Response.successResponseWithoutData(
                                        res,
                                        res.__('productSavedSuccess'),
                                        Constants.SUCCESS
                                      )
                                    }
                                    return null
                                  })
                                  .catch(async (e) => {
                                    Response.errorResponseData(
                                      res,
                                      res.__('internalError'),
                                      Constants.INTERNAL_SERVER
                                    )
                                  })
                              }
                              return null
                            })
                            .catch(async (e) => {
                              Response.errorResponseData(
                                res,
                                res.__('internalError'),
                                Constants.INTERNAL_SERVER
                              )
                            })
                        }
                        return null
                      })
                      .catch(async (e) => {
                        Response.errorResponseData(
                          res,
                          res.__('internalError'),
                          Constants.INTERNAL_SERVER
                        )
                      })
                  }
                  return null
                })
                .catch(async (e) => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    Constants.INTERNAL_SERVER
                  )
                })
            }
            return null
          })
          .catch(async (e) => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      }
    })
  },
}
