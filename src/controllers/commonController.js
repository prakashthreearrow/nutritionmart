const moment = require('moment')
const Helper = require('../services/Helper')
const { imageUploadValidation } = require('../services/AdminValidation')
const models = require('../models')
const Constants = require('../services/Constants')
const Response = require('../services/Response')
const { s3 } = require('../config/aws')

module.exports = {
  /**
   * @description admin login controller
   * @param req
   * @param res
   */
  imageUpload: async (req, res) => {
    const requestParams = req.fields
    const { module } = requestParams

    if (module === Constants.MODEL_NAME.CUSTOMER) {
      const { authCustomerId } = req
      requestParams.id = authCustomerId.toString()
    }

    imageUploadValidation(requestParams, res, async (validate) => {
      if (validate) {
        let imagePath = ''
        const { type } = requestParams
        const extension =
          requestParams.image && requestParams.image !== ''
            ? requestParams.image.split(';')[0].split('/')[1]
            : ''
        const imageName =
          requestParams.image && requestParams.image !== ''
            ? `${moment().unix()}${Helper.makeRandomDigit(6)}.${extension}`
            : ''
        const imageExtArr = ['jpg', 'jpeg', 'png']
        if (imageName && !imageExtArr.includes(extension)) {
          return Response.errorResponseWithoutData(
            res,
            res.__('imageInvalid'),
            Constants.BAD_REQUEST
          )
        }

        await Helper.imageSizeValidation(requestParams.image, req, res)

        let imageField = 'image'

        switch (module) {
          case Constants.MODEL_NAME.BRAND:
            if (parseInt(type, 10) === Constants.NORMAL_UPLOAD_IMAGE) {
              imagePath = Constants.BRAND_IMAGE
            } else if (parseInt(type, 10) === Constants.BANNER_UPLOAD_IMAGE) {
              imagePath = Constants.BRAND_BANNER_IMAGE
              imageField = 'banner_image'
            } else if (parseInt(type, 10) === Constants.APP_UPLOAD_IMAGE) {
              imagePath = Constants.BRAND_APP_IMAGE
              imageField = 'app_image'
            }
            break
          case Constants.MODEL_NAME.BLOG:
            imagePath = Constants.BLOG_IMAGE
            break

          case Constants.MODEL_NAME.CATEGORY:
            if (parseInt(type, 10) === Constants.APP_UPLOAD_IMAGE) {
              imagePath = Constants.CATEGORY_APP_IMAGE
              imageField = 'app_image'
            } else if (parseInt(type, 10) === Constants.WEB_UPLOAD_IMAGE) {
              imagePath = Constants.CATEGORY_WEB_IMAGE
              imageField = 'web_image'
            } else if (parseInt(type, 10) === Constants.ICON_UPLOAD_IMAGE) {
              imagePath = Constants.CATEGORY_ICON_IMAGE
              imageField = 'icon_image'
            }
            break

          case Constants.MODEL_NAME.FEATURE_CATEGORY:
            if (parseInt(type, 10) === Constants.NORMAL_UPLOAD_IMAGE) {
              imagePath = Constants.FEATURED_CATEGORIES_IMAGE
            }
            break
          case Constants.MODEL_NAME.OFFERS:
            if (parseInt(type, 10) === Constants.NORMAL_UPLOAD_IMAGE) {
              imagePath = Constants.OFFER_IMAGE
            }
            break

          case Constants.MODEL_NAME.BANNER:
            if (parseInt(type, 10) === Constants.NORMAL_UPLOAD_IMAGE) {
              imagePath = Constants.BANNER_IMAGE
            } else if (
              parseInt(type, 10) === Constants.RESPONSIVE_UPLOAD_IMAGE
            ) {
              imagePath = Constants.BANNER_RESPONSIVE_IMAGE
              imageField = 'responsive_image'
            } else if (parseInt(type, 10) === Constants.APP_UPLOAD_IMAGE) {
              imagePath = Constants.BANNER_APP_IMAGE
              imageField = 'app_image'
            }
            break
          case Constants.MODEL_NAME.CUSTOMER:
            if (parseInt(type, 10) === Constants.APP_UPLOAD_IMAGE) {
              imagePath = Constants.CUSTOMER_IMAGE
            }
            break
          default:
        }

        await Helper.uploadImage(imageName, imagePath, req, res)

        const runningModel = models[module]

        await runningModel
          .findOne({
            where: {
              id: requestParams.id,
            },
          })
          .then(async (result) => {
            if (result) {
              if (result[imageField] !== '' && result[imageField] != null) {
                await Helper.removeOldImage(
                  result[imageField],
                  imagePath,
                  req,
                  res
                )
              }
              await runningModel
                .update(
                  {
                    [imageField]: imageName,
                  },
                  {
                    where: {
                      id: requestParams.id,
                    },
                  }
                )
                .then((data) => {
                  if (data) {
                    return Response.successResponseWithoutData(
                      res,
                      res.__('success'),
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
                [],
                Constants.SUCCESS,
                res.locals.__('noDataFound')
              )
            }
            return null
          })
      }
      return null
    })
  },

  /**
   * @description This function use for uploading the file
   * @returns {*}
   */
  getUploadURL: async (extType) => {
    return new Promise((resolve, reject) => {
      const actionId = moment().unix() + Helper.makeRandomDigit(4)
      const s3Params = {
        Bucket: process.env.AMZ_BUCKET,
        Key: `${actionId}.${extType}`,
        ContentType: extType === 'png' ? 'image/png' : 'image/jpeg',
        ACL: 'public-read',
      }

      const uploadURL = s3.getSignedUrl('putObject', s3Params)
      resolve({
        uploadURL: uploadURL,
        filename: `${actionId}.jpg`,
      })
    })

    /* return Response.successResponseData(
      res,
      {
        uploadURL: uploadURL,
        filename: `${actionId}.jpg`,
      },
      Constants.SUCCESS,
      res.locals.__('success')
    ) */
  },
}
