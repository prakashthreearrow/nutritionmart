# Backend

NodeJS

DB Name - nutristar

###Commands for generating Migration and seeder :

init setup

```
npx sequelize-cli init

```

Model + Migration file

```
    npx sequelize-cli model:generate --name admin_login_token --attributes firstName:string,lastName:string,email:string
```

Migration file generate

```
    npx sequelize-cli migration:generate --name brand

```

Migration run

```
    npx sequelize-cli db:migrate
```

Create Seeder

```
    npx sequelize-cli seed:generate --name adminSeeder
```

Run Seeder

```
    npx sequelize-cli db:seed:all

                OR

    npx sequelize-cli db:seed --seed src/seeders/20200721183841-brandSeeder.js

```

Undo all seeding

```
    npx sequelize-cli db:seed:undo:all

```
# nutritionmart
