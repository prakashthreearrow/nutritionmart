const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const {
  ACTIVE,
  SUCCESS,
  PAYMENT_GATEWAY,
  PAYMENT_GATEWAY_BANK,
} = require('../../../services/Constants')
const { PaymentGateway, PaymentGatewayGroup } = require('../../../models')
const helper = require('../../../services/Helper')
const {
  PaymentGatewayList,
} = require('../../../transformers/api/PaymentGatewayTransformer')
const bankName = require('../../../bankData/bankName.json')
module.exports = {
  /**
   * @description Payment gateway list
   * @param req
   * @param res
   */
  paymentList: async (req, res) => {
    await PaymentGatewayGroup.findAndCountAll({
      where: {
        status: ACTIVE,
      },
      include: {
        model: PaymentGateway,
        required: false,
        where: {
          status: ACTIVE,
        },
        attributes: [
          'id',
          'type',
          'position',
          'icon',
          'description',
          'payment_group',
          'payment_method',
          'status',
        ],
      },
      order: [['position', 'ASC']],
    }).then(async (data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        result.map((data) => {
          data.PaymentGateways.map((payment) => {
            payment.icon = helper.mediaUrlForS3(PAYMENT_GATEWAY, payment.icon)
          })
        })
        return Response.successResponseData(
          res,
          new Transformer.List(result, PaymentGatewayList).parse(),
          SUCCESS,
          res.locals.__('success')
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
  bankList: async (req, res) => {
    const reqParam = req.body
    if (reqParam.popularbank === 1) {
      const popularBank = [
        {
          ID: 8,
          ShortName: 'HDFC',
          Bank: 'HDFC Bank',
          IconUrl: helper.mediaUrlForS3(PAYMENT_GATEWAY_BANK, 'hdfc.png'),
          PaymentMethod: 'NB_HDFC',
        },
        {
          ID: 19,
          ShortName: 'SBI',
          Bank: 'State Bank of India',
          IconUrl: helper.mediaUrlForS3(PAYMENT_GATEWAY_BANK, 'sbi.png'),
          PaymentMethod: 'NB_SBI',
        },
        {
          ID: 9,
          ShortName: 'ICICI',
          Bank: 'ICICI Netbanking',
          IconUrl: helper.mediaUrlForS3(PAYMENT_GATEWAY_BANK, 'icici.png'),
          PaymentMethod: 'NB_ICICI',
        },
        {
          ID: 1,
          ShortName: 'AXIS',
          Bank: 'Axis Bank',
          IconUrl: helper.mediaUrlForS3(PAYMENT_GATEWAY_BANK, 'axis.png'),
          PaymentMethod: 'NB_AXIS',
        },
      ]
      return Response.successResponseData(
        res,
        popularBank,
        SUCCESS,
        res.locals.__('success')
      )
    } else {
      return Response.successResponseData(
        res,
        bankName,
        SUCCESS,
        res.locals.__('success')
      )
    }
  },
}
