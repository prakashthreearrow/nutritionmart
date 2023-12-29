const mailgun = require('mailgun-js')
const DOMAIN = process.env.MAILGUN_DOMAIN
const Helpers = require('../services/Helper')
const { EMAIL_TEMPLATE } = require('./../services/Constants')

module.exports = {
  sendAdminForgotPasswordMail: async (toEmail, locale) => {
    const mailSubject = 'Forgot Password!'
    const template = EMAIL_TEMPLATE.ADMIN_FORGOT_PASSWORD
    const data = {
      from: `${Helpers.AppName} <${process.env.COMPANY_EMAIL}>`,
      to: toEmail,
      subject: mailSubject,
      template: template,
      'v:otp': locale.otp,
      'v:username': locale.username,
    }
    await module.exports.sendMail(toEmail, mailSubject, template, data)
  },

  sendPasswordMail: async (toEmail, locale) => {
    const mailSubject = 'New password generated!'
    const template = EMAIL_TEMPLATE.GENERATE_PASSWORD
    const data = {
      from: `${Helpers.AppName} <${process.env.COMPANY_EMAIL}>`,
      to: toEmail,
      subject: mailSubject,
      template: template,
      'v:email': locale.email,
      'v:password': locale.password,
      'v:admin_panel': locale.admin_panel,
    }
    await module.exports.sendMail(toEmail, mailSubject, template, data)
  },

  sendMail: async (toEmail, mailSubject, templateName, locale) => {
    if (process.env.SEND_EMAIL === 'true') {
      const mg = mailgun({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: DOMAIN,
      })
      await mg.messages().send(locale, function (error, body) {
        if (body) {
          console.log('Message-sent ID- ', body.id)
        } else {
          console.log('Error- ', error)
        }
      })
      return true
    } else {
      return true
    }
  },
}
