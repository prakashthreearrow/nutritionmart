const jwt = require('jsonwebtoken')

module.exports = {
  issueAdmin(payload) {
    return jwt.sign(
      {
        exp: payload.exp,
        id: payload.id,
        type: payload.type,
      },
      process.env.JWT_SECRETKEY,
      { algorithm: 'HS512' }
    )
  },

  verify(token, callback) {
    try {
      return jwt.verify(token, process.env.JWT_SECRETKEY, {}, callback)
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
