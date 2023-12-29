'use strict';
const Constants = require('../services/Constants');
const slugify = require('slugify');

module.exports = {
  up: (queryInterface, Sequelize) => {


    return queryInterface.bulkInsert('brand', [{
      name:'Marie Rose',
      slug: slugify('Marie Rose',{ replacement: '-',
          remove: true,
          lower: true,
      }),
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
      image:'Rose.jpg',
      banner_image:'RoseWater.jpg',
      status: Constants.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
        name:'John Martin',
        slug: slugify('John Martin',{ replacement: '-',
            remove: true,
            lower: true,
        }),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
        image:'John.jpg',
        banner_image:'BabyJohnson.jpg',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        name:'Prakash3',
        slug: slugify('John Martin',{ replacement: '-',
            remove: true,
            lower: true,
        }),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
        image:'John.jpg',
        banner_image:'BabyJohnson.jpg',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
    }, {
        name:'prakash1',
        slug: slugify('John Martin',{ replacement: '-',
            remove: true,
            lower: true,
        }),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
        image:'John.jpg',
        banner_image:'BabyJohnson.jpg',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
    }, {
        name:'Prakash2',
        slug: slugify('John Martin',{ replacement: '-',
            remove: true,
            lower: true,
        }),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
        image:'John.jpg',
        banner_image:'BabyJohnson.jpg',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
    },
        {
        name:'Karan Rose',
        slug: slugify('Karan Rose',{ replacement: '-',
            remove: true,
            lower: true,
        }),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries',
        image:'Rose.jpg',
        banner_image:'RoseWater.jpg',
        status: Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      ])
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('brand', null, {});
  }
};
