const bcrypt = require('bcrypt')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Mailer = require('../../services/Mailer')
const Helper = require('../../services/Helper')
const {
  subAdminDetail,
  subAdminDetailWithModule,
} = require('../../transformers/admin/AuthTransformer')
const {
  sequelize,
  Admin,
  SubAdminAccess,
  AdminModule,
  AdminLoginToken,
} = require('../../models')
const {
  addEditValidationForAdmin,
  subAdminChangeStatusValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description Sub admin add-edit function
   * @param req
   * @param res
   */
  subAdminAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForAdmin(requestParams, res, (validate) => {
      if (validate) {
        let checkEmailExist
        if (requestParams.id) {
          checkEmailExist = Admin.findOne({
            where: {
              email: requestParams.email,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        } else {
          checkEmailExist = Admin.findOne({
            where: {
              email: requestParams.email,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        }
        checkEmailExist.then(async (adminData) => {
          if (adminData) {
            Response.successResponseWithoutData(
              res,
              res.__('EmailAlreadyExist'),
              Constants.FAIL
            )
          } else {
            const adminObj = {
              name: requestParams.name,
              type: Constants.SUB_ADMIN,
              mobile: requestParams.mobile,
              address: requestParams.address,
              status: requestParams.status,
            }
            if (requestParams.id) {
              if (requestParams.password) {
                adminObj.password = bcrypt.hashSync(requestParams.password, 10)
              }

              Admin.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: Constants.DELETE,
                  },
                },
              })
                .then(async (adminInfo) => {
                  if (adminInfo) {
                    await adminInfo
                      .update(adminObj, {
                        where: {
                          id: requestParams.id,
                        },
                      })
                      .then(async (result) => {
                        if (result) {
                          const adminId = result.id
                          const moduleIds = requestParams.modules
                          const modules = moduleIds.split(',')

                          const moduleArr = []
                          modules.forEach((mod) => {
                            moduleArr.push({
                              admin_id: adminId,
                              admin_module_id: parseInt(mod, 10),
                              status: Constants.ACTIVE,
                            })
                          })

                          await SubAdminAccess.destroy({
                            where: {
                              admin_id: adminId,
                            },
                          }).then(async () => {
                            await SubAdminAccess.bulkCreate(moduleArr)
                              .then(async (data) => {
                                if (data) {
                                  return Response.successResponseData(
                                    res,
                                    new Transformer.Single(
                                      result,
                                      subAdminDetail
                                    ).parse(),
                                    Constants.SUCCESS,
                                    res.locals.__('subAdminUpdated'),
                                    null
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
                          })
                        }
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
                      res.__('SubAdminNotExist'),
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
              const t = await sequelize.transaction()
              adminObj.password = bcrypt.hashSync(requestParams.password, 10)
              adminObj.email = requestParams.email
              await Admin.create(adminObj, { transaction: t })
                .then(async (result) => {
                  if (result) {
                    const adminId = result.id
                    const moduleIds = requestParams.modules
                    const modules = moduleIds.split(',')

                    const moduleArr = []
                    modules.forEach((mod) => {
                      moduleArr.push({
                        admin_id: adminId,
                        admin_module_id: parseInt(mod, 10),
                        status: Constants.ACTIVE,
                      })
                    })

                    await SubAdminAccess.bulkCreate(moduleArr, {
                      transaction: t,
                    })
                      .then(async (data) => {
                        if (data) {
                          await t.commit()
                          // send email to sub-admin
                          const locals = {
                            username: result.name,
                            appName: Helper.AppName,
                            email: requestParams.email,
                            password: requestParams.password,
                            admin_panel: process.env.APP_URL,
                          }
                          await Mailer.sendPasswordMail(result.email, locals)

                          return Response.successResponseData(
                            res,
                            new Transformer.Single(
                              result,
                              subAdminDetail
                            ).parse(),
                            Constants.SUCCESS,
                            res.locals.__('subAdminCreated'),
                            null
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
                  }
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
      }
    })
  },

  /**
   * @description get list of all sub admin
   * @param req
   * @param res
   */
  subAdminList: async (req, res) => {
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

    let query = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
      type: Constants.SUB_ADMIN,
    }

    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }

    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
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

    Admin.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
    })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, subAdminDetail).parse(),
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
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description get detail of sub admin
   * @param req
   * @param res
   */
  subAdminDetail: async (req, res) => {
    const requestParams = req.params
    const assignedModules = []
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidSubAdminId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Admin.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
          },
          type: Constants.SUB_ADMIN,
        },
      })
        .then(async (adminData) => {
          if (adminData) {
            const subAdminId = adminData.id
            await SubAdminAccess.findAll({
              include: [
                {
                  model: AdminModule,
                  required: false,
                },
              ],
              where: {
                admin_id: subAdminId,
                status: Constants.ACTIVE,
              },
            })
              .then(async (result) => {
                if (result.length > 0) {
                  result.forEach((data) => {
                    assignedModules.push({
                      id: data.AdminModule.id,
                      name: data.AdminModule.name,
                      slug: data.AdminModule.slug,
                    })
                  })
                }
                adminData.modules = assignedModules
                return Response.successResponseData(
                  res,
                  new Transformer.Single(
                    adminData,
                    subAdminDetailWithModule
                  ).parse(),
                  Constants.SUCCESS,
                  res.locals.__('success'),
                  null
                )
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
              Constants.FAIL
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
  },

  /**
   * @description change the status of sub admin
   * @param req
   * @param res
   */
  subAdminUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    subAdminChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Admin.findOne({
          where: {
            id: requestParams.id,
            type: Constants.SUB_ADMIN,
          },
        })
          .then(async (adminData) => {
            if (adminData) {
              /* eslint no-param-reassign: "error" */
              adminData.status = requestParams.status
              await adminData
                .save()
                .then(async (result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('SubAdminStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      await AdminLoginToken.destroy({
                        where: { admin_id: requestParams.id },
                      }).then()

                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('SubAdminStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      await AdminLoginToken.destroy({
                        where: { admin_id: requestParams.id },
                      }).then()

                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('SubAdminStatusDeactivated'),
                        Constants.SUCCESS
                      )
                    }
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
                res.locals.__('noSubAdminFound'),
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
      }
    })
  },
}
