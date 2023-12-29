const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const { ACTIVE, SUCCESS, PER_PAGE } = require('../../../services/Constants')
const { AuthenticityVideo } = require('../../../models')
const { videoList } = require('../../../transformers/api/VideoTransformer')
const Helper = require('../../../services/Helper')

module.exports = {
  /**
   * @description "Get Videos"
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  get: async (req, res) => {
    const requestParams = req.query
    let limit = PER_PAGE
    if (requestParams.per_page && requestParams.per_page > 0) {
      limit = parseInt(requestParams.per_page, 10)
    }
    let pageNo = 1
    if (requestParams.page && requestParams.page > 0) {
      pageNo = parseInt(requestParams.page, 10)
    }
    const offset = (pageNo - 1) * limit

    let whereQue = { status: ACTIVE }
    if (requestParams.search && requestParams.search !== '') {
      whereQue = {
        ...whereQue,
        [Op.or]: {
          name: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }
    if (req.params.video_category) {
      whereQue.video_category = parseInt(req.params.video_category, 10)
      await AuthenticityVideo.findAndCountAll({
        where: whereQue,
        order: [['updatedAt', 'DESC']],
        offset: offset,
        limit: limit,
        distinct: true,
      })
        .then(async (result) => {
          if (result.rows.length > 0) {
            const resultData = result.rows
            const extra = []
            extra.per_page = limit
            extra.total = resultData.count
            extra.page = pageNo
            return Response.successResponseData(
              res,
              new Transformer.List(resultData, videoList).parse(),
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
        .catch(() => {
          Response.errorResponseData(res, res.__('somethingWentWrong'))
        })
    } else {
      const promise = []
      const customerUnBoxingVideos = []
      const productReviews = []
      const productTeaser = []
      for (let i = 1; i <= 3; i++) {
        whereQue.video_category = i
        promise.push(
          AuthenticityVideo.findAndCountAll({
            where: whereQue,
            order: [['updatedAt', 'DESC']],
            offset: offset,
            limit: limit,
            distinct: true,
          })
            .then(async (result) => {
              if (result.rows.length > 0) {
                result.rows.forEach((row) => {
                  const resData = {
                    id: row.id,
                    name: row.name,
                    link: row.link,
                    video_category: row.video_category,
                  }
                  if (i === 1) {
                    customerUnBoxingVideos.push(resData)
                  } else if (i === 2) {
                    productReviews.push(resData)
                  } else if (i === 3) {
                    productTeaser.push(resData)
                  }
                })
              }
            })
            .catch(() => {
              Response.errorResponseData(res, res.__('somethingWentWrong'))
            })
        )
      }
      Promise.all(promise)
        .then(() => {
          const responseData = {
            customer_unboxing: customerUnBoxingVideos,
            product_reviews: productReviews,
            product_teaser: productTeaser,
          }
          return Response.successResponseData(
            res,
            responseData,
            SUCCESS,
            res.locals.__('success')
          )
        })
        .catch(() => {
          Response.errorResponseData(res, res.__('somethingWentWrong'))
        })
    }
  },
  async getAllVideoList(per_page, page, search) {
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
    let sorting = [['updatedAt', 'DESC']]
    let videoArray = []
    await AuthenticityVideo.findAndCountAll({
      where: query,
      offset: offset,
      limit: limit,
      order: sorting,
      distinct: true,
    }).then((data, err) => {
      const count = +data.count
      if (count > 0) {
        const newdata = new Transformer.List(data.rows, videoList).parse()
        videoArray = newdata
      }
    })
    return videoArray
  },
}
