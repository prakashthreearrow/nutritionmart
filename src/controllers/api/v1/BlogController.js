const { Op } = require('sequelize')
const requestIp = require('request-ip')
const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const {
  ACTIVE,
  SUCCESS,
  PER_PAGE,
  BLOG_IMAGE,
  FAIL,
  INTERNAL_SERVER,
  BAD_REQUEST,
} = require('../../../services/Constants')
const Helper = require('../../../services/Helper')
const { Blog, BlogCategory, BlogViewCount } = require('../../../models')
const {
  blog,
  blogDetail,
} = require('../../../transformers/api/BlogTransformer')

module.exports = {
  /**
   * @description 'This function is use to generate list of Blog'
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

    let query = { status: ACTIVE }
    if (requestParams.search && requestParams.search !== '') {
      query = {
        ...query,
        [Op.or]: {
          title: { [Op.like]: `${requestParams.search}` },
        },
      }
    }
    // TODO category filter
    await Blog.findAndCountAll({
      include: {
        model: BlogCategory,
        attributes: ['title'],
      },
      where: query,
      order: [['updatedAt', 'DESC']],
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows && data.rows.length > 0) {
        const result = data.rows
        Object.keys(result).forEach((key) => {
          if ({}.hasOwnProperty.call(result, key)) {
            result[key].category_name = data.rows[key].BlogCategory
              ? data.rows[key].BlogCategory.title
              : ''
            result[key].image = Helper.mediaUrlForS3(
              BLOG_IMAGE,
              result[key].image
            )
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, blog).parse(),
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

  /**
   * @description 'blog detail'
   * @param req id
   * @param res
   */
  detail: async (req, res) => {
    const clientIp = requestIp.getClientIp(req)
    const requestParams = req.params
    Blog.findOne({
      include: [
        {
          model: BlogCategory,
          attributes: ['title'],
        },
        {
          model: BlogViewCount,
        },
      ],
      where: {
        slug: requestParams.slug,
        status: ACTIVE,
      },
    })
      .then(async (resObject) => {
        if (resObject) {
          const result = resObject
          let totalBlogCount = result.BlogViewCounts.length
          // increase view count
          const blogViewCountData = await BlogViewCount.findOne({
            where: {
              blog_id: result.id,
              ip_address: clientIp,
            },
          })

          if (blogViewCountData) {
            // Update
            await BlogViewCount.update(
              {
                view_count: blogViewCountData.view_count + 1,
              },
              {
                where: {
                  id: blogViewCountData.id,
                },
              }
            ).then(async (data) => {
              const totalview = await BlogViewCount.count({
                where: {
                  blog_id: result.id,
                },
              })
              totalBlogCount = totalview
            })
          } else {
            // Insert
            await BlogViewCount.create({
              blog_id: result.id,
              view_count: 1,
              ip_address: clientIp,
            }).then(async (data) => {
              const totalview = await BlogViewCount.count({
                where: {
                  blog_id: result.id,
                },
              })
              totalBlogCount = totalview
            })
          }

          result.category_name = result.BlogCategory
            ? result.BlogCategory.title
            : ''
          result.image = Helper.mediaUrlForS3(BLOG_IMAGE, result.image)
          result.time = result.reading_minute
          result.views = totalBlogCount
          return Response.successResponseData(
            res,
            new Transformer.Single(result, blogDetail).parse(),
            SUCCESS,
            res.__('success')
          )
        } else {
          return Response.successResponseData(
            res,
            null,
            SUCCESS,
            res.__('blogIdNotAvailable')
          )
        }
      })
      .catch(() => {
        return Response.errorResponseData(
          res,
          res.__('somethingWentWrong'),
          BAD_REQUEST
        )
      })
  },
  //
  getBlogCategory: async (req, res) => {
    const sorting = [['title', 'ASC']]
    await BlogCategory.findAll({
      where: { status: ACTIVE },
      order: sorting,
    }).then((data, err) => {
      if (data) {
        const transformedBlog = new Transformer.List(data, blog).parse()
        return Response.successResponseData(
          res,
          transformedBlog,
          SUCCESS,
          res.locals.__('success')
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
  // per_page,page
  async getBlogList(per_page, page, search, categorySlug) {
    let limit = PER_PAGE
    // eslint-disable-next-line camelcase
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

    if (categorySlug && categorySlug !== '') {
      await BlogCategory.findOne({
        where: { slug: categorySlug },
      }).then((data) => {
        query = {
          ...query,
          blog_category_id: {
            [Op.eq]: `${data.id}`,
          },
        }
      })
    }
    if (search && search !== '') {
      query = {
        ...query,
        title: {
          [Op.like]: `%${search}%`,
        },
      }
    }
    let blogArray = []
    const sorting = [['updatedAt', 'DESC']]
    await Blog.findAndCountAll({
      include: {
        model: BlogCategory,
        where: {
          status: ACTIVE,
        },
      },
      where: query,
      offset: offset,
      limit: limit,
      order: sorting,
      distinct: true,
    }).then((data) => {
      const count = +data.count
      if (data && count > 0) {
        const newdata = new Transformer.List(data.rows, blog).parse()
        // eslint-disable-next-line array-callback-return
        newdata.map((data) => {
          data.image = Helper.mediaUrlForS3(BLOG_IMAGE, data.image)
        })
        blogArray = newdata
      }
    })
    return blogArray
  },

  getBlogByCategory: async (req, res) => {
    const reqParam = req.body
    let limit = PER_PAGE
    if (reqParam.per_page && reqParam.per_page > 0) {
      limit = parseInt(reqParam.per_page, 10)
    }
    const sorting = [['updatedAt', 'DESC']]
    let pageNo = 1
    if (reqParam.page && reqParam.page > 0) {
      pageNo = parseInt(reqParam.page, 10)
    }
    const offset = (pageNo - 1) * limit

    if (reqParam.slug) {
      const blogs = await BlogCategory.findOne({
        where: { slug: reqParam.slug, status: ACTIVE },
      })
      if (blogs) {
        await Blog.findAndCountAll({
          include: {
            model: BlogCategory,
            where: {
              status: ACTIVE,
            },
          },
          where: { blog_category_id: blogs.id },
          offset: offset,
          limit: limit,
          order: sorting,
        }).then((data) => {
          const count = +data.count
          if (data && count > 0) {
            data.rows.map((data) => {
              data.image = Helper.mediaUrlForS3(BLOG_IMAGE, data.image)
            })
            const newdata = new Transformer.List(data.rows, blog).parse()

            const extra = []
            extra.per_page = limit
            extra.total = data.count
            extra.page = pageNo
            return Response.successResponseData(
              res,
              newdata,
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
      } else {
        Response.errorResponseData(
          res,
          res.locals.__('pleaseEnterValidCategory')
        )
      }
    } else {
      Response.errorResponseData(res, res.locals.__('pleaseEnterValidSlug'))
    }
  },
}
