const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const neatCsv = require('neat-csv')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Helper = require('../../services/Helper')
const {
  Notification,
  Customer,
  CustomerDevice,
  CustomerNotification,
  NotificationDetails,
} = require('../../models')
const {
  notificationListTransformer,
} = require('../../transformers/admin/NotificationTransformer')
const {
  sendPushNotificationValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description "This function is use to generate list of Notifications."
   * @param req
   * @param res
   */
  notificationList: (req, res) => {
    const requestParams = req.query
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
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }
    if (requestParams.search && requestParams.search !== '') {
      query = {
        ...query,
        [Op.or]: {
          push_notification_content: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }

    let filterQuery = {}

    if (
      requestParams.filter_by_specific_type &&
      requestParams.filter_by_specific_type !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        specific_type: requestParams.filter_by_specific_type,
      }
    }

    if (
      requestParams.filter_by_customer_type &&
      requestParams.filter_by_customer_type !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        customer_type: requestParams.filter_by_customer_type,
      }
    }

    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        status: requestParams.filter_by_status,
      }
    }
    query = {
      ...query,
      ...filterQuery,
    }
    const sorting = [['updatedAt', 'DESC']]
    Notification.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    }).then(async (data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, notificationListTransformer).parse(),
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
   * @description delete single notification
   * @param req
   * @param res
   * */
  notificationDelete: async (req, res) => {
    const requestParam = req.params
    const notificationData = await Notification.findByPk(requestParam.id)
    if (notificationData === null) {
      Response.successResponseWithoutData(
        res,
        res.__('noDataFound'),
        Constants.FAIL
      )
    } else {
      await Notification.update(
        {
          status: Constants.DELETE,
        },
        {
          where: {
            id: notificationData.id,
          },
        }
      )
        .then(async () => {
          await CustomerNotification.update(
            {
              status: Constants.DELETE,
            },
            {
              where: {
                notification_id: requestParam.id,
              },
            }
          ).then(() => {
            Response.successResponseWithoutData(
              res,
              res.__('notificationDeleted'),
              Constants.SUCCESS
            )
          })
        })
        .catch(() => {
          Response.errorResponseData(
            res,
            res.__('somethingWentWrong'),
            Constants.BAD_REQUEST
          )
        })
    }
  },

  /**
   * @description send notification
   * @param req
   * @param res
   * */
  sendNotification: async (req, res) => {
    const requestParams = req.fields
    const customerDeviceTokenArr = []
    sendPushNotificationValidation(requestParams, res, async (validate) => {
      if (validate) {
        const sendNotificationObj = {
          specific_type: parseInt(requestParams.specific_type, 10),
          customer_type: parseInt(requestParams.customer_type, 10),
          push_notification_content: requestParams.push_notification_content,
          push_notification_title: requestParams.push_notification_title,
          status: Constants.ACTIVE,
        }
        await Notification.create(sendNotificationObj)
          .then(async (data) => {
            if (data) {
              if (
                sendNotificationObj.specific_type ===
                Constants.SEND_NOTIFICATION.CUSTOMER_SPECIFIC
              ) {
                if (
                  sendNotificationObj.customer_type ===
                    Constants.SEND_NOTIFICATION_USER_TYPE.NEW_CUSTOMER ||
                  sendNotificationObj.customer_type ===
                    Constants.SEND_NOTIFICATION_USER_TYPE.OLD_CUSTOMER ||
                  sendNotificationObj.customer_type ===
                    Constants.SEND_NOTIFICATION_USER_TYPE.ALL_CUSTOMER
                ) {
                  await Helper.sendPushNotificationOnTopic(
                    sendNotificationObj.customer_type
                  )
                  const customerNotificationObj = {
                    notification_id: data.id,
                    notify_type: sendNotificationObj.customer_type,
                    message: sendNotificationObj.push_notification_content,
                    title: sendNotificationObj.push_notification_title,
                  }
                  await CustomerNotification.create(customerNotificationObj)
                } else if (
                  sendNotificationObj.customer_type ===
                  Constants.SEND_NOTIFICATION_USER_TYPE.SPECIFIC_CUSTOMER
                ) {
                  // FILe is required
                  if (
                    req.files.customer_csv &&
                    req.files.customer_csv.size > 0
                  ) {
                    await Helper.excelValidation(
                      req,
                      res,
                      req.files.customer_csv
                    )
                  } else {
                    return Response.errorResponseWithoutData(
                      res,
                      res.__('fileIsRequired'),
                      Constants.BAD_REQUEST
                    )
                  }
                  const fileName = `${moment().unix()}${path.extname(
                    req.files.customer_csv.name
                  )}`

                  const fileUpload = await Helper.uploadFiles(
                    req.files.customer_csv,
                    Constants.NOTIFICATION,
                    fileName
                  )
                  // Store in admin notificartion
                  const notificationDetailsObj = {
                    notification_id: data.id,
                    upload_file: fileName,
                  }
                  await NotificationDetails.create(
                    notificationDetailsObj
                  ).then()

                  fs.readFile(fileUpload, async (err, data) => {
                    if (err) {
                      return Response.errorResponseWithoutData(
                        res,
                        res.__('fileIsRequired'),
                        Constants.BAD_REQUEST
                      )
                    }
                    const rows = await neatCsv(data)
                    for (const record of rows) {
                      await Customer.findOne({
                        include: {
                          model: CustomerDevice,
                          required: false,
                        },
                        where: {
                          mobile: record.mobile,
                        },
                      }).then(async (data) => {
                        if (data) {
                          if (data.CustomerDevices) {
                            const deviceTokenData = data.CustomerDevices
                            for (let i = 0; i < deviceTokenData.length; i++) {
                              if (deviceTokenData[i]) {
                                customerDeviceTokenArr.push(
                                  deviceTokenData[i].device_token
                                )
                              }
                            }
                            await Helper.sendPushNotificationOnToken(
                              customerDeviceTokenArr,
                              requestParams.push_notification_title,
                              requestParams.push_notification_content
                            )
                          }
                        }
                      })
                    }
                  })
                }
              } else if (
                sendNotificationObj.specific_type ===
                Constants.SEND_NOTIFICATION.ORDER_SPECIFIC
              ) {
                if (req.files.order_csv && req.files.order_csv.size > 0) {
                  await Helper.excelValidation(req, res, req.files.order_csv)
                }
                const fileName = `${moment().unix()}${path.extname(
                  req.files.order_csv.name
                )}`
                const fileUpload = await Helper.uploadFiles(
                  req.files.order_csv,
                  Constants.NOTIFICATION,
                  fileName
                )
                fs.readFile(fileUpload, async (err, data) => {
                  if (err) {
                    return Response.errorResponseWithoutData(
                      res,
                      res.__('fileIsRequired'),
                      Constants.BAD_REQUEST
                    )
                  }
                  const rows = await neatCsv(data)

                  // TODO:: Send Notification based on order IDS
                  // for (const record of rows) {
                  //   await Order.findOne({
                  //     include: {
                  //       model: CustomerDevice,
                  //     },
                  //     where: {
                  //       mobile: record.order,
                  //     },
                  //   }).then(async (data) => {
                  //     if (data) {
                  //       if (data.CustomerDevices) {
                  //         let deviceTokenData = data.CustomerDevices
                  //         for (let i = 0; i < deviceTokenData.length; i++) {
                  //           if (deviceTokenData[i]) {
                  //             customerDeviceTokenArr.push(
                  //               deviceTokenData[i].device_token
                  //             )
                  //           }
                  //         }
                  //         await Helper.sendPushNotificationOnToken(
                  //                               customerDeviceTokenArr,
                  //                               requestParams.push_notification_title,
                  //                               requestParams.push_notification_content
                  //                             )
                  //       }
                  //     }
                  //   })
                  // }
                })
              }

              return Response.successResponseWithoutData(
                res,
                res.__('notificationSentSuccess'),
                Constants.SUCCESS
              )
            }
          })
          .catch((e) => {
            Response.errorResponseData(
              res,
              res.__('somethingWentWrong'),
              Constants.BAD_REQUEST
            )
          })
      }
    })
  },
}
