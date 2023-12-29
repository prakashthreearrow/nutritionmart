const moment = require('moment')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const slugify = require('slugify')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const {
  Product,
  Category,
  Brand,
  ProductStock,
  ProductFlavors,
  ProductStockDetails,
  ProductImage,
  ProductInventory,
} = require('../../models')
const {
  product,
  activeProducts,
  productDetails,
  viewProductDetail,
  sortedProductList,
  flavourLists,
} = require('../../transformers/admin/ProductTransformer')
const {
  addEditValidationForProduct,
  productChangeStatusValidation,
  editValidationForProductDetail,
  addEditValidationForProductImageUpload,
} = require('../../services/AdminValidation')
const Helper = require('../../services/Helper')

module.exports = {
  /**
   * @description function to get list of product
   * @param req
   * @param res
   */
  productList: async (req, res) => {
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

    let query = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }

    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }

    if (
      requestParams.filter_by_category_id &&
      requestParams.filter_by_category_id !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          category_id: requestParams.filter_by_category_id,
        },
      }
    }
    if (
      requestParams.filter_by_sub_category_id &&
      requestParams.filter_by_sub_category_id !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          sub_category_id: requestParams.filter_by_sub_category_id,
        },
      }
    }
    if (
      requestParams.filter_by_brand_id &&
      requestParams.filter_by_brand_id !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          brand_id: requestParams.filter_by_brand_id,
        },
      }
    }
    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          status: requestParams.filter_by_status,
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

    Product.findAndCountAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: ProductStock,
          where: {
            is_default: Constants.ACTIVE,
          },
          required: false,
          include: {
            model: ProductImage,
            attributes: ['id', 'image'],
            required: false,
          },
        },
      ],
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    })
      .then(async (data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          for (let i = 0; i < result.length; i++) {
            if (result[i]) {
              result[i].category = result[i].Category
                ? result[i].Category.name
                : ''
              result[i].brand = result[i].Brand ? result[i].Brand.name : ''
              result[i].flavors_count = result[i].ProductStocks.length

              const productDisplayImage = await Helper.getProductDisplayImage(
                result[i].id
              )
              if (productDisplayImage) {
                result[i].display_image = await Helper.mediaUrlForS3(
                  Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                  productDisplayImage
                )
              } else {
                result[i].display_image = ''
              }
            }
          }
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, product).parse(),
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
   * @description 'product add-edit function'
   * @param req
   * @param res
   */
  addEditProduct: async (req, res) => {
    const requestParams = req.body
    addEditValidationForProduct(requestParams, res, async (validate) => {
      if (validate) {
        const result = requestParams.ingredients.map(Object.values)
        const mergedIngredients = [].concat.apply([], result)

        let checkNameExist
        if (requestParams.id) {
          checkNameExist = Product.findOne({
            where: {
              name: requestParams.name,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        } else {
          checkNameExist = Product.findOne({
            where: {
              name: requestParams.name,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        }
        await checkNameExist.then(async (ProductData) => {
          if (ProductData) {
            Response.successResponseWithoutData(
              res,
              res.__('ProductNameAlreadyExist'),
              Constants.FAIL
            )
          } else {
            const ProductObj = {
              name: requestParams.name,
              category_id: requestParams.category_id,
              sub_category_id: requestParams.sub_category_id,
              brand_id: requestParams.brand_id,
              how_to_use: requestParams.how_to_use,
              description: requestParams.description,
              is_cod: requestParams.is_cod,
              delivery_charge: requestParams.delivery_charge,
              country_of_origin: requestParams.country_of_origin,
              authenticity: requestParams.authenticity,
              ingredients: JSON.stringify(mergedIngredients),
              return_policy: requestParams.return_policy,
              specification_details: JSON.stringify(
                requestParams.specification_details
              ),
            }

            if (requestParams.id) {
              Product.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: Constants.DELETE,
                  },
                },
              })
                .then(async (productData) => {
                  if (productData) {
                    await productData
                      .update(ProductObj, {
                        where: {
                          id: requestParams.id,
                        },
                      })
                      .then(async (result) => {
                        if (result) {
                          return Response.successResponseData(
                            res,
                            {
                              id: result.id,
                            },
                            Constants.SUCCESS,
                            res.__('ProductUpdatedSuccessfully')
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
                  } else {
                    Response.successResponseWithoutData(
                      res,
                      res.__('ProductNotExist'),
                      Constants.FAIL
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
            } else {
              const slug = slugify(requestParams.name, {
                replacement: '-',
                remove: /[*+~.()'"!:@]/gi,
                lower: true,
                strict: true,
              })

              ProductObj.slug = await module.exports.checkUniqueSlug(slug)
              ProductObj.status = Constants.PENDING
              await Product.create(ProductObj)
                .then(async (result) => {
                  if (result) {
                    return Response.successResponseData(
                      res,
                      {
                        id: result.id,
                      },
                      Constants.SUCCESS,
                      res.__('ProductCreatedSuccessfully')
                    )
                  }
                  return null
                })
                .catch(async () => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    Constants.INTERNAL_SERVER
                  )
                })
            }
          }
        })
      }
    })
  },

  /**
   * @description check unique slug
   * @param slugName
   */
  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await Product.findOne({
      where: {
        slug: slugName,
        status: {
          [Op.ne]: Constants.DELETE,
        },
      },
    }).then(async (res) => {
      if (res) {
        const randomNumber = await Helper.makeRandomDigit(3)
        newSlug = `${slugName}-${randomNumber}`
        await Product.findOne({
          where: {
            slug: newSlug,
            status: {
              [Op.ne]: Constants.DELETE,
            },
          },
        }).then(async (data) => {
          if (!data) {
            return newSlug
          } else {
            await module.exports.checkUniqueSlug(slugName)
          }
          return null
        })
      }
      return newSlug
    })
    return newSlug
  },

  /**
   * @description get list of active products
   * @param req
   * @param res
   */
  activeProductList: async (req, res) => {
    const requestParams = req.query
    let query = {
      status: Constants.ACTIVE,
    }

    if (
      requestParams.search &&
      requestParams.search !== '' &&
      requestParams.search.length >= 2
    ) {
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }
    Product.findAll({
      where: query,
      order: [['name', 'ASC']],
      limit: Constants.ACTIVE_PRODUCT_LIMIT,
    }).then((result) => {
      return Response.successResponseData(
        res,
        new Transformer.List(result, activeProducts).parse(),
        Constants.SUCCESS,
        res.locals.__('success'),
        null
      )
    })
  },

  /**
   * @description change the status of product
   * @param req
   * @param res
   */
  productUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    const ids = requestParams.ids.split(',')
    productChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Product.findAll({
          where: {
            id: ids,
          },
        })
          .then(async (productData) => {
            if (productData.length > 0) {
              Product.update(
                { status: requestParams.status },
                { where: { id: ids } }
              )
                .then((result) => {
                  if (result) {
                    return Response.successResponseWithoutData(
                      res,
                      res.locals.__('statusChangeSuccess'),
                      Constants.SUCCESS
                    )
                  }
                  return null
                })
                .catch(() => {
                  return Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    Constants.INTERNAL_SERVER
                  )
                })
            } else {
              return Response.successResponseData(
                res,
                null,
                Constants.SUCCESS,
                res.locals.__('noProductFound')
              )
            }
            return null
          })
          .catch(() => {
            return Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      }
    })
  },

  /**
   * @description delete the status of product
   * @param req
   * @param res
   */
  deleteProduct: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidProductId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Product.findOne({
        where: {
          id: requestParams.id,
        },
      })
        .then(async (productData) => {
          if (productData) {
            // eslint-disable-next-line no-param-reassign
            productData.status = Constants.DELETE
            productData
              .save()
              .then(async (result) => {
                if (result) {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('ProductStatusDeleted'),
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
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('noProductFound'),
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
  },

  /**
   * @description get product detail
   * @param req
   * @param res
   */
  productDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidProductId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Product.findOne({
        include: [
          {
            model: ProductStock,
            attributes: ['id', 'is_default'],
            required: false,
            where: {
              status: Constants.ACTIVE,
            },
            include: {
              model: ProductFlavors,
              attributes: ['id', 'flavor_name'],
              required: false,
            },
          },
          {
            model: ProductStock,
            attributes: ['id'],
            required: false,
            where: {
              status: Constants.ACTIVE,
            },
            order: [['is_default', 'ASC']],
            include: {
              model: ProductStockDetails,
              attributes: [
                'id',
                'mrp_price',
                'customer_price',
                'size',
                'weight',
              ],
              required: false,
              where: {
                status: {
                  [Op.in]: [Constants.ACTIVE],
                },
              },
              include: {
                model: ProductInventory,
                attributes: ['id', `total_quantity`, 'expiry_date'],
                required: false,
                order: [['id', 'DESC']],
                where: {
                  status: {
                    [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
                  },
                },
              },
            },
          },
          {
            model: ProductStock,
            attributes: ['id'],
            where: {
              status: Constants.ACTIVE,
            },
            required: false,
            order: [['is_default', 'ASC']],
            include: {
              model: ProductImage,
              attributes: ['id', 'image', 'sort_order', 'image', 'media_type'],
              required: false,
            },
          },
        ],
        order: [
          [{ model: ProductStock }, 'is_default', 'DESC'],
          [
            { model: ProductStock },
            { model: ProductStockDetails },
            { model: ProductInventory },
            'expiry_date',
            'ASC',
          ],
        ],
        where: {
          id: requestParams.id,
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
        attributes: [
          'id',
          'name',
          'description',
          'authenticity',
          'country_of_origin',
          'delivery_charge',
          'display_image',
          'how_to_use',
          'authenticity',
          'return_policy',
          'ingredients',
          'createdAt',
          'updatedAt',
        ],
      })
        .then(async (result) => {
          if (result) {
            const productDisplayImage = await Helper.getProductDisplayImage(
              result.id
            )
            if (productDisplayImage) {
              result.display_image = await Helper.mediaUrlForS3(
                Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                productDisplayImage
              )
            } else {
              result.display_image = ''
            }
            Object.keys(result.ProductStocks).forEach((key) => {
              if ({}.hasOwnProperty.call(result.ProductStocks, key)) {
                Object.keys(result.ProductStocks[key].ProductImages).forEach(
                  (imageKey) => {
                    if (
                      {}.hasOwnProperty.call(
                        result.ProductStocks[key].ProductImages,
                        imageKey
                      )
                    ) {
                      if (result.ProductStocks[key].ProductImages[imageKey]) {
                        const image =
                          result.ProductStocks[key].ProductImages[imageKey]
                            .image &&
                          result.ProductStocks[key].ProductImages[imageKey]
                            .image !== ''
                            ? result.ProductStocks[key].ProductImages[imageKey]
                                .image
                            : ''
                        // eslint-disable-next-line no-param-reassign
                        result.ProductStocks[key].ProductImages[
                          imageKey
                        ].image = Helper.mediaUrlForS3(
                          Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                          image
                        )
                      }
                    }
                  }
                )
              }
            })

            // eslint-disable-next-line no-param-reassign
            result.productDetail = result.ProductStocks
            result.productReview = [] // TODO: ADD PRODUCT REVIEWS
            result.ingredients = JSON.parse(result.ingredients)
            return Response.successResponseData(
              res,
              new Transformer.Single(result, productDetails).parse(),
              Constants.SUCCESS,
              res.__('success')
            )
          } else {
            return Response.successResponseData(
              res,
              null,
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
    }
  },

  /**
   * @description 'product view edit product details function'
   * @param req
   * @param res
   */
  viewEditProductDetail: async (req, res) => {
    const requestParams = req.params
    const ProductFlavorsArr = []

    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidProductId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Product.findOne({
        include: [
          {
            model: Category,
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Category,
            as: 'sub-category',
            attributes: ['id', 'parent_id', 'name'],
            required: false,
          },
          {
            model: Brand,
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: ProductStock,
            attributes: ['id', 'flavor_id', 'is_default'],
            where: {
              status: Constants.ACTIVE,
            },
            required: false,
            include: {
              model: ProductFlavors,
              attributes: ['id', 'flavor_name'],
              required: false,
            },
          },
          {
            model: ProductStock,
            attributes: ['id', 'flavor_id', 'is_default'],
            required: false,
            where: {
              status: Constants.ACTIVE,
            },
            include: {
              model: ProductStockDetails,
              attributes: [
                'id',
                'sku',
                'upc_code',
                'size',
                'serving_day',
                'mrp_price',
                'customer_price',
                'weight',
                'quantity',
                'status',
              ],
              required: false,
              where: {
                status: {
                  [Op.in]: [Constants.ACTIVE],
                },
              },
            },
          },
          {
            model: ProductStock,
            attributes: ['id'],
            required: false,
            where: {
              status: Constants.ACTIVE,
            },
            include: {
              model: ProductImage,
              attributes: ['id', 'image', 'sort_order', 'image', 'media_type'],
              required: false,
              where: {
                status: Constants.ACTIVE,
              },
            },
          },
        ],
        where: {
          id: requestParams.id,
          status: {
            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE, Constants.PENDING],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            const productDisplayImage = await Helper.getProductDisplayImage(
              result.id
            )
            if (productDisplayImage) {
              result.display_image = await Helper.mediaUrlForS3(
                Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                productDisplayImage
              )
            } else {
              result.display_image = ''
            }

            Object.keys(result.ProductStocks).forEach((key) => {
              if ({}.hasOwnProperty.call(result.ProductStocks, key)) {
                if (result.ProductStocks[key].ProductFlavor) {
                  ProductFlavorsArr.push(
                    result.ProductStocks[key].ProductFlavor
                  )
                }
              }
              if ({}.hasOwnProperty.call(result.ProductStocks, key)) {
                Object.keys(result.ProductStocks[key].ProductImages).forEach(
                  (imageKey) => {
                    if (
                      {}.hasOwnProperty.call(
                        result.ProductStocks[key].ProductImages,
                        imageKey
                      )
                    ) {
                      if (result.ProductStocks[key].ProductImages[imageKey]) {
                        const image =
                          result.ProductStocks[key].ProductImages[imageKey]
                            .image &&
                          result.ProductStocks[key].ProductImages[imageKey]
                            .image !== ''
                            ? result.ProductStocks[key].ProductImages[imageKey]
                                .image
                            : ''
                        // eslint-disable-next-line no-param-reassign
                        result.ProductStocks[key].ProductImages[
                          imageKey
                        ].image = Helper.mediaUrlForS3(
                          Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                          image
                        )
                      }
                    }
                  }
                )
              }
            })

            // eslint-disable-next-line no-param-reassign
            result.category = result.Category ? result.Category.name : ''
            // eslint-disable-next-line no-param-reassign
            result.sub_category = result['sub-category']
              ? result['sub-category'].name
              : ''
            result.brand = result.Brand ? result.Brand.name : ''
            result.specification = JSON.parse(result.specification_details)
            result.ingredients = JSON.parse(result.ingredients)
            result.productStocks = result.ProductStocks

            return Response.successResponseData(
              res,
              new Transformer.Single(result, viewProductDetail).parse(),
              Constants.SUCCESS,
              res.__('success')
            )
          } else {
            Response.successResponseWithoutData(
              res,
              res.locals.__('noDataFound'),
              Constants.FAIL
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
  },

  /**
   * @description 'Arrange product in brand module'
   * @param req
   * @param res
   */
  updateProductSequenceInBrand: async (req, res) => {
    const requestParams = req.body
    await Brand.findByPk(requestParams.brand_id).then(async (brandExists) => {
      if (brandExists) {
        await Product.findAll({
          where: {
            brand_id: requestParams.brand_id,
          },
        })
          .then(async (data) => {
            if (data) {
              const { sequence } = requestParams
              Object.keys(sequence).forEach((key) => {
                if ({}.hasOwnProperty.call(sequence, key)) {
                  Product.update(
                    {
                      brand_sort_order: sequence[key].brand_sort_order,
                    },
                    {
                      where: {
                        id: sequence[key].id,
                      },
                    }
                  )
                }
              })
              Response.successResponseWithoutData(
                res,
                res.locals.__('BrandSeqChangedSuccess'),
                Constants.SUCCESS
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
      } else {
        Response.errorResponseData(
          res,
          res.__('brandNotFound'),
          Constants.BAD_REQUEST
        )
      }
    })
  },

  /**
   * @description 'Arrange product in Category module'
   * @param req
   * @param res
   */
  updateProductSequenceInSubCategory: async (req, res) => {
    const requestParams = req.body
    await Category.findByPk(requestParams.sub_category_id).then(
      async (categoryExist) => {
        if (categoryExist) {
          await Product.findAll({
            where: {
              sub_category_id: requestParams.sub_category_id,
            },
          })
            .then(async (data) => {
              if (data) {
                const { sequence } = requestParams
                Object.keys(sequence).forEach((key) => {
                  if ({}.hasOwnProperty.call(sequence, key)) {
                    Product.update(
                      {
                        category_sort_order: sequence[key].category_sort_order,
                      },
                      {
                        where: {
                          id: sequence[key].id,
                        },
                      }
                    )
                  }
                })
                Response.successResponseWithoutData(
                  res,
                  res.locals.__('subCategorySeqChangedSuccess'),
                  Constants.SUCCESS
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
        } else {
          Response.errorResponseData(
            res,
            res.__('categoryNotFound'),
            Constants.BAD_REQUEST
          )
        }
      }
    )
  },

  /**
   * @description 'sorted by category Product List'
   * @param req
   * @param res
   */
  sortedProductsInSubCategory: async (req, res) => {
    const requestParams = req.params
    await Product.findAll({
      where: {
        status: Constants.ACTIVE,
        sub_category_id: requestParams.sub_category_id,
      },
      order: [['category_sort_order', 'ASC']],
    }).then(async (result) => {
      if (result.length > 0) {
        for (let i = 0; i < result.length; i++) {
          if (result[i]) {
            const productDisplayImage = await Helper.getProductDisplayImage(
              result[i].id
            )
            if (productDisplayImage) {
              result[i].display_image = await Helper.mediaUrlForS3(
                Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                productDisplayImage
              )
            } else {
              result[i].display_image = ''
            }
          }
        }
        return Response.successResponseData(
          res,
          new Transformer.List(result, sortedProductList).parse(),
          Constants.SUCCESS,
          res.locals.__('success'),
          null
        )
      }
      return Response.successResponseData(
        res,
        [],
        Constants.SUCCESS,
        res.__('noDataFound')
      )
    })
  },

  /**
   * @description 'sort product in Brands'
   * @param req
   * @param res
   */
  sortedProductsInBrand: async (req, res) => {
    const requestParams = req.params
    Product.findAll({
      where: {
        status: Constants.ACTIVE,
        brand_id: requestParams.brand_id,
      },
      order: [['brand_sort_order', 'ASC']],
    })
      .then(async (result) => {
        if (result.length > 0) {
          for (let i = 0; i < result.length; i++) {
            if (result[i]) {
              const productDisplayImage = await Helper.getProductDisplayImage(
                result[i].id
              )
              if (productDisplayImage) {
                result[i].display_image = await Helper.mediaUrlForS3(
                  Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                  productDisplayImage
                )
              } else {
                result[i].display_image = ''
              }
            }
          }
          return Response.successResponseData(
            res,
            new Transformer.List(result, sortedProductList).parse(),
            Constants.SUCCESS,
            res.locals.__('success')
          )
        }
        return Response.successResponseData(
          res,
          [],
          Constants.SUCCESS,
          res.__('noDataFound')
        )
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
   * @description function to get list of flavour list
   * @param req
   * @param res
   */
  flavourList: async (req, res) => {
    const requestParams = req.query
    let query = {
      status: Constants.ACTIVE,
    }

    if (
      requestParams.search &&
      requestParams.search !== '' &&
      requestParams.search.length >= 2
    ) {
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }
    ProductFlavors.findAll({
      where: query,
      order: [['flavor_name', 'ASC']],
      limit: Constants.ACTIVE_PRODUCT_LIMIT,
    }).then((result) => {
      return Response.successResponseData(
        res,
        new Transformer.List(result, flavourLists).parse(),
        Constants.SUCCESS,
        res.locals.__('success'),
        null
      )
    })
  },

  /**
   * @description 'product_details add-edit function'
   * @param req
   * @param res
   */
  editProductDetail: async (req, res) => {
    const requestParams = req.body
    const requestFiles = req.files
    const outputRes = []
    const productId = parseInt(requestParams.product_id, 10)
    let noError = true
    let skuErr = false
    let upcErr = false
    let productStockIdArr = []
    let productStockDetailIdArr = []
    editValidationForProductDetail(
      requestParams,
      requestFiles,
      res,
      async (validate) => {
        if (validate) {
          const uniqueFlavourId = requestParams.product_stocks
          const repeatFlavourId = uniqueFlavourId
            .map(function (value) {
              return value.flavor_id
            })
            .some(function (value, index, array) {
              return array.indexOf(value) !== array.lastIndexOf(value)
            })

          if (repeatFlavourId) {
            noError = false
            Response.successResponseWithoutData(
              res,
              res.__('flavourIsRepeated'),
              Constants.FAIL
            )
          }
          const productObj = {
            tax: requestParams.tax,
            hsn: requestParams.hsn,
            discount_type: requestParams.discount_type,
            discount_value: requestParams.discount_value,
            freebie: requestParams.freebie,
          }

          if (productId) {
            await Product.update(productObj, {
              where: {
                id: requestParams.product_id,
              },
            })
              // eslint-disable-next-line consistent-return
              .then(async (result) => {
                if (result) {
                  const productStocksArr = requestParams.product_stocks

                  for (let i = 0; i < productStocksArr.length; i++) {
                    let stockObj = {}
                    // eslint-disable-next-line no-await-in-loop
                    await ProductStock.findOrCreate({
                      where: {
                        id: productStocksArr[i].product_stock_id,
                      },
                      defaults: {
                        product_id: productId,
                        flavor_id: productStocksArr[i].flavor_id,
                        is_default: productStocksArr[i].is_default,
                        status: Constants.ACTIVE,
                      },
                    })
                      // eslint-disable-next-line no-loop-func
                      .then(async (productStockResult) => {
                        productStockIdArr.push(productStockResult[0].id)

                        outputRes.push({
                          product_stock_id: productStockResult[0].id,
                        })

                        stockObj = {
                          product_id: productId,
                          flavor_id: productStocksArr[i].flavor_id,
                          is_default: productStocksArr[i].is_default,
                          status: Constants.ACTIVE,
                        }
                        await ProductStock.update(stockObj, {
                          where: { id: productStockResult[0].id },
                        }).then(async () => {
                          const productStocksDetailsArr =
                            productStocksArr[i].variants
                          for (
                            let j = 0;
                            j < productStocksDetailsArr.length;
                            j++
                          ) {
                            let checkSkuExist
                            if (
                              productStocksDetailsArr[j].product_stock_detail_id
                            ) {
                              checkSkuExist = ProductStockDetails.findOne({
                                where: {
                                  sku: productStocksDetailsArr[j].sku,
                                  id: {
                                    [Op.ne]:
                                      productStocksDetailsArr[j]
                                        .product_stock_detail_id,
                                  },
                                  status: {
                                    [Op.ne]: Constants.DELETE,
                                  },
                                },
                              }).then()
                            } else {
                              checkSkuExist = ProductStockDetails.findOne({
                                where: {
                                  sku: productStocksDetailsArr[j].sku,
                                  status: {
                                    [Op.ne]: Constants.DELETE,
                                  },
                                },
                              }).then()
                            }
                            // eslint-disable-next-line no-await-in-loop,no-shadow
                            await checkSkuExist.then(async (result) => {
                              if (result) {
                                noError = false
                                skuErr = true
                                await ProductStockDetails.update(
                                  {
                                    status: Constants.DELETE,
                                  },
                                  {
                                    where: {
                                      id: productStockDetailIdArr,
                                    },
                                  }
                                )
                              } else {
                                let checkUpcCodeExist
                                if (
                                  productStocksDetailsArr[j]
                                    .product_stock_detail_id
                                ) {
                                  checkUpcCodeExist = ProductStockDetails.findOne(
                                    {
                                      where: {
                                        upc_code:
                                          productStocksDetailsArr[j].upc_code,
                                        id: {
                                          [Op.ne]:
                                            productStocksDetailsArr[j]
                                              .product_stock_detail_id,
                                        },
                                        status: {
                                          [Op.ne]: Constants.DELETE,
                                        },
                                      },
                                    }
                                  ).then()
                                } else {
                                  checkUpcCodeExist = ProductStockDetails.findOne(
                                    {
                                      where: {
                                        upc_code:
                                          productStocksDetailsArr[j].upc_code,
                                        status: {
                                          [Op.ne]: Constants.DELETE,
                                        },
                                      },
                                    }
                                  ).then()
                                }
                                await checkUpcCodeExist.then(
                                  // eslint-disable-next-line no-shadow
                                  async (result) => {
                                    if (result) {
                                      noError = false
                                      upcErr = true

                                      await ProductStockDetails.update(
                                        {
                                          status: Constants.DELETE,
                                        },
                                        {
                                          where: {
                                            id: productStockDetailIdArr,
                                          },
                                        }
                                      )
                                    } else {
                                      let stockDetailsObj = {}
                                      await ProductStockDetails.findOrCreate({
                                        where: {
                                          id:
                                            productStocksDetailsArr[j]
                                              .product_stock_detail_id,
                                        },
                                        defaults: {
                                          product_id: productId,
                                          product_stock_id:
                                            productStockResult[0].id,
                                          sku: productStocksDetailsArr[j].sku,
                                          upc_code:
                                            productStocksDetailsArr[j].upc_code,
                                          size: productStocksDetailsArr[j].size,
                                          serving_day:
                                            productStocksDetailsArr[j]
                                              .serving_day,
                                          mrp_price:
                                            productStocksDetailsArr[j]
                                              .mrp_price,
                                          customer_price:
                                            productStocksDetailsArr[j]
                                              .customer_price,
                                          weight:
                                            productStocksDetailsArr[j].weight,
                                          quantity:
                                            productStocksDetailsArr[j].quantity,
                                          status: Constants.ACTIVE,
                                        },
                                      })
                                        // eslint-disable-next-line no-shadow
                                        .then(async (result) => {
                                          stockDetailsObj = {
                                            product_id: productId,
                                            product_stock_id:
                                              productStockResult[0].id,
                                            sku: productStocksDetailsArr[j].sku,
                                            upc_code:
                                              productStocksDetailsArr[j]
                                                .upc_code,
                                            size:
                                              productStocksDetailsArr[j].size,
                                            serving_day:
                                              productStocksDetailsArr[j]
                                                .serving_day,
                                            mrp_price:
                                              productStocksDetailsArr[j]
                                                .mrp_price,
                                            customer_price:
                                              productStocksDetailsArr[j]
                                                .customer_price,
                                            weight:
                                              productStocksDetailsArr[j].weight,
                                            quantity:
                                              productStocksDetailsArr[j]
                                                .quantity,
                                            status: Constants.ACTIVE,
                                          }
                                          await ProductStockDetails.update(
                                            stockDetailsObj,
                                            {
                                              where: { id: result[0].id },
                                            }
                                          )
                                            .then(async () => {
                                              productStockDetailIdArr.push(
                                                result[0].id
                                              )

                                              await Product.update(
                                                {
                                                  status: Constants.ACTIVE,
                                                },
                                                {
                                                  where: {
                                                    id:
                                                      requestParams.product_id,
                                                  },
                                                }
                                              )
                                            })
                                            .then(async () => {
                                              if (
                                                requestParams.deleted_stock_details_ids
                                              ) {
                                                const stockDetailIds = requestParams.deleted_stock_details_ids.split(
                                                  ','
                                                )
                                                await ProductStockDetails.update(
                                                  {
                                                    status: Constants.DELETE,
                                                  },
                                                  {
                                                    where: {
                                                      id: stockDetailIds,
                                                    },
                                                  }
                                                )
                                              }

                                              if (
                                                requestParams.deleted_image_ids
                                              ) {
                                                const ids = requestParams.deleted_image_ids.split(
                                                  ','
                                                )

                                                await ProductImage.findAll({
                                                  where: {
                                                    id: ids,
                                                  },
                                                }).then(async (data) => {
                                                  if (data) {
                                                    for (
                                                      let i = 0;
                                                      i <= data.length;
                                                      i++
                                                    ) {
                                                      if (data[i]) {
                                                        await Helper.removeOldImage(
                                                          data[i].image,
                                                          Constants.PRODUCT_STOCKS_DETAIL_IMAGE
                                                        )
                                                        await ProductImage.destroy(
                                                          {
                                                            where: {
                                                              id: data[i].id,
                                                            },
                                                          }
                                                        )
                                                      }
                                                    }
                                                  }
                                                })
                                              }

                                              if (
                                                requestParams.deleted_stock_ids
                                              ) {
                                                const stockIds = requestParams.deleted_stock_ids.split(
                                                  ','
                                                )
                                                await ProductStockDetails.update(
                                                  {
                                                    status: Constants.DELETE,
                                                  },
                                                  {
                                                    where: {
                                                      product_stock_id: stockIds,
                                                    },
                                                  }
                                                )
                                                await ProductStock.update(
                                                  {
                                                    status: Constants.DELETE,
                                                  },
                                                  {
                                                    where: {
                                                      id: stockIds,
                                                    },
                                                  }
                                                )
                                                await ProductImage.destroy({
                                                  where: {
                                                    product_stock_id: stockIds,
                                                  },
                                                })
                                              }
                                            })
                                        })
                                    }
                                    return null
                                  }
                                )
                              }
                              return null
                            })
                          }
                        })
                      })
                  }
                }
                if (noError) {
                  await ProductStock.update(
                    {
                      status: Constants.ACTIVE,
                    },
                    {
                      where: {
                        id: productStockIdArr,
                      },
                    }
                  )

                  return Response.successResponseData(
                    res,
                    {
                      product_id: productId,
                      stocks: outputRes,
                    },
                    Constants.SUCCESS,
                    res.__('ProductUpdatedSuccessfully')
                  )
                } else {
                  await ProductStock.update(
                    {
                      status: Constants.DELETE,
                    },
                    {
                      where: {
                        id: productStockIdArr,
                      },
                    }
                  )

                  await ProductStockDetails.update(
                    {
                      status: Constants.DELETE,
                    },
                    {
                      where: {
                        id: productStockDetailIdArr,
                      },
                    }
                  )
                  if (skuErr) {
                    return Response.successResponseWithoutData(
                      res,
                      res.__('SkuAlreadyExist'),
                      Constants.FAIL
                    )
                  }

                  if (upcErr) {
                    return Response.successResponseWithoutData(
                      res,
                      res.__('UpcCodeAlreadyExist'),
                      Constants.FAIL
                    )
                  }
                }
              })
          }
        }
      }
    )
  },

  /**
   * @description 'product Upload Image function'
   * @param req
   * @param res
   */
  productUploadImage: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForProductImageUpload(
      requestParams,
      res,
      async (validate) => {
        if (validate) {
          let image = false

          const extension =
            requestParams.image && requestParams.image !== ''
              ? requestParams.image.split(';')[0].split('/')[1]
              : ''
          const randomNumber = await Helper.makeRandomDigit(5)
          const imageName =
            requestParams.image && requestParams.image !== ''
              ? `${moment().unix()}${randomNumber}.${extension}`
              : ''
          const imageExtArr = [
            'jpg',
            'jpeg',
            'png',
            'mp4',
            'mkv',
            'webm',
            'WEBM',
          ]
          if (imageName && !imageExtArr.includes(extension)) {
            return Response.errorResponseWithoutData(
              res,
              res.__('imageInvalid'),
              Constants.FAIL
            )
          }

          await Helper.imageSizeValidation(requestParams.image, req, res)

          // eslint-disable-next-line no-shadow
          const product = {
            product_id: requestParams.product_id,
            product_stock_id: requestParams.product_stock_id,
            sort_order: requestParams.sort_order,
            media_type: requestParams.media_type,
          }

          if (requestParams.id) {
            ProductImage.findOne({
              where: {
                id: requestParams.id,
                status: {
                  [Op.ne]: Constants.DELETE,
                },
              },
            })
              .then(async (productData) => {
                image = true
                if (image) {
                  product.image = imageName
                }
                if (productData) {
                  const oldImage = productData.image

                  await productData
                    .update(product, {
                      where: {
                        id: requestParams.id,
                      },
                    })
                    .then(async (result) => {
                      if (result) {
                        const productData = await Product.findByPk(
                          requestParams.product_id
                        )
                        if (productData) {
                          if (!productData.display_image) {
                            await Product.update(
                              {
                                display_image: imageName,
                              },
                              {
                                where: {
                                  id: requestParams.product_id,
                                },
                              }
                            )
                          }
                        }

                        if (image) {
                          const imageUpload = await Helper.uploadImage(
                            imageName,
                            Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                            req,
                            res
                          )
                          if (imageUpload.code === 200) {
                            await Helper.removeOldImage(
                              oldImage,
                              Constants.PRODUCT_STOCKS_DETAIL_IMAGE
                            )
                          }
                        }
                        return Response.successResponseWithoutData(
                          res,
                          res.locals.__('ProductImageUpdatedSuccessfully'),
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
                } else {
                  Response.successResponseWithoutData(
                    res,
                    res.__('ProductImageNotExist'),
                    Constants.FAIL
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
          } else {
            product.image = imageName

            await ProductImage.create(product)
              .then(async (result) => {
                if (result) {
                  const productData = await Product.findByPk(
                    requestParams.product_id
                  )
                  if (productData) {
                    if (!productData.display_image) {
                      await Product.update(
                        {
                          display_image: imageName,
                        },
                        {
                          where: {
                            id: requestParams.product_id,
                          },
                        }
                      )
                    }
                  }
                  await Helper.uploadImage(
                    imageName,
                    Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                    req,
                    res
                  )
                  await Helper.uploadImage(
                    imageName,
                    Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                    req,
                    res
                  )
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('ProductImageCreatedSuccessfully'),
                    Constants.SUCCESS
                  )
                }
                return null
              })
              .catch(async () => {
                Response.errorResponseData(
                  res,
                  res.__('internalError'),
                  Constants.INTERNAL_SERVER
                )
              })
          }
          return null
        } else {
          Response.errorResponseData(
            res,
            res.__('error'),
            Constants.INTERNAL_SERVER
          )
        }
        return null
      }
    )
  },
}
