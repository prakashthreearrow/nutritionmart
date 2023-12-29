const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const { product } = require('../../../transformers/api/ProductTransformer')
const helper = require('../../../services/Helper')
const {
  categoryList,
  categoryName,
  categoryListWithoutId,
} = require('../../../transformers/api/CategoryTransformer')
const {
  SUCCESS,
  ACTIVE,
  CATEGORY_APP_IMAGE,
  CATEGORY_WEB_IMAGE,
  CATEGORY_IMAGE,
  PRODUCT_STOCKS_DETAIL_IMAGE,
  CATEGORY_ICON_IMAGE,
  PRODUCT_DISPLAY_IMAGE,
  FEATURED_CATEGORIES_IMAGE,
  INTERNAL_SERVER,
  FAIL,
  PER_PAGE,
} = require('../../../services/Constants')
const {
  Category,
  Product,
  Favorites,
  ProductStockDetails,
  ProductStock,
  ProductInventory,
  ProductFlavors,
  FeatureCategoryProduct,
  FeatureCategory,
  ProductImage,
} = require('../../../models')
const Helper = require('../../../services/Helper')

module.exports = {
  /**
   * @description Category list with sub category
   * @param req
   * @param res
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

    let query = {
      parent_id: 0,
      status: ACTIVE,
    }

    if (requestParams.search && requestParams.search !== '') {
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }
    await Category.findAndCountAll({
      include: [
        {
          model: Category,
          attributes: ['slug', 'name'],
          where: {
            status: ACTIVE,
          },
        },
      ],
      order: [
        ['sequence_number', 'ASC'],
        [Category, 'sequence_number', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      where: query,
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        Object.keys(result).forEach((key) => {
          if ({}.hasOwnProperty.call(result, key)) {
            const allCetagory = {
              name: 'All',
              slug: result[key].slug,
            }
            result[key].sub_category = data.rows[key].Categories
            result[key].sub_category.splice(0, 0, allCetagory)
            result[key].sub_category_count =
              data.rows[key].Categories.length - 1
            result[key].image = helper.mediaUrlForS3(
              CATEGORY_IMAGE,
              result[key].image
            )
            result[key].app_image = helper.mediaUrlForS3(
              CATEGORY_APP_IMAGE,
              result[key].app_image
            )
            result[key].web_image = helper.mediaUrlForS3(
              CATEGORY_WEB_IMAGE,
              result[key].web_image
            )
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, categoryList).parse(),
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
    })
  },
  async categoryList(per_page, page, search, parentCategory) {
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
    if (parentCategory === 0) {
      query = {
        ...query,
        parent_id: {
          [Op.ne]: `${parentCategory}`,
        },
      }
    }
    const sorting = [
      ['sequence_number', 'DESC'],
      ['updatedAt', 'DESC'],
    ]
    let categoryArray = []
    await Category.findAndCountAll({
      where: query,
      offset: offset,
      limit: limit,
      order: sorting,
      distinct: true,
    }).then((data, err) => {
      const count = +data.count
      if (count > 0) {
        const newdata = data.rows
        newdata.map((data) => {
          data.icon_image = Helper.mediaUrlForS3(
            CATEGORY_ICON_IMAGE,
            data.icon_image
          )
          data.image = Helper.mediaUrlForS3(CATEGORY_IMAGE, data.image)
          data.app_image = helper.mediaUrlForS3(
            CATEGORY_APP_IMAGE,
            data.app_image
          )
          data.web_image = helper.mediaUrlForS3(
            CATEGORY_WEB_IMAGE,
            data.web_image
          )
        })
        categoryArray = new Transformer.List(
          newdata,
          categoryListWithoutId
        ).parse()
      }
    })
    return categoryArray
  },

  detailOnSubCategory: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
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
    }
    // if(authCustomerId){
    //   query = {
    //     ...query,
    //     customer_id: authCustomerId,
    //     is_favorite: ACTIVE,
    //   }
    // }
    const { slug } = req.params
    const detail = await Category.findOne({
      where: {
        slug: slug,
        status: ACTIVE,
      },
      attributes: [
        'id',
        'name',
        'slug',
        'app_image',
        'web_image',
        'description',
        'parent_id',
      ],
    })
    let subCategory
    let mainCategory
    if (detail) {
      if (detail.parent_id === 0) {
        query = {
          ...query,
          category_id: {
            [Op.eq]: `${detail.id}`,
          },
        }
        subCategory = await Category.findAll({
          where: {
            parent_id: detail.id,
            status: ACTIVE,
          },
          attributes: ['slug', 'name'],
        })
        mainCategory = { slug: detail.slug }
      } else {
        query = {
          ...query,
          sub_category_id: {
            [Op.eq]: `${detail.id}`,
          },
        }
        subCategory = await Category.findAll({
          where: {
            parent_id: detail.parent_id,
            status: ACTIVE,
          },
          attributes: ['slug', 'name'],
        })

        mainCategory = await Category.findOne({
          where: {
            id: detail.parent_id,
            status: ACTIVE,
          },
          attributes: ['slug'],
        })
      }

      const categoryProduct = await Product.findAndCountAll({
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
                required: true,
                attributes: ['mrp_price', 'customer_price', 'size'],
              },
              {
                model: ProductFlavors,
                attributes: ['id', 'flavor_name'],
              },
              {
                model: ProductImage,
                required: true,
                attributes: ['image', 'sort_order', 'image', 'media_type'],
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
        where: query,
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
        distinct: true,
      })
      for (const productItem of categoryProduct.rows) {
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
      categoryProduct.rows.map((data) => {
        if (data.Favorite !== null) {
          data.is_favorite = data.Favorite.is_favorite
        } else {
          data.is_favorite = 0
        }
        data.display_image = data.display_image ? data.display_image : ''
        if (data.ProductStocks[0] !== null) {
          if (data.ProductStocks[0].ProductStockDetails[0] !== null) {
            data.mrp_price =
              data.ProductStocks[0].ProductStockDetails[0].mrp_price
            data.customer_price =
              data.ProductStocks[0].ProductStockDetails[0].customer_price
            data.size = data.ProductStocks[0].ProductStockDetails[0].size
          }
          data.display_image = data.display_image ? data.display_image : ''
          if (data.ProductStocks[0] !== null) {
            if (data.ProductStocks[0].ProductStockDetails[0] !== null) {
              data.mrp_price =
                data.ProductStocks[0].ProductStockDetails[0].mrp_price
              data.customer_price =
                data.ProductStocks[0].ProductStockDetails[0].customer_price
              data.size = data.ProductStocks[0].ProductStockDetails[0].size
            }
            if (data.ProductStocks[0].ProductImages[0]) {
              data.display_image = Helper.mediaUrlForS3(
                PRODUCT_STOCKS_DETAIL_IMAGE,
                data.ProductStocks[0].ProductImages[0].image
              )
            }
          }
        }
        data.rating = 0
      })
      const result = detail
      const allBUtton = {
        name: 'All',
        slug: mainCategory.slug,
      }
      subCategory.splice(0, 0, allBUtton)
      Object.keys(result).forEach((key) => {
        delete result[key].id
        delete result[key].parent_id

        result[key].subcategoryList = subCategory
        delete result[key].Categories
        result[key].productcount = categoryProduct.count
        result[key].app_image = helper.mediaUrlForS3(
          CATEGORY_APP_IMAGE,
          result[key].app_image
        )
        const td = new Transformer.List(categoryProduct.rows, product).parse()
        result[key].products = td
        result[key].web_image = helper.mediaUrlForS3(
          CATEGORY_WEB_IMAGE,
          result[key].web_image
        )
      })
      const extra = []
      extra.per_page = limit
      extra.total = categoryProduct.count
      extra.page = pageNo
      return Response.successResponseData(
        res,
        result,
        SUCCESS,
        res.locals.__('success'),
        extra
      )
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidSlug'),
        FAIL
      )
    }
  },
}
