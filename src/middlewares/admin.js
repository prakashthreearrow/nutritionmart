const Response = require('../services/Response')
const jwToken = require('../services/jwtToken')
const { Admin, SubAdminAccess, AdminModule } = require('../models')
const {
  INACTIVE,
  ACTIVE,
  SUB_ADMIN,
  FAIL,
  NOT_ACCEPTABLE,
} = require('../services/Constants')

module.exports = {
  adminTokenAuth: async (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
      Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
    } else {
      const tokenData = await jwToken.decode(token)
      if (tokenData) {
        // eslint-disable-next-line consistent-return
        jwToken.verify(tokenData, (err, decoded) => {
          if (err) {
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
          }
          if (decoded.id) {
            req.authUserId = decoded.id
            req.type = decoded.type
            // eslint-disable-next-line consistent-return
            Admin.findOne({
              where: {
                id: req.authUserId,
              },
            }).then(async (result) => {
              if (!result) {
                return Response.errorResponseData(
                  res,
                  res.locals.__('invalidToken'),
                  401
                )
              } else {
                if (result && result.status === INACTIVE) {
                  return Response.errorResponseData(
                    res,
                    res.locals.__('accountIsInactive'),
                    401
                  )
                }
                if (result && result.status === ACTIVE) {
                  return next()
                } else {
                  return Response.errorResponseData(
                    res,
                    res.locals.__('accountBlocked'),
                    401
                  )
                }
              }
            })
          } else {
            return Response.errorResponseData(
              res,
              res.locals.__('invalidToken'),
              401
            )
          }
        })
      } else {
        return Response.errorResponseData(
          res,
          res.locals.__('invalidToken'),
          401
        )
      }
    }
    return null
  },

  privilegeMiddleware: function (module) {
    return async (req, res, next) => {
      try {
        const adminId = req.authUserId
        const adminType = req.type

        if (adminType === SUB_ADMIN) {
          await AdminModule.findOne({
            where: {
              slug: module,
            },
          }).then(async (result) => {
            if (!result) {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__('moduleNotFound'),
                NOT_ACCEPTABLE
              )
            } else {
              await SubAdminAccess.findOne({
                where: {
                  admin_id: adminId,
                  admin_module_id: result.id,
                  status: ACTIVE,
                },
              }).then(async (data) => {
                if (!data) {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('privilegeError'),
                    NOT_ACCEPTABLE
                  )
                } else {
                  return next()
                }
              })
            }
            return null
          })
        } else {
          return next()
        }
      } catch (error) {
        next(error)
      }
      return null
    }
  },
}
