const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const {
  ACTIVE,
  SUCCESS,
  BRAND_IMAGE,
  PER_PAGE,
  INTERNAL_SERVER,
  FAIL,
  PRODUCT_STOCKS_DETAIL_IMAGE,
  BRAND_BANNER_IMAGE,
} = require('../../../services/Constants')
const Helper = require('../../../services/Helper')
const {
  Brand,
  Product,
  ProductStockDetails,
  ProductStock,
  Favorites,
  ProductInventory,
  ProductFlavors,
  PRODUCT_DISPLAY_IMAGE,
  ProductImage,
} = require('../../../models')
const { brand } = require('../../../transformers/api/BrandTransformer')
const { Op } = require('sequelize')
const Sequelize = require('sequelize')
const { product } = require('../../../transformers/api/ProductTransformer')
module.exports = {
  /**
   * @description This function is use to generate list of Brand
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  get: async (req, res) => {
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

    await Brand.findAndCountAll({
      where: { status: ACTIVE },
      attributes: ['image', 'name', 'slug', 'banner_image'],
      order: [
        ['sequence_number', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows && data.rows.length > 0) {
        const result = data.rows
        Object.keys(result).forEach((key) => {
          if ({}.hasOwnProperty.call(result, key)) {
            result[key].image = Helper.mediaUrlForS3(
              BRAND_IMAGE,
              result[key].image
            )
            result[key].banner_image = Helper.mediaUrlForS3(
              BRAND_BANNER_IMAGE,
              result[key].banner_image
            )
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, brand).parse(),
          SUCCESS,
          res.locals.__('success'),
          extra
        )
      }
      return Response.successResponseData(
        res,
        [],
        SUCCESS,
        res.locals.__('noDataFound')
      )
    })
  },
  async brandList(per_page, page, search) {
    let limit = PER_PAGE
    if (per_page && per_page > 0) {
      limit = parseInt(per_page, 10)
    }
    let pageNo = 1
    if (page && page > 0) {
      pageNo = parseInt(page, 10)
    }
    const offset = (pageNo - 1) * limit

    let query = {
      status: ACTIVE,
    }

    if (search && search !== '') {
      query = {
        ...query,
        name: {
          [Op.like]: `%${search}%`,
        },
      }
    }
    let brandArray = []
    let sorting = [
      ['sequence_number', 'ASC'],
      ['updatedAt', 'DESC'],
    ]
    await Brand.findAndCountAll({
      where: query,
      offset: offset,
      limit: limit,
      order: sorting,
      distinct: true,
    })
      .then((data, err) => {
        const count = +data.count
        if (count > 0) {
          const newdata = new Transformer.List(data.rows, brand).parse()
          newdata.map((data) => {
            data.image = Helper.mediaUrlForS3(BRAND_IMAGE, data.image)
          })
          brandArray = newdata
        }
      })
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('somethingWentWrong'),
          INTERNAL_SERVER
        )
      })
    return brandArray
  },
  getBrandDetail: async (req, res) => {
    const { authCustomerId } = req
    const slug = req.params.slug
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
    //todo review of product
    if (slug) {
      const brandDetail = await Brand.findOne({
        where: {
          status: ACTIVE,
          slug: slug,
        },
        attributes: ['id', 'name', 'description', 'slug', 'banner_image'],
      })
      if (brandDetail) {
        const products = await Product.findAndCountAll({
          include: [
            {
              model: ProductStock,
              where: {
                is_default: ACTIVE,
              },
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
                  // required:true
                },
              ],
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
            brand_id: brandDetail.id,
            status: ACTIVE,
          },
          offset: offset,
          limit: limit,
          attributes: [
            'id',
            'name',
            'slug',
            'display_image',
            'discount_type',
            'discount_value',
          ],
        })
        for (const productItem of products.rows) {
          const product_inventory = await Product.findOne({
            include: [
              {
                model: ProductInventory,
                where: {
                  flavor_id: productItem.ProductStocks[0].ProductFlavor.id,
                  product_id: productItem.id,
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
        const result = brandDetail
        Object.keys(result).forEach((key) => {
          result[key].banner_image = Helper.mediaUrlForS3(
            BRAND_BANNER_IMAGE,
            result[key].banner_image
          )
          result[key].totalproducts = products.count
          products.rows.map((data) => {
            if (data.Favorite !== null) {
              data.is_favorite = data.Favorite.is_favorite
            } else {
              data.is_favorite = 0
            }
            if (data.ProductStocks[0] !== null) {
              if (data.ProductStocks[0].ProductStockDetails[0] !== null) {
                data.mrp_price =
                  data.ProductStocks[0].ProductStockDetails[0].mrp_price
                data.customer_price =
                  data.ProductStocks[0].ProductStockDetails[0].customer_price
                data.size = data.ProductStocks[0].ProductStockDetails[0].size
              }
              if (data.ProductStocks[0].ProductImages[0] !== null) {
                data.display_image = Helper.mediaUrlForS3(
                  PRODUCT_STOCKS_DETAIL_IMAGE,
                  data.ProductStocks[0].ProductImages[0].image
                )
              }
            }
            data.display_image = data.display_image ? data.display_image : ''
            data.rating = 0
          })
          const td = new Transformer.List(products.rows, product).parse()
          result[key].products = td
        })
        const extra = []
        extra.per_page = limit
        extra.total = products.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          result,
          SUCCESS,
          res.locals.__('success'),
          extra
        )
      } else {
        Response.successResponseWithoutData(
          res,
          res.__('activebrandSlugRequired'),
          FAIL
        )
      }
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidSlug'),
        FAIL
      )
    }
  },
}
