const { Op } = require('sequelize')
const path = require('path')
const fetch = require('node-fetch')
const bcrypt = require('bcrypt')
const fs = require('fs-extra')
const Jimp = require('jimp')
const moment = require('moment')
const { Customer } = require('../models')
const Response = require('../services/Response')
const Constants = require('../services/Constants')
const { s3 } = require('../config/aws')
const { ProductImage, ProductStock } = require('../models')
//const { firebaseAdmin } = require('../config/firebase')
const _ = require('lodash')

module.exports = {
  AppName: 'NUTRISTAR',
  generatePassword: (password) => {
    return new Promise((resolve, reject) => {
      return bcrypt.hash(password, 10, async (err, hash) => {
        if (err) reject()
        resolve(hash)
      })
    })
  },
  toUpperCase: (str) => {
    if (str.length > 0) {
      const newStr = str
        .toLowerCase()
        .replace(/_([a-z])/, (m) => m.toUpperCase())
        .replace(/_/, '')
      return str.charAt(0).toUpperCase() + newStr.slice(1)
    }
    return ''
  },

  /**
   * @description This function use for create validation unique key
   * @param apiTag
   * @param error
   * @returns {*}
   */
  validationMessageKey: (apiTag, error) => {
    let key = module.exports.toUpperCase(error.details[0].context.key)
    let type = error.details[0].type.split('.')
    type = module.exports.toUpperCase(type[1])
    key = apiTag + key + type
    return key
  },
  /**
   * @description This function use for create random number
   * @param length
   * @returns {*}
   */

  makeRandomNumber: (length) => {
    let result = ''
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  },

  /**
   * @description This function use for create random digits
   * @param length
   * @returns {*}
   */

  makeRandomDigit: (length) => {
    let result = ''
    const characters = '0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  },

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  mediaUrl: (folder, name) => {
    if (name && name !== '') {
      return `${process.env.API_URL}uploads/${folder}/${name}`
    }
    return ''
  },

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  mediaUrlForS3: (folder, name) => {
    if (name && name !== '') {
      if (process.env.S3_ENABLE === Constants.TRUE) {
        return `${process.env.AMZ_BUCKET_URL}${folder}/${name}`
      } else {
        return `${process.env.API_URL}uploads/${folder}/${name}`
      }
    }
    return ''
  },

  /**
   * @description This function use for uploading the file
   * @param file
   * @param paths
   * @param filename
   * @returns {*}
   */
  async uploadFiles(file, paths, filename) {
    return new Promise((resolve, reject) => {
      const tempPath = file.path
      const fileName = filename

      // const newLocation = path.join(__dirname, '../../public/uploads') + '/' + paths + '/'
      const newLocation = '/tmp/'
      if (!fs.existsSync(newLocation)) {
        fs.mkdirSync(newLocation, { recursive: true }, () => {})
      }
      fs.copy(tempPath, newLocation + fileName, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(newLocation + fileName)
        }
      })
    })
  },

  uploadImage: async (fileName, storagePath, req, res) =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const base64 = req.fields.image
      const extension = base64.split(';')[0].split('/')[1]
      const decodedImage = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )

      const image = await Jimp.read(decodedImage)
      await image.quality(85)

      if (process.env.S3_ENABLE === Constants.TRUE) {
        const operatedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG)
        const params = {
          Bucket: process.env.AMZ_BUCKET,
          Key: `${storagePath}/${fileName}`,
          Body: operatedImageBuffer,
          ContentEncoding: 'base64', // required
          ContentType: extension,
        }
        s3.putObject(params, function (perr, pres) {
          if (perr) {
            reject(perr)
            return Response.errorResponseData(
              res,
              res.__('somethingWentWrong'),
              500
            )
          } else {
            return resolve({
              code: 200,
              body: pres,
            })
          }
        })
      } else {
        const newLocation =
          path.join(__dirname, '../../public/uploads') + '/' + storagePath + '/'
        if (!fs.existsSync(newLocation)) {
          fs.mkdirSync(newLocation, { recursive: true }, () => {})
        }
        await image
          .writeAsync(`${newLocation}/${fileName}`)
          .then((pres) => {
            return resolve({
              code: 200,
              body: pres,
            })
          })
          .catch((e) => {
            reject(e)
            return Response.errorResponseData(
              res,
              res.__('somethingWentWrong'),
              500
            )
          })
      }
    }),

  removeOldImage: (file, storagePath, res) =>
    new Promise((resolve, reject) => {
      if (process.env.S3_ENABLE === Constants.TRUE) {
        const params = {
          Bucket: `${process.env.AMZ_BUCKET}/${storagePath}`,
          Key: file,
        }
        try {
          return s3.deleteObject(params, (err, data) => {
            if (data) {
              resolve({
                code: 200,
                body: data,
              })
            }
            reject(err)
          })
        } catch {
          return Response.errorResponseData(
            res,
            res.__('somethingWentWrong'),
            500
          )
        }
      } else {
        const filePath =
          path.join(__dirname, '../../public/uploads') + '/' + storagePath + '/'
        fs.unlink(`${filePath}${file}`, function (error) {
          if (error) {
            // reject(error)
          }
          resolve(true)
        })
      }
      return null
    }),

  async excelValidation(req, res, file) {
    return new Promise((resolve) => {
      const extension = file.type
      const fileExtArr = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/csv,application/excel',
        'application/vnd.ms-excel',
        'application/vnd.msexcel',
        'application/octet-stream',
        'text/csv',
      ]
      if (file && !fileExtArr.includes(extension)) {
        return Response.errorResponseWithoutData(
          res,
          res.__('fileInvalid'),
          Constants.BAD_REQUEST
        )
      }
      return resolve(true)
    })
  },

  generateMobileOtp: async function (len, mobile) {
    if (process.env.GENERATE_AND_SEND_OTP === 'true') {
      let text = ''
      const possible = '0123456789'
      for (let i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
      }

      const mobileOtpExist = await Customer.findOne({
        where: {
          mobile: mobile,
          status: {
            [Op.not]: Constants.DELETE,
          },
          otp: text,
        },
      }).then((mobileOtpExistData) => mobileOtpExistData)

      if (mobileOtpExist) {
        await this.generateMobileOtp(len, mobile)
      }
      return text
    } else {
      return 1234
    }
  },

  /**
   * @description This function use for uploading the file
   * @returns {*}
   */
  getUploadURL: async (mimeType) => {
    return new Promise((resolve) => {
      const extType = mimeType === 'image/png' ? 'png' : 'jpg'
      const actionId = `${moment().unix()}-${module.exports.makeRandomDigit(4)}`
      const s3Params = {
        Bucket: process.env.AMZ_BUCKET,
        Key: `${actionId}.${extType}`,
        ContentType: mimeType,
        ACL: 'public-read',
      }

      const uploadURL = s3.getSignedUrl('putObject', s3Params)
      resolve({
        uploadURL: uploadURL,
        filename: `${actionId}.${extType}`,
      })
    })
  },

  generateReferrerCode: function (mobile) {
    let text = ''
    const possible = '0123456789'
    for (let i = 0; i < 3; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    const last5DigitFromMobile = mobile.substr(mobile.length - 5)
    return 'NUSTAR' + last5DigitFromMobile + text
  },

  generateResetToken: async function (len, mobile) {
    if (process.env.GENERATE_AND_SEND_OTP === 'true') {
      let text = ''
      const possible = '0123456789'
      for (let i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
      }

      const mobileResetTokenExist = await Customer.findOne({
        where: {
          mobile: mobile,
          status: {
            [Op.not]: Constants.DELETE,
          },
          reset_token: text,
        },
      }).then((mobileResetTokenExistData) => mobileResetTokenExistData)

      if (mobileResetTokenExist) {
        await this.generateResetToken(len, mobile)
      }
      return text
    } else {
      return 1234
    }
  },

  sendOtp: async function (mobile, otp) {
    if (process.env.GENERATE_AND_SEND_OTP === 'true') {
      return new Promise((resolve) => {
        fetch(
          `${process.env.MSG91_SEND_OTP_URL}&mobile=91${mobile}&message=Your otp is ${otp}&otp=${otp}`
        )
          .then((res) => res.json())
          .then(() => {
            resolve(true)
          })
          .catch(() => {
            resolve(false)
          })
      })
    } else {
      return true
    }
  },

  totalWeightFunc(weight, zoneValue, prize) {
    const defaultWeight = 500
    const totalWeight = Math.ceil(weight / defaultWeight + 1)
    const totalPrize = (totalWeight * zoneValue + +prize).toString()
    return totalPrize
  },

  // eslint-disable-next-line consistent-return
  getProductPriceWithZone(prize, weight, zone) {
    if (+zone === 2) {
      const zoneValue = 5
      return module.exports.totalWeightFunc(weight, zoneValue, prize)
    } else if (+zone === 3) {
      const zoneValue = 12
      return module.exports.totalWeightFunc(weight, zoneValue, prize)
    } else if (+zone === 4) {
      const zoneValue = 15
      return module.exports.totalWeightFunc(weight, zoneValue, prize)
    } else if (+zone === 5) {
      const zoneValue = 30
      return module.exports.totalWeightFunc(weight, zoneValue, prize)
    }
  },

  utctolocaldate(date) {
    return moment.utc(date).local().format('YYYY-MM-DD')
  },

  utctolocaldateWithoutDate(date) {
    return moment.utc(date).local().format('MM-YYYY')
  },

  imageSizeValidation: async (fileName, req, res) =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
      const base64 = fileName
      const stringLength = base64.length - 'data:image/png;base64,'.length
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812
      const sizeInKb = sizeInBytes / 1000

      if (sizeInKb > Constants.IMAGE_MAX_SIZE) {
        return Response.errorResponseWithoutData(
          res,
          res.__('imageSizeNotValid'),
          Constants.BAD_REQUEST
        )
      }
      resolve(true)
    }),

  /**
   * @description 'Get product display image'
   * @param id
   */
  getProductDisplayImage: async (id) => {
    return await ProductStock.findOne({
      include: {
        model: ProductImage,
        attributes: ['id', 'image'],
        required: false,
      },
      where: {
        product_id: id,
        is_default: Constants.DEFAULT_IMAGE,
        status: Constants.ACTIVE,
      },
    }).then(async (stockData) => {
      if (stockData) {
        if (stockData.ProductImages) {
          if (stockData.ProductImages[0]) {
            return stockData.ProductImages[0].image
          }
        }
      }
    })
  },

  sendPushNotificationOnTopic: (customer_type) => {
    let topic = ''
    if (customer_type === Constants.SEND_NOTIFICATION_USER_TYPE.NEW_CUSTOMER) {
      topic = process.env.NOTIFICATION_TOPIC_NEW_CUSTOMER
    } else if (
      customer_type === Constants.SEND_NOTIFICATION_USER_TYPE.OLD_CUSTOMER
    ) {
      topic = process.env.NOTIFICATION_TOPIC_OLD_CUSTOMER
    } else if (
      customer_type === Constants.SEND_NOTIFICATION_USER_TYPE.ALL_CUSTOMER
    ) {
      topic = process.env.NOTIFICATION_TOPIC_ALL_CUSTOMER
    }
    const message = {
      data: {
        title: 'Nutristar',
        message: 'Test Push Notification Using Channel/topic',
      },
      topic: topic,
    }

    // firebaseAdmin
    //   .messaging()
    //   .send(message)
    //   .then((result) => {
    //     console.log('Successfully sent notification:', result)
    //   })
  },

  sendPushNotificationOnToken: async (tokens, title, content) => {
    const payload = {
      notification: {
        body: content,
        title: title,
      },
    }
    let divideInThousand = await _.chunk(tokens, 1000)
    for (let i = 0; i < divideInThousand.length; i++) {
      // firebaseAdmin.messaging().sendToDevice(divideInThousand[i], payload).then((d) => {
      //   return null
      // }).catch((e) => {
      //   console.log('e', e)
      // });
    }
  },
}
