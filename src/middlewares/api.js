const Response = require('../services/Response')
const jwToken = require('../services/jwTokenCustomer')
const { Customer } = require('../models')
const { INACTIVE, ACTIVE } = require('../services/Constants')

module.exports = {
  apiTokenAuth: async (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
      Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
    } else {
      const tokenData = await jwToken.decode(token)
      if (tokenData) {
        jwToken.verify(tokenData, (err, decoded) => {
          if (err) {
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
          }
          if (decoded.id) {
            req.authCustomerId = decoded.id
            console.log(Customer)
            Customer.findOne({
              where: {
                id: req.authCustomerId,
              },
              attributes: ['status', 'recently_viewed'],
            }).then((result) => {
              req.recently_viewed = result.dataValues.recently_viewed
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
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
          }
        })
      } else {
        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
      }
    }
  },

  apiOptionalTokenAuth: async (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
      return next()
    } else {
      const tokenData = await jwToken.decode(token)
      if (tokenData) {
        jwToken.verify(tokenData, (err, decoded) => {
          if (err) {
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
          }
          if (decoded.id) {
            req.authCustomerId = decoded.id
            Customer.findOne({
              where: {
                id: req.authCustomerId,
              },
            }).then((result) => {
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
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
          }
        })
      } else {
        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
      }
    }
  },
}
