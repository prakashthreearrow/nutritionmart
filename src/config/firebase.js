const firebaseAdmin = require('firebase-admin')

//const serviceAccount = require('./cms-covid-id-firebase-adminsdk-621oc-9ea04a1c7c')

firebaseAdmin.initializeApp({
  //  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://cms-covid-id.firebaseio.com',
})

module.exports.firebaseAdmin = firebaseAdmin
