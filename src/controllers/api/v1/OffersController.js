const {
  Offers,
  Product,
  ProductStock,
  ProductImage,
  ProductViewCount,
  ProductFlavors,
  ProductInventory,
  Favorites,
  ProductStockDetails,
} = require('../../../models')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const Constants = require('../../../services/Constants')
const { offer } = require('../../../transformers/api/OffersTransformer')
const { product } = require('../../../transformers/api/ProductTransformer')
const {
  product_view_count,
} = require('../../../transformers/api/ProductViewCountTransformer')
const Response = require('../../../services/Response')
const Helper = require('../../../services/Helper')
const {
  OFFER_IMAGE,
  ACTIVE,
  PRODUCT_DISPLAY_IMAGE,
  PER_PAGE,
  BAD_REQUEST,
  SUCCESS,
  INTERNAL_SERVER,
  PRODUCT_STOCKS_DETAIL_IMAGE,
} = require('../../../services/Constants')

module.exports = {
  /**
   * @description detail of offers
   * @param req
   * @param res
   * */

  getOffresListByType: async (req, res) => {
    let query = {
      status: {
        [Op.eq]: [Constants.ACTIVE],
      },
      end_date: {
        [Op.gte]: Date.now(),
      },
    }
    let sorting = [['updatedAt', 'DESC']]
    await Offers.findAll({
      where: query,
      order: sorting,
    }).then((data) => {
      if (data) {
        data.map((datas) => {
          if (datas.coupon_code !== null) {
            datas.coupon_code = datas.coupon_code.toString()
          } else {
            datas.coupon_code = ''
          }
          datas.discount = datas.discount ? +datas.discount : 0
          datas.discount_unit = datas.discount_unit ? +datas.discount_unit : 0
          datas.terms_condition = datas.terms_condition
            ? datas.terms_condition
            : ''
          datas.minimum_order_amount = datas.minimum_order_amount
            ? +datas.minimum_order_amount
            : 0
          datas.maximum_discount = datas.maximum_discount
            ? +datas.maximum_discount
            : 0
          datas.maximum_usage = datas.maximum_usage ? +datas.maximum_usage : 0
          datas.device = datas.device ? +datas.device : 0
          datas.image = datas.image ? datas.image : ''
          datas.offer_type = datas.offer_type ? +datas.offer_type : 0
          datas.start_date = datas.start_date ? datas.start_date : ''

          datas.payment_method_ids = datas.payment_method_ids
            ? datas.payment_method_ids
            : ''
          if (datas.payment_method_ids !== '') {
            datas.payment_method_ids = datas.payment_method_ids.split(',')
          } else {
            datas.payment_method_ids = []
          }
          datas.end_date = datas.end_date ? datas.end_date : ''
          datas.user_type = datas.user_type ? +datas.user_type : 0
          if (datas.bulk_product_number === null) {
            datas.bulk_product_number = []
          } else {
            datas.bulk_product_number = JSON.parse(datas.bulk_product_number)
          }
          Object.keys(datas).forEach((key) => {
            if ({}.hasOwnProperty.call(datas, key)) {
              datas[key].start_date = Helper.utctolocaldate(
                datas[key].start_date
              )
              datas[key].discount = +datas[key].discount
              datas[key].end_date = Helper.utctolocaldate(datas[key].end_date)
              datas[key].image = Helper.mediaUrlForS3(
                OFFER_IMAGE,
                datas[key].image
              )
            }
          })
        })
      } else {
        return Response.successResponseData(
          res,
          null,
          SUCCESS,
          res.locals.__('noDataFound')
        )
      }
      const transformeddata = new Transformer.List(data, offer).parse()
      const bulkOffres = transformeddata.filter((data) => data.offer_type === 1)
      const paymentOffres = transformeddata.filter(
        (data) => data.offer_type === 2
      )
      const coupanCodeOffres = transformeddata.filter(
        (data) => data.offer_type === 3
      )
      return Response.successResponseData(
        res,
        { bulkOffres, paymentOffres, coupanCodeOffres },
        Constants.SUCCESS,
        res.locals.__('success')
      )
    })
  },

  getProductListByOffer: async (req, res) => {
    const { authCustomerId } = req
    const requestParams = req.body
    // sortby = 0->popularity;1->low to high;2->high to low
    const idOffer = req.params.id
    let limit = PER_PAGE
    if (requestParams.per_page && requestParams.per_page > 0) {
      limit = parseInt(requestParams.per_page, 10)
    }
    let pageNo = 1
    if (requestParams.page && requestParams.page > 0) {
      pageNo = parseInt(requestParams.page, 10)
    }
    const offset = (pageNo - 1) * limit

    const id = idOffer
    if (id) {
      const offerType = await Offers.findOne({
        where: {
          id: id,
          status: ACTIVE,
          end_date: {
            [Op.gte]: Date.now(),
          },
        },
        attributes: [
          'offer_type',
          'product_brand_id',
          'product_subcategory_id',
          'product_category_id',
          'product_id',
          'end_date',
        ],
      })
      let query = {
        status: ACTIVE,
      }
      let vquery = {
        status: ACTIVE,
      }
      let orderby
      if (
        offerType &&
        offerType.offer_type === 3 &&
        offerType.end_date > Date.now()
      ) {
        if (offerType.product_brand_id) {
          offerType.product_brand_id = offerType.product_brand_id
            .toString()
            .split(',')
          query = {
            ...query,
            [Op.or]: [
              {
                brand_id: {
                  [Op.in]: offerType.product_brand_id,
                },
              },
            ],
          }
        }
        if (offerType.product_subcategory_id) {
          offerType.product_subcategory_id = offerType.product_subcategory_id
            .toString()
            .split(',')
          query = {
            ...query,
            [Op.or]: [
              {
                sub_category_id: {
                  [Op.in]: offerType.product_subcategory_id,
                },
              },
            ],
          }
        }
        if (offerType.product_category_id) {
          offerType.product_category_id = offerType.product_category_id
            .toString()
            .split(',')
          query = {
            ...query,
            [Op.or]: [
              {
                category_id: {
                  [Op.in]: offerType.product_category_id,
                },
              },
            ],
          }
        }
      }
      if (
        offerType &&
        offerType.offer_type === 1 &&
        offerType.end_date > Date.now()
      ) {
        if (offerType.product_id !== null) {
          const joinProductIds = offerType.product_id
          if (joinProductIds) {
            products = joinProductIds.split(',')
          }
          const productId = []
          products.forEach((commentId) => {
            if (productId.indexOf(commentId) === -1) {
              productId.push(+commentId)
            }
          })
          query = {
            ...query,
            id: {
              [Op.in]: productId,
            },
          }
          vquery = {
            product_id: {
              [Op.in]: productId,
            },
          }
        }
      }
      if (!offerType || offerType.end_date < Date.now()) {
        return Response.errorResponseData(res, res.__('invalidOffer'))
      }
      // const viewCount = await ProductViewCount.findAll({
      //   where: vquery,
      //   attributes: ['product_id', 'view_count'],
      // })
      // const V_count = new Transformer.List(
      //   viewCount,
      //   product_view_count
      // ).parse()
      // const totalView = []
      // V_count.forEach((data) => {
      //   const index = totalView.findIndex(
      //     (item) => item.product_id === data.product_id
      //   )
      //   if (index === -1) {
      //     totalView.push(data)
      //   } else {
      //     const item = totalView.find(
      //       (item) => item.product_id === data.product_id
      //     )
      //     const itemIndex = totalView.findIndex(
      //       (item) => item.product_id === data.product_id
      //     )
      //     const total_view_count = item.view_count + data.view_count
      //     const object = {
      //       product_id: item.product_id,
      //       view_count: total_view_count,
      //     }
      //     totalView.splice(itemIndex, 1)
      //     totalView.push(object)
      //   }
      // })

      if (requestParams.sortby === 2) {
        orderby = [
          [ProductStock, ProductStockDetails, 'customer_price', 'DESC'],
        ]
      } else if (requestParams.sortby === 1) {
        orderby = [[ProductStock, ProductStockDetails, 'customer_price', 'ASC']]
      } else if (requestParams.sortby === 0) {
      }
      const productBySubCategory = await Product.findAndCountAll({
        include: [
          {
            model: ProductStock,
            attributes: ['id'],
            required: true,
            include: [
              {
                model: ProductStockDetails,
                attributes: ['id', 'mrp_price', 'customer_price', 'size'],
                required: true,
              },
              {
                model: ProductFlavors,
                attributes: ['id', 'flavor_name'],
                required: false,
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
        distinct: true,
        order: orderby,
        offset: offset,
        limit: limit,
      })
      for (const productItem of productBySubCategory.rows) {
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
      Object.keys(productBySubCategory.rows).forEach((key) => {
        if ({}.hasOwnProperty.call(productBySubCategory.rows, key)) {
          if (productBySubCategory.rows[key].Favorite !== null) {
            productBySubCategory.rows[key].is_favorite =
              productBySubCategory.rows[key].Favorite.is_favorite
          } else {
            productBySubCategory.rows[key].is_favorite = 0
          }
          productBySubCategory.rows[key].rating = 0
          if (productBySubCategory.rows[key].ProductStocks[0] !== null) {
            if (
              productBySubCategory.rows[key].ProductStocks[0]
                .ProductStockDetails[0] !== null
            ) {
              productBySubCategory.rows[key].mrp_price =
                productBySubCategory.rows[
                  key
                ].ProductStocks[0].ProductStockDetails[0].mrp_price
              productBySubCategory.rows[key].customer_price =
                productBySubCategory.rows[
                  key
                ].ProductStocks[0].ProductStockDetails[0].customer_price
              productBySubCategory.rows[key].size =
                productBySubCategory.rows[
                  key
                ].ProductStocks[0].ProductStockDetails[0].size
            }
            if (
              productBySubCategory.rows[key].ProductStocks[0]
                .ProductImages[0] !== null
            ) {
              productBySubCategory.rows[
                key
              ].display_image = Helper.mediaUrlForS3(
                PRODUCT_STOCKS_DETAIL_IMAGE,
                productBySubCategory.rows[key].ProductStocks[0].ProductImages[0]
                  .image
              )
            }
          }
        }
      })
      const transformeddata = new Transformer.List(
        productBySubCategory.rows,
        product
      ).parse()

      const extra = []
      extra.per_page = limit
      extra.total = productBySubCategory.count
      extra.page = pageNo
      return Response.successResponseData(
        res,
        transformeddata,
        SUCCESS,
        res.locals.__('success'),
        extra
      )
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidOffer'),
        Constants.FAIL
      )
    }
  },

  offerDetail: async (req, res) => {
    const id = req.params.id
    if (id) {
      let query = {
        id: id,
        status: {
          [Op.eq]: [Constants.ACTIVE],
        },
      }
      let sorting = [['updatedAt', 'DESC']]
      await Offers.findOne({
        where: query,
        order: sorting,
      }).then((data) => {
        if (data) {
          if (data.coupon_code !== null) {
            data.coupon_code = data.coupon_code.toString()
          } else {
            data.coupon_code = ''
          }
          data.discount = data.discount ? +data.discount : 0
          data.discount_unit = data.discount_unit ? data.discount_unit : 0
          data.terms_condition = data.terms_condition
            ? data.terms_condition
            : ''
          data.minimum_order_amount = data.minimum_order_amount
            ? +data.minimum_order_amount
            : 0
          data.maximum_discount = data.maximum_discount
            ? +data.maximum_discount
            : 0
          data.maximum_usage = data.maximum_usage ? data.maximum_usage : 0
          data.device = data.device ? data.device : 0
          data.product_category_id = data.product_category_id
            ? data.product_category_id
            : ''

          data.payment_method_ids = data.payment_method_ids
            ? data.payment_method_ids
            : ''
          if (data.payment_method_ids !== '') {
            data.payment_method_ids = data.payment_method_ids.split(',')
          } else {
            data.payment_method_ids = []
          }
          data.offer_type = data.offer_type ? data.offer_type : 0
          data.user_type = data.user_type ? data.user_type : 0
          if (data.bulk_product_number === null) {
            data.bulk_product_number = []
          } else {
            data.bulk_product_number = JSON.parse(data.bulk_product_number)
          }

          const offerDetail = new Transformer.Single(data, offer).parse()
          offerDetail.start_date = offerDetail.start_date
            ? Helper.utctolocaldate(offerDetail.start_date)
            : ''
          offerDetail.end_date = offerDetail.end_date
            ? Helper.utctolocaldate(offerDetail.end_date)
            : ''
          offerDetail.image = offerDetail.image
            ? Helper.mediaUrlForS3(OFFER_IMAGE, offerDetail.image)
            : ''
          return Response.successResponseData(
            res,
            offerDetail,
            SUCCESS,
            res.locals.__('success')
          )
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('pleaseEnterValidOffer'),
            Constants.FAIL
          )
        }
      })
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidOffer'),
        Constants.FAIL
      )
    }
  },

  couponCodeDetail: async (req, res) => {
    const name = req.params.name
    if (name) {
      let query = {
        name: name,
        status: {
          [Op.eq]: [Constants.ACTIVE],
        },
      }
      let sorting = [['updatedAt', 'DESC']]
      await Offers.findOne({
        where: query,
        order: sorting,
      }).then((data) => {
        if (data) {
          if (data.coupon_code !== null) {
            data.coupon_code = data.coupon_code.toString()
          } else {
            data.coupon_code = ''
          }
          data.discount = data.discount ? +data.discount : 0
          data.discount_unit = data.discount_unit ? data.discount_unit : 0
          data.terms_condition = data.terms_condition
            ? data.terms_condition
            : ''
          data.minimum_order_amount = data.minimum_order_amount
            ? +data.minimum_order_amount
            : 0
          data.maximum_discount = data.maximum_discount
            ? +data.maximum_discount
            : 0
          data.maximum_usage = data.maximum_usage ? data.maximum_usage : 0
          data.device = data.device ? data.device : 0
          data.product_category_id = data.product_category_id
            ? data.product_category_id
            : ''

          data.payment_method_ids = data.payment_method_ids
            ? data.payment_method_ids
            : ''
          if (data.payment_method_ids !== '') {
            data.payment_method_ids = data.payment_method_ids.split(',')
          } else {
            data.payment_method_ids = []
          }
          data.offer_type = data.offer_type ? data.offer_type : 0
          data.user_type = data.user_type ? data.user_type : 0
          if (data.bulk_product_number === null) {
            data.bulk_product_number = []
          } else {
            data.bulk_product_number = JSON.parse(data.bulk_product_number)
          }

          const offerDetail = new Transformer.Single(data, offer).parse()
          offerDetail.start_date = offerDetail.start_date
            ? Helper.utctolocaldate(offerDetail.start_date)
            : ''
          offerDetail.end_date = offerDetail.end_date
            ? Helper.utctolocaldate(offerDetail.end_date)
            : ''
          offerDetail.image = offerDetail.image
            ? Helper.mediaUrlForS3(OFFER_IMAGE, offerDetail.image)
            : ''
          return Response.successResponseData(
            res,
            offerDetail,
            SUCCESS,
            res.locals.__('success')
          )
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('pleaseEnterValidOffer'),
            Constants.FAIL
          )
        }
      })
    } else {
      return Response.successResponseWithoutData(
        res,
        res.locals.__('pleaseEnterValidOffer'),
        Constants.FAIL
      )
    }
  },
}
