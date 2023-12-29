const bcrypt = require('bcrypt')
const Constants = require('../services/Constants')

module.exports = {
  up: (queryInterface) => {
    const hash = bcrypt.hashSync('nutristar@123', 10)

    return queryInterface.bulkInsert('admin', [
      {
        type: '1',
        name: 'admin',
        mobile: '9999999999',
        email: 'nutristar@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Jess',
        mobile: '9923578949',
        email: 'jess@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Sharen',
        mobile: '9998523699',
        email: 'sharen@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Ryan',
        mobile: '9985719345',
        email: 'ryan@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Malcolm',
        mobile: '9097854278',
        email: 'malcolm@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Colette',
        mobile: '9875412359',
        email: 'colette@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Joni',
        mobile: '9754862153',
        email: 'joni@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Ruthann',
        mobile: '7879989999',
        email: 'ruthann@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Tegan',
        mobile: '9956789999',
        email: 'tegan@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Lai',
        mobile: '9985001299',
        email: 'lai@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: '2',
        name: 'Flo',
        mobile: '9956780099',
        email: 'flo@mailinator.com',
        address: '',
        password: hash,
        reset_token: '',
        code_expiry: null,
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },
  down: (queryInterface) => {
    return queryInterface.bulkDelete('admin', null, {})
  },
}