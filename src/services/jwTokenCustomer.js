const jwt = require('jsonwebtoken')

module.exports = {
  issue(payload) {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        id: payload,
      },
      process.env.JWT_CUSTOMER_SECRETKEY
    )
  },

  issueResetToken(payload) {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        id: payload,
      },
      process.env.JWT_CUSTOMER_SECRETKEY
    )
  },

  verify(token, callback) {
    try {
      return jwt.verify(token, process.env.JWT_CUSTOMER_SECRETKEY, {}, callback)
    } catch (err) {
      return 'error'
    }
  },

  decode(token) {
    const parts = token.split(' ')
    if (parts.length === 2) {
      const scheme = parts[0]
      const credentials = parts[1]
      if (/^Bearer$/i.test(scheme)) {
        return credentials
      }
      return false
    }
    return false
  },
}
