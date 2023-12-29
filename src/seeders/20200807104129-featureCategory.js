const slugify = require('slugify')
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'feature_category',
      [
        {
          name: 'Clearance Sale',
          slug: slugify('Clearance Sale', {
            replacement: '-',
            remove: /[*+~.()'"!:@]/gi,
            lower: true,
            strict: true,
          }),
          start_date: '2020-08-06 16:43:53',
          end_date: '2020-08-06 16:43:53',
          image: '',
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Flash Sale',
          slug: slugify('Flash Sale', {
            replacement: '-',
            remove: /[*+~.()'"!:@]/gi,
            lower: true,
            strict: true,
          }),
          start_date: '2020-08-06 16:43:53',
          end_date: '2020-08-06 16:43:53',
          image: '',
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Limited time Offers',
          slug: slugify('Limited time Offers', {
            replacement: '-',
            remove: /[*+~.()'"!:@]/gi,
            lower: true,
            strict: true,
          }),
          start_date: '2020-08-06 16:43:53',
          end_date: '2020-08-06 16:43:53',
          image: '',
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('feature_category', null, {})
  },
}
