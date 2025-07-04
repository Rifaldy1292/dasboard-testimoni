-- Active: 1744146286139@@127.0.0.1@5432@postgres@public

# SETUP SERVER EXPRESS WITH SEQUELIZE ORM

1. pnpm init -y

- untuk membuat package.json, package.json berfungsi untuk menyimpan informasi package/modul dalam aplikasi kita.
- NPM = node package manager

2. pnpm install <package_name>

- untuk menginstall modul dari pnpm
- pnpm install express pg sequelize dotenv cors bcrypt jsonwebtoken
- pnpm install nodemon sequelize-cli --save-dev

3. Membuat file app.js dan .gitignore, .env

- gitignore berfungsi untuk tidak memasukkan node_modules ke dalam GitHub repository.
- env berfungsi untuk meletakan variable yang akan di gunakan dalam environment tertentu.

4. Membuat \_routing dan controllers\_\_

5. npx nodemon app.js

- untuk menjalankan

KONFIGURASI POSTGRES MENGGUNAKAN SEQUELIZE

1. npx sequelize-cli init

- untuk membuat initiation awal sequelize

2. Konfigurasi database di dalam config.json

3. npx sequelize-cli db:create

- untuk membuat database lewat sequelize tanpa query manual

4. npx sequelize-cli model:generate --name User --attributes name:string,password:string,role_id:integer,nik:integer
5. npx sequelize-cli model:generate --name Role --attributes name:string
6. npx sequelize-cli model:generate --name Brand --attributes name:string
7. npx sequelize-cli model:generate --name Status --attributes name:string
8. npx sequelize-cli model:generate --name Machine --attributes name:string,brand_id:integer,power_input:integer,stroke_axxis:string,spindel_rpm:string,status_id:integer

9. npx sequelize-cli model:generate --name MachineLog --attributes machine_id:number,previous_status:string,current_status:string,timestamp:date

- 10. npx sequelize-cli model:generate --name CuttingTime --attributes machine_id:integer, target: integer,

- 11. npx sequelize-cli model:generate --name EncryptData --attributes encrypt_number:integer, original_text:string

next_projects is

```js
[{g_code_name: test | null, toolname, user_id, output_wp... }]
```

8. npx sequelize-cli model:generate --name TransferFile --attributes user_id:integer,g_code_name:string,k_num:string,output_wp:string,tool_name:string,total_cutting_time:integer,calculate_total_cutting_time:string,next_projects:jsonb

- untuk membuat class dan juga migrations

5. npx sequelize-cli db:migrate

- untuk melakukan migrations
- agar table di buat

6. npx sequelize-cli db:seed --seed <nama-file-seeder>
   npx sequelize-cli db:seed:all

- untuk melakukan seed data

npx sequelize db:migrate --name add-additional-column-to-machine-log

npx sequelize-cli migration:generate --name add_tool_name_to_machinelog
npx sequelize-cli model:generate --name DailyConfig --attributes date:date,startFirstShift:time,startSecondShift:time,description:string
npx sequelize-cli model:generate --name MachineOperatorAssignment --attributes machine_id:integer,user_id:integer,is_using_custom:boolean

backup db: "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -b -v -f dashboard_machine_backup.dump yamaha_dashboard_machine

# Hapus database yang sudah ada

"C:\Program Files\PostgreSQL\17\bin\dropdb.exe" -U postgres yamaha_dashboard_machine

restore db: "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -h localhost -p 5432 -d yamaha_dashboard_machine -v dashboard_machine_backup.dump
