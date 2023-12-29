const bcrypt = require('bcrypt')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Helper = require('../../services/Helper')
const Mailer = require('../../services/Mailer')
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../../services/AdminValidation')
const { issueAdmin } = require('../../services/jwtToken')
const { login, modules } = require('../../transformers/admin/AuthTransformer')
const { Admin, AdminLoginToken, AdminModule } = require('../../models')

module.exports = {
  /**
   * @description admin login controller
   * @param req
   * @param res
   */
  login: async (req, res) => {
    const reqParam = req.fields
    loginValidation(reqParam, res, (validate) => {
      if (validate) {
        Admin.findOne({
          include: [
            {
              model: AdminModule,
              attributes: ['id', 'name', 'slug'],
              status: {
                [Op.ne]: [Constants.DELETE],
              },
            },
          ],
          where: {
            email: reqParam.email,
            status: {
              [Op.ne]: Constants.DELETE,
            },
          },
        }).then(
          (admin) => {
            if (admin) {
              if (admin.status === Constants.ACTIVE) {
                bcrypt.compare(
                  reqParam.password,
                  admin.password,
                  async (err, result) => {
                    if (err) {
                      return Response.errorResponseData(
                        res,
                        res.locals.__('emailPasswordNotMatch'),
                        null,
                        Constants.BAD_REQUEST
                      )
                    }
                    if (result) {
                      const superAdminExpTime =
                        Math.floor(Date.now() / 1000) +
                        60 * 60 * 24 * process.env.SUPER_ADMIN_TOKEN_EXP
                      const subAdminExpTime =
                        Math.floor(Date.now() / 1000) +
                        60 * 60 * 24 * process.env.SUB_ADMIN_TOKEN_EXP
                      const payload = {
                        id: admin.id,
                        type: admin.type,
                        exp:
                          admin.type === Constants.SUPER_ADMIN
                            ? superAdminExpTime
                            : subAdminExpTime,
                      }

                      const token = issueAdmin(payload)

                      await AdminLoginToken.create({
                        admin_id: admin.id,
                        token: token,
                        expire: payload.exp,
                      })
                        .then(() => {
                          const meta = { token }
                          /* eslint no-param-reassign: "error" */
                          admin.modules = admin.AdminModules
                          return Response.successResponseData(
                            res,
                            new Transformer.Single(admin, login).parse(),
                            Constants.SUCCESS,
                            res.locals.__('loginSuccess'),
                            meta
                          )
                        })
                        .catch(() => {
                          return Response.errorResponseData(
                            res,
                            res.__('internalError'),
                            Constants.INTERNAL_SERVER
                          )
                        })
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('emailPasswordNotMatch'),
                        Constants.FAIL
                      )
                    }
                    return null
                  }
                )
              } else {
                Response.successResponseWithoutData(
                  res,
                  res.locals.__('accountIsInactive'),
                  Constants.UNAUTHORIZED
                )
              }
            } else {
              Response.successResponseWithoutData(
                res,
                res.locals.__('emailNotExist'),
                Constants.FAIL
              )
            }
          },
          () => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          }
        )
      }
    })
  },

  /**
   * @description admin forgot password controller
   * @param req
   * @param res
   */
  forgotPassword: async (req, res) => {
    const reqParam = req.fields
    forgotPasswordValidation(reqParam, res, (validate) => {
      if (validate) {
        Admin.findOne({
          where: {
            email: reqParam.email.toLowerCase(),
            status: {
              [Op.ne]: Constants.DELETE,
            },
          },
        }).then(
          async (admin) => {
            if (admin) {
              if (admin.status === Constants.ACTIVE) {
                const minutesLater = new Date()
                const restTokenExpire = minutesLater.setMinutes(
                  minutesLater.getMinutes() + 20
                )
                const otp = await Helper.makeRandomDigit(6)

                admin.reset_token = otp
                admin.code_expiry = restTokenExpire

                await admin.save().then(
                  async (updatedAdmin) => {
                    if (!updatedAdmin) {
                      Response.errorResponseData(
                        res,
                        res.locals.__('accountIsInactive'),
                        Constants.BAD_REQUEST
                      )
                    } else {
                      const locals = {
                        username: admin.name,
                        appName: Helper.AppName,
                        otp,
                      }
                      try {
                        await Mailer.sendAdminForgotPasswordMail(
                          reqParam.email,
                          locals
                        )
                        return Response.successResponseData(
                          res,
                          null,
                          Constants.SUCCESS,
                          res.locals.__('forgotPasswordEmailSendSuccess')
                        )
                      } catch (e) {
                        Response.errorResponseData(
                          res,
                          e.message,
                          Constants.INTERNAL_SERVER
                        )
                      }
                    }
                    return null
                  },
                  () => {
                    Response.errorResponseData(
                      res,
                      res.__('internalError'),
                      Constants.INTERNAL_SERVER
                    )
                  }
                )
              } else {
                Response.errorResponseData(
                  res,
                  res.locals.__('accountIsInactive'),
                  Constants.UNAUTHORIZED
                )
              }
            } else {
              Response.successResponseWithoutData(
                res,
                res.locals.__('emailNotExist'),
                Constants.FAIL
              )
            }
          },
          () => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          }
        )
      }
    })
  },

  /**
   * @description admin reset password controller
   * @param req
   * @param res
   */
  resetPassword: async (req, res) => {
    const requestParams = req.fields
    resetPasswordValidation(requestParams, res, async (validate) => {
      if (validate) {
        const { email } = requestParams
        const { otp } = requestParams
        const { password } = requestParams

        bcrypt.hash(password, 10, async (err, newPassword) => {
          if (err) {
            Response.errorResponseData(
              res,
              res.__('somethingWentWrong'),
              Constants.INTERNAL_SERVER
            )
          }
          Admin.findOne({
            where: {
              reset_token: otp,
              email: email,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then(
            async (admin) => {
              if (admin) {
                if (admin.reset_token === otp) {
                  if (admin.code_expiry.getTime() >= Date.now()) {
                    admin.password = newPassword
                    admin.reset_token = ''

                    await admin
                      .save()
                      .then((updated) => {
                        if (updated) {
                          Response.successResponseWithoutData(
                            res,
                            res.__('passwordResetSuccessfully')
                          )
                        } else {
                          Response.successResponseWithoutData(
                            res,
                            res.__('resetPasswordFailed'),
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
                  } else {
                    Response.successResponseWithoutData(
                      res,
                      res.locals.__('verificationCodeExpired'),
                      Constants.FAIL
                    )
                  }
                } else {
                  Response.successResponseWithoutData(
                    res,
                    res.locals.__('invalidResetToken'),
                    Constants.FAIL
                  )
                }
              } else {
                Response.successResponseWithoutData(
                  res,
                  res.locals.__('invalidResetToken'),
                  Constants.FAIL
                )
              }
            },
            () => {
              Response.errorResponseData(
                res,
                res.__('internalError'),
                Constants.INTERNAL_SERVER
              )
            }
          )
        })
      } else {
        Response.errorResponseData(
          res,
          res.__('error'),
          Constants.INTERNAL_SERVER
        )
      }
    })
  },

  /**
   * @description admin change password
   * @param req
   * @param res
   */
  changePassword: async (req, res) => {
    const { authUserId } = req
    const requestParams = req.fields
    changePasswordValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Admin.findOne({
          where: {
            id: authUserId,
            status: {
              [Op.ne]: Constants.DELETE,
            },
          },
        })
          .then(async (adminData) => {
            if (adminData) {
              bcrypt.compare(
                requestParams.old_password,
                adminData.password,
                async (err, oldPasswordRes) => {
                  if (err) {
                    Response.errorResponseData(
                      res,
                      res.__('somethingWentWrong'),
                      Constants.INTERNAL_SERVER
                    )
                  }
                  if (oldPasswordRes) {
                    bcrypt.compare(
                      requestParams.password,
                      adminData.password,
                      async (innerErr, newPasswordRes) => {
                        if (innerErr) {
                          Response.errorResponseData(
                            res,
                            res.__('somethingWentWrong'),
                            Constants.INTERNAL_SERVER
                          )
                        }
                        if (newPasswordRes) {
                          Response.successResponseWithoutData(
                            res,
                            res.__('oldNewPasswordSame'),
                            Constants.FAIL
                          )
                        } else {
                          bcrypt.hash(
                            requestParams.password,
                            10,
                            (bcryptErr, adminPassword) => {
                              if (bcryptErr) {
                                Response.errorResponseData(
                                  res,
                                  res.__('somethingWentWrong'),
                                  Constants.INTERNAL_SERVER
                                )
                              }
                              Admin.update(
                                {
                                  password: adminPassword,
                                },
                                {
                                  where: {
                                    id: adminData.id,
                                  },
                                }
                              ).then((update) => {
                                if (update) {
                                  Response.successResponseWithoutData(
                                    res,
                                    res.__('changePasswordSuccess')
                                  )
                                } else {
                                  Response.errorResponseData(
                                    res,
                                    res.__('somethingWentWrong'),
                                    Constants.INTERNAL_SERVER
                                  )
                                }
                              })
                            }
                          )
                        }
                      }
                    )
                  } else {
                    Response.successResponseWithoutData(
                      res,
                      res.__('oldPasswordNotMatch'),
                      Constants.FAIL
                    )
                  }
                }
              )
            } else {
              return Response.successResponseData(
                res,
                null,
                Constants.SUCCESS,
                res.locals.__('noSubAdminFound')
              )
            }
            return null
          })
          .catch(() => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      } else {
        Response.errorResponseData(
          res,
          res.__('error'),
          Constants.INTERNAL_SERVER
        )
      }
    })
  },

  /**
   * @description List of all modules
   * @param req
   * @param res
   */
  adminModuleList: async (req, res) => {
    const query = {
      status: {
        [Op.ne]: [Constants.DELETE],
      },
    }

    await AdminModule.findAndCountAll({
      where: query,
      order: [['updatedAt', 'DESC']],
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        return Response.successResponseData(
          res,
          new Transformer.List(result, modules).parse(),
          Constants.SUCCESS,
          res.locals.__('success')
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

  adminDetail: async (req, res) => {
    const { authUserId } = req
    Admin.findOne({
      include: [
        {
          model: AdminModule,
          attributes: ['id', 'name', 'slug'],
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
      ],
      where: {
        id: authUserId,
        status: {
          [Op.ne]: Constants.DELETE,
        },
      },
    })
      .then((admin) => {
        if (admin) {
          if (admin.status === Constants.ACTIVE) {
            admin.modules = admin.AdminModules
            return Response.successResponseData(
              res,
              new Transformer.Single(admin, login).parse(),
              Constants.SUCCESS,
              res.locals.__('adminDetail'),
              null
            )
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__('accountIsInactive'),
              Constants.UNAUTHORIZED
            )
          }
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('adminNotExist'),
            Constants.FAIL
          )
        }
      })
      .catch(() => {
        return Response.errorResponseData(
          res,
          res.__('error'),
          Constants.INTERNAL_SERVER
        )
      })
  },
}
