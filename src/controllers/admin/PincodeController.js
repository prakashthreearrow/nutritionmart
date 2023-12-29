const { Op } = require('sequelize')
const Transformer = require('object-transformer')
const neatCsv = require('neat-csv')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const Response = require('../../services/Response')
const { Pincode, sequelize } = require('../../models')
const {
  DELETE,
  SUCCESS,
  FAIL,
  ACTIVE,
  PER_PAGE,
  INTERNAL_SERVER,
  INACTIVE,
} = require('../../services/Constants')
const {
  addEditValidationForPincode,
  pincodeChangeStatusValidation,
  codChangeStatusValidation,
} = require('../../services/AdminValidation')
const { pincodeslist } = require('../../transformers/admin/PincodeTransformer')
const Helper = require('../../services/Helper')
const Constants = require('../../services/Constants')

module.exports = {
  /**
   * @description "This function is use to generate list of faq."
   * @param req
   * @param res
   */
  pincodeList: async (req, res) => {
    const requestParams = req.query
    let search = false
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit
    let query
    query = {
      status: {
        [Op.in]: [ACTIVE, INACTIVE],
      },
    }
    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        [Op.or]: {
          Pincode: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }
    if (requestParams.is_cod && requestParams.is_cod !== '') {
      query = {
        ...query,
        [Op.and]: {
          is_cod: requestParams.is_cod,
        },
      }
    }
    let sorting = [['updatedAt', 'DESC']]
    if (requestParams.order_by && requestParams.order_by !== '') {
      if (requestParams.order_by === 'pincode') {
        requestParams.order_by = 'pincode'
      }
      if (requestParams.order_by === 'zone') {
        requestParams.order_by = 'zone'
      }
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          status: requestParams.filter_by_status,
        },
      }
    }

    await Pincode.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, pincodeslist).parse(),
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
   * @description "This function is use to addEdit pincode ."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  pincodeAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForPincode(requestParams, res, async (validate) => {
      if (validate) {
        let checkPincodeExist
        if (requestParams.id) {
          checkPincodeExist = Pincode.findOne({
            where: {
              pincode: requestParams.pincode,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: DELETE,
              },
            },
          }).then()
        } else {
          checkPincodeExist = Pincode.findOne({
            where: {
              pincode: requestParams.pincode,
              status: {
                [Op.ne]: DELETE,
              },
            },
          }).then()
        }
        await checkPincodeExist.then(async (codeData) => {
          if (codeData) {
            Response.successResponseWithoutData(
              res,
              res.__('pincodeAlreadyExist'),
              FAIL
            )
          } else {
            const codeObj = {
              zone: requestParams.zone,
              pincode: requestParams.pincode,
              is_cod: requestParams.is_cod,
              status: requestParams.status,
            }
            if (requestParams.id) {
              Pincode.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: DELETE,
                  },
                },
              })
                .then(async (codeInfo) => {
                  if (codeInfo) {
                    await codeInfo
                      .update(codeObj, {
                        where: {
                          id: requestParams.id,
                        },
                      })
                      .then(async (result) => {
                        if (result) {
                          Response.successResponseData(
                            res,
                            new Transformer.Single(
                              result,
                              pincodeslist
                            ).parse(),
                            SUCCESS,
                            res.__('pincodeUpdated')
                          )
                        }
                      })
                      .catch(() => {
                        Response.errorResponseData(
                          res,
                          res.__('internalError'),
                          INTERNAL_SERVER
                        )
                      })
                  } else {
                    Response.successResponseWithoutData(
                      res,
                      res.__('codeNotExits'),
                      FAIL
                    )
                  }
                })
                .catch(() => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    INTERNAL_SERVER
                  )
                })
            } else {
              Pincode.create(codeObj)
                .then(async (result) => {
                  if (result) {
                    return Response.successResponseData(
                      res,
                      new Transformer.Single(result, pincodeslist).parse(),
                      SUCCESS,
                      res.__('codeAdded')
                    )
                  }
                  return null
                })
                .catch(async () => {
                  return Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    INTERNAL_SERVER
                  )
                })
            }
          }
        })
      }
    })
  },
  /**
   * @description change the status of pincode
   * @param req
   * @param res
   */
  UpdateStatus: async (req, res) => {
    const requestParams = req.fields
    pincodeChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Pincode.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (codeData) => {
            if (codeData) {
              /* eslint no-param-reassign: "error" */
              codeData.status = requestParams.status
              codeData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('pincodeStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('pincodeDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('pincodeStatusDeactivated'),
                        Constants.SUCCESS
                      )
                    }
                  }
                })
                .catch(() => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    INTERNAL_SERVER
                  )
                })
            } else {
              Response.successResponseData(
                res,
                [],
                SUCCESS,
                res.locals.__('codeNotExits')
              )
            }
            return null
          })
          .catch(() => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              INTERNAL_SERVER
            )
          })
      }
    })
  },
  /**
   * @description details the pincode
   * @param req
   * @param res
   * */
  pincodeDetails: async (req, res) => {
    const pincodeId = req.params.id
    await Pincode.findOne({
      where: {
        id: pincodeId,
        status: {
          [Op.not]: DELETE,
        },
      },
    }).then(
      (codeExists) => {
        if (codeExists) {
          Response.successResponseData(
            res,
            new Transformer.Single(codeExists, pincodeslist).parse(),
            SUCCESS,
            res.__('success')
          )
        } else {
          Response.successResponseWithoutData(
            res,
            res.locals.__('nodataFound'),
            FAIL
          )
        }
      },
      () => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          INTERNAL_SERVER
        )
      }
    )
  },
  /**
   * @description update the cod   status of pincode list
   * @param req
   * @param res
   */
  UpdateCODStatus: async (req, res) => {
    const requestParams = req.fields
    const CODIds = req.fields.id.split(',')
    const codIdList = []
    CODIds.forEach((commentId) => {
      if (codIdList.indexOf(commentId) === -1) {
        codIdList.push(commentId)
      }
    })
    codChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Pincode.update(
          {
            is_cod: requestParams.is_cod,
          },
          {
            where: {
              id: {
                [Op.in]: codIdList,
              },
            },
          }
        )
          .then(async (codeData) => {
            if (codeData) {
              codeData.is_cod = requestParams.is_cod
              if (codeData.is_cod === '1') {
                return Response.successResponseWithoutData(
                  res,
                  res.locals.__('addToCode'),
                  SUCCESS
                )
              } else {
                return Response.successResponseWithoutData(
                  res,
                  res.locals.__('removeToCode'),
                  SUCCESS
                )
              }
            } else {
              return Response.successResponseData(
                res,
                [],
                SUCCESS,
                res.locals.__('codeNotExits')
              )
            }
          })
          .catch(() => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              INTERNAL_SERVER
            )
          })
      }
    })
  },
  /**
   * @description 'This function is used to import pincode from excel file.'
   * @param req
   * @param res
   */
  ImportPincode: async (req, res) => {
    if (req.files.file && req.files.file.size > 0) {
      await Helper.excelValidation(req, res, req.files.file)
    } else {
      return Response.errorResponseWithoutData(
        res,
        res.__('fileIsRequired'),
        Constants.BAD_REQUEST
      )
    }
    const fileName = `${moment().unix()}${path.extname(req.files.file.name)}`
    const fileUpload = await Helper.uploadFiles(
      req.files.file,
      Constants.PINCODE,
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
      const PincodeData = []
      const pinCodeRegex = /^(\d{4}|^\d{6})$/
      const zoneRegex = /^[A-Za-z]+$/

      // eslint-disable-next-line no-restricted-syntax
      for (const record of rows) {
        if (zoneRegex.test(record.zone)) {
          if (pinCodeRegex.test(record.pincode)) {
            if (
              parseInt(record.is_cod, 10) === Constants.AVAILABLE ||
              parseInt(record.is_cod, 10) === Constants.NOT_AVAILABLE
            ) {
              if (
                parseInt(record.status, 10) === Constants.AVAILABLE ||
                parseInt(record.status, 10) === Constants.NOT_AVAILABLE
              ) {
                // eslint-disable-next-line no-await-in-loop
                await Pincode.findOne({
                  where: {
                    pincode: record.pincode,
                  },
                  // eslint-disable-next-line no-shadow
                }).then(async (data) => {
                  if (!data) {
                    const PincodeFields = {
                      zone: record.zone,
                      pincode: record.pincode,
                      is_cod: record.is_cod,
                      status: record.status,
                    }
                    await PincodeData.push(PincodeFields)
                  }
                })
              }
            }
          }
        }
      }
      const t = await sequelize.transaction()
      if (PincodeData.length > 0) {
        await Pincode.bulkCreate(PincodeData)
          .then(async (data) => {
            if (data) {
              await t.commit()
              return Response.successResponseWithoutData(
                res,
                res.locals.__('pincodeUploadSuccess'),
                Constants.SUCCESS
              )
            }
            return null
          })
          .catch(async () => {
            await t.rollback()
            return Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      } else {
        return Response.successResponseWithoutData(
          res,
          res.locals.__('pincodeUploadSuccess'),
          Constants.SUCCESS
        )
      }
    })
    return null
  },
}
