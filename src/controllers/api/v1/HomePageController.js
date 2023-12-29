const BannerController = require('../../../controllers/api/v1/BannerController')
const CategoryController = require('../../../controllers/api/v1/CategoryController')
const VideoController = require('../../../controllers/api/v1/VideoController')
const BrandController = require('../../../controllers/api/v1/BrandController')
const BlogController = require('../../../controllers/api/v1/BlogController')
const Response = require('../../../services/Response')
const { product } = require('../../../transformers/api/ProductTransformer')
const Transformer = require('object-transformer')
const { brandWithoutId } = require('../../../transformers/api/BrandTransformer')
const {
  bannerWithOutId,
} = require('../../../transformers/api/BannerTransformer')
const { blogWithOutId } = require('../../../transformers/api/BlogTransformer')
const {
  categoryListWithoutId,
} = require('../../../transformers/api/CategoryTransformer')
const {
  videoListWithoutId,
} = require('../../../transformers/api/VideoTransformer')
const Helper = require('../../../services/Helper')
const FeatureCategoryController = require('./FeatureCategoryController')
const {
  ACTIVE,
  PRODUCT_STOCKS_DETAIL_IMAGE,
  BRAND_BANNER_IMAGE,
  SUCCESS,
  HOME_PER_PAGE,
} = require('../../../services/Constants')
const { Op } = require('sequelize')
const {
  Product,
  ProductStockDetails,
  ProductStock,
  ProductImage,
  ProductFlavors,
  Favorites,
  ProductInventory,
} = require('../../../models')

module.exports = {
  getHomeContant: async (req, res) => {
    const { recently_viewed } = req
    const { authCustomerId } = req
    const reqParams = req.body
    const offsets = req.body.per_page
    const page = req.body.page

    let limit = HOME_PER_PAGE
    if (reqParams.per_page && reqParams.per_page > 0) {
      limit = parseInt(reqParams.per_page, 10)
    }
    let pageNo = 1
    if (reqParams.page && reqParams.page > 0) {
      pageNo = parseInt(reqParams.page, 10)
    }
    const offset = (pageNo - 1) * limit
    const banner = await BannerController.newBannersList(1)

    const dealsOfTheDay = await BannerController.newBannersList(2)

    const simpleCategory = await CategoryController.categoryList(
      offset,
      page,
      '',
      0
    )
    const category = new Transformer.List(
      simpleCategory,
      categoryListWithoutId
    ).parse()

    const simpleBrand = await BrandController.brandList(offsets, page)
    const brand = new Transformer.List(simpleBrand, brandWithoutId).parse()
    brand.map((data) => {
      data.banner_image = Helper.mediaUrlForS3(
        BRAND_BANNER_IMAGE,
        data.banner_image
      )
    })
    const simpleVideo = await VideoController.getAllVideoList(offsets, page)
    const video = new Transformer.List(simpleVideo, videoListWithoutId).parse()

    video.map((data) => {
      const { link } = data
      const temp = link.split('=')
      data.image = `https://img.youtube.com/vi/${temp[1]}/maxresdefault.jpg`
    })
    const simpleBlog = await BlogController.getBlogList(offsets, page)
    const blog = new Transformer.List(simpleBlog, blogWithOutId).parse()

    const fixCategory = await FeatureCategoryController.fixFetureCategory(
      req,
      res
    )
    let recentlyViewed
    if (recently_viewed !== null) {
      recentlyViewed = recently_viewed.split(',')
    } else {
      recentlyViewed = []
    }

    const products = await Product.findAll({
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
          where: {
            customer_id: authCustomerId,
            is_favorite: ACTIVE,
          },
          attributes: ['is_favorite'],
          required: false,
        },
      ],
      where: {
        status: ACTIVE,
        id: {
          [Op.in]: recentlyViewed,
        },
      },
      attributes: ['id', 'name', 'slug', 'discount_type', 'discount_value'],
    })
    for (let data of products) {
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
    }

    //fixfeturecategory = clearence sale, flash sale
    //fetureCategory = best seller, trending,pocket friendly
    //othercategory= limited time offer,newly added,recently viewed

    for (const productItem of products) {
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
    const Products = new Transformer.List(products, product).parse()
    const recently_viewed_product = {
      name: 'Recently Viewed',
      slug: 'recently-viewed',
      start_date: '',
      end_date: '',
      image: '',
      FeatureCategoryProducts: Products,
    }
    fixCategory.push(recently_viewed_product)

    const newlyAddedProduct = await Product.findAll({
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
          where: {
            customer_id: authCustomerId,
            is_favorite: ACTIVE,
          },
          attributes: ['is_favorite'],
          required: false,
        },
      ],
      where: {
        status: ACTIVE,
      },
      order: [['createdAt', 'DESC']],
      limit: 8,
      attributes: [
        'id',
        'name',
        'slug',
        'discount_type',
        'discount_value',
        'createdAt',
      ],
    })
    for (let data of newlyAddedProduct) {
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
    }
    for (const productItem of newlyAddedProduct) {
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
    const newlyAddedProducts = new Transformer.List(
      newlyAddedProduct,
      product
    ).parse()
    const newly_added = {
      name: 'Newly Added',
      slug: 'newly-added',
      start_date: '',
      end_date: '',
      image: '',
      FeatureCategoryProducts: newlyAddedProducts,
    }
    fixCategory.push(newly_added)

    let fixFeaturecategory = []
    let fetureCategory = []
    let othercategory = []
    for (let category of fixCategory) {
      if (category.slug === 'clearance-sale') {
        fixFeaturecategory.push(category)
      } else if (category.slug === 'flash-sale') {
        fixFeaturecategory.push(category)
      } else if (category.slug === 'limited-time-offers') {
        othercategory.push(category)
      } else if (category.slug === 'newly-added') {
        othercategory.push(category)
      } else if (category.slug === 'recently-viewed') {
        othercategory.push(category)
      } else {
        fetureCategory.push(category)
      }
    }

    const extra = []
    extra.per_page = limit
    extra.page = pageNo
    return Response.successResponseData(
      res,
      {
        banner,
        dealsOfTheDay,
        category,
        brand,
        video,
        blog,
        fixFeaturecategory,
        othercategory,
        fetureCategory,
      },
      SUCCESS,
      res.locals.__('success'),
      extra
    )
  },
}
