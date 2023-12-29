const { Op } = require('sequelize')
const Transformer = require('object-transformer')
const Response = require('../../services/Response')
const { AuthenticityVideo } = require('../../models')
const Constants = require('../../services/Constants')
const {
  videolist,
} = require('../../transformers/admin/AuthenticityVideoTransformer')
const {
  addEditValidationForVideo,
  videoChangeStatusValidation,
} = require('../../services/AdminValidation')
module.exports = {
  /**
   * @description "This function is use to generate list of faq."
   * @param req
   * @param res
   */
  authenticityVideoList: async (req, res) => {
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
    let query
    query = {
      status: {
        [Op.ne]: [Constants.DELETE],
      },
    }
    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        [Op.or]: {
          name: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }
    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
      if (requestParams.order_by === 'name') {
        requestParams.order_by = 'name'
      }
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }
    await AuthenticityVideo.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
    }).then(async (data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        result.map((data) => {
          const { link } = data
          const temp = link.split('=')
          data.image = `https://img.youtube.com/vi/${temp[1]}/default.jpg`
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(data.rows, videolist).parse(),
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
  },
  /**
   * @description "This function is use to addEdit video ."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  authenticityVideoAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForVideo(requestParams, res, async (validate) => {
      if (validate) {
        const videoObj = {
          name: requestParams.name,
          link: requestParams.link,
          status: requestParams.status,
          video_category: requestParams.video_category,
        }
        if (requestParams.id) {
          AuthenticityVideo.findOne({
            where: {
              id: requestParams.id,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          })
            .then(async (videoData) => {
              if (videoData) {
                await videoData
                  .update(videoObj, {
                    where: {
                      id: requestParams.id,
                    },
                  })
                  .then(async (result) => {
                    if (result) {
                      return Response.successResponseData(
                        res,
                        new Transformer.Single(result, videolist).parse(),
                        Constants.SUCCESS,
                        res.__('videoUpdated')
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
                return Response.successResponseWithoutData(
                  res,
                  res.__('videoNotExits'),
                  Constants.FAIL
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
          await AuthenticityVideo.create(videoObj)
            .then(async (result) => {
              if (result) {
                return Response.successResponseData(
                  res,
                  new Transformer.Single(result, videolist).parse(),
                  Constants.SUCCESS,
                  res.__('videoAdded')
                )
              }
              return null
            })
            .catch(async () => {
              return Response.errorResponseData(
                res,
                res.__('internalError'),
                Constants.INTERNAL_SERVER
              )
            })
        }
      }
    })
  },

  /**
   * @description details the video
   * @param req
   * @param res
   * */
  authenticityVideoDetails: async (req, res) => {
    const videoId = req.params.id
    await AuthenticityVideo.findOne({
      where: {
        id: videoId,
        status: {
          [Op.not]: Constants.DELETE,
        },
      },
    }).then(
      (videoExists) => {
        if (videoExists) {
          Response.successResponseData(
            res,
            new Transformer.Single(videoExists, videolist).parse(),
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
      },
      () => {
        return Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      }
    )
  },
  /**
   * @description change the status of video
   * @param req
   * @param res
   */

  UpdateAuthenticityVideoStatus: async (req, res) => {
    const requestParams = req.fields
    videoChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await AuthenticityVideo.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (videoData) => {
            if (videoData) {
              /* eslint no-param-reassign: "error" */
              videoData.status = requestParams.status
              videoData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('videoStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('videoDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('videoStatusDeactivated'),
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
              Response.successResponseWithoutData(
                res,
                res.locals.__('noDataFound'),
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
      }
    })
  },
}
