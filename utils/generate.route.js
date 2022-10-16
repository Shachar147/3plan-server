const fs = require('fs');
const colors = require('colors');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const rimraf = require('rimraf');

const allowedTypes = ['string', 'float', 'timestamp', 'number']; // if adding more, modify rewrite Dto func

// consts
const templatesDir = '../../route_templates';

// variables
let routeName = '';
let folderName = '';
const params = [];

// get data from user
rl.question('What is the name of the route ? ', function (name) {
  name = name.trim();

  if (!isSameCase(name)) {
    name = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

  name = name.replace(/\s\s+/g, ' ');
  name = name.replace(/\s/g, '-');
  routeName = name.toLowerCase();
  folderName = 'src/' + routeName;

  // rl.question("Where do you live ? ", function(country) {
  console.log(`New Route Folder Name: ${name}`);

  console.log("\n---------------------\nConfigure Entites\n---------------------\nAllowed Types: " + allowedTypes + "\ntype 'stop' to finish entities configuration.")
  recursiveAsyncReadLine(params.length + 1);
});

// generate route based on details
rl.on('close', async function () {
  if (routeName === '' || folderName === '') {
    console.log('Error! please provide route name!'.red);
    return false;
  }

  if (params.length === 0) {
    console.log('Error! please provide at least one param!'.red);
    return false;
  }

  console.log('\nParams:');
  console.log(params);
  console.log('---------------------');
  // return false;

  console.log('\n... creating folder');
  let isOk = 0;
  isOk = createFolder(folderName);

  if (isOk) {
    console.log('\n... copy template files');
    isOk = await copyRecursiveSync(templatesDir, folderName);
  }

  let ucFirstName = titleCase(routeName, '-').split('-').join('');

  if (isOk) {
    console.log('\n... edit files based on user configuration');
    isOk = modifyTemplates(folderName, routeName);
  }

  if (isOk) {
    console.log(
      '\n... modify user.entity to connect between the new route and users table.',
    );
    isOk = linkToUsers(routeName, ucFirstName);
  }

  if (isOk) {
    console.log('\n... modify app module to contain new route');
    isOk = modifyAppModule(routeName, ucFirstName);
  }

  process.exit(0);
});

// ----------------------------------------
// functions
// ----------------------------nam------------

let recursiveAsyncReadLine = function (num) {
  console.log(`\nColumn #${num}`);
  rl.question(`> Name: `, function (name) {
    if (name === 'stop') { rl.close(); return false; }
    rl.question(`> Type: `, function (type) {
      if (type === 'stop') { rl.close(); }
      rl.question(`> Required? (y/n): `, function (is_required) {
        if (type === 'stop') {
          rl.close();
        }

        if (allowedTypes.indexOf(type) === -1){
          console.log('invalid type!'.red);
          recursiveAsyncReadLine(params.length + 1);
          return false;
        }

        params.push({
          name: name,
          type: type,
          required: is_required,
        });

        recursiveAsyncReadLine(params.length + 1);
      });
    });
  });
};

function createFolder(folderName) {
  let isOk = 0;

  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
      isOk = 1;
    } else {
      console.log('Error - This route already exist!'.red);
    }
  } catch (err) {
    console.log('Error:', err.red);
  }
  return isOk;
}

function modifyTemplates(folderName, routeName) {
  let isOk = 1;

  try {
    let ucFirstName = titleCase(routeName, '-').split('-').join('');
    let fileName = routeName; // .replace(/\-/g, '.');
    let camelCase = titleCaseToCamelCase(ucFirstName);

    // console.log('ucFirstName: ', ucFirstName);
    // console.log('camelCase: ', camelCase);
    // console.log('fileName:', fileName);
    // console.log('routeName:', routeName);

    const files = [
      {
        controller: {
          file_path: folderName + '/template.controller.ts',
          new_file_path: folderName + `/${fileName}.controller.ts`,
        },
      },
      {
        module: {
          file_path: folderName + '/template.module.ts',
          new_file_path: folderName + `/${fileName}.module.ts`,
        },
      },
      {
        service: {
          file_path: folderName + '/template.service.ts',
          new_file_path: folderName + `/${fileName}.service.ts`,
        },
      },
      {
        repository: {
          file_path: folderName + '/template.repository.ts',
          new_file_path: folderName + `/${fileName}.repository.ts`,
        },
      },
      {
        entity: {
          file_path: folderName + '/template.entity.ts',
          new_file_path: folderName + `/${fileName}.entity.ts`,
        },
      },
    ];

    files.forEach((file_settings) => {
      const name = Object.keys(file_settings)[0];
      const settings = file_settings[name];
      const file_path = settings.file_path;
      const new_file_path = settings.new_file_path;

      console.log(`\n........ ${name}`);
      isOk =
        isOk &&
        modifyTemplateFile(
          file_path,
          new_file_path,
          folderName,
          routeName,
          ucFirstName,
          fileName,
          camelCase,
        );
    });
  } catch (error) {
    console.log(error.red);
    isOk = 0;
  }

  // modify DTOs
  rewriteDTOs(folderName);

  fs.unlinkSync(folderName + '/readme.txt');

  return isOk;
}

function rewriteDTOs(folderName) {

  let content;

  // create
  let create_arr = [
    "import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';",
    "import { ApiProperty } from '@nestjs/swagger';",
    '',
    'export class CreateDto {',
  ];

  // list
  let list_arr = [
    "import { IsOptional, IsString } from 'class-validator'",
    "import { ApiProperty } from '@nestjs/swagger';",
    '',
    'export class ListDto {',
  ];

  // fill in params
  params.forEach((param) => {

    let type = (param.type === 'timestamp') ? `'${param.type}'` : param.type;
    if (type === 'float') type = 'number';

    const api_property_options = [];
    const is_required = (param.required === 'y') ? 'true' : 'false';
    api_property_options.push (`required: ${is_required}`);

    let Type = 'String';
    if (type === 'number') Type = 'Number';
    api_property_options.push(`type: ${Type}`);
    if (param.type === 'timestamp') { api_property_options.push("format: 'date-time'"); }

    create_arr.push('');
    create_arr.push(`  @ApiProperty({ ${api_property_options.join(', ')} })`);

    if (param.required === 'y') {
      create_arr.push('  @IsNotEmpty({');
      create_arr.push(`    message: 'You must provide ${param.name}',`);
      create_arr.push('  })');
    } else {
      create_arr.push('  @IsOptional()');
    }
    create_arr.push(`  ${param.name}: ${type};`);


    list_arr.push('');
    api_property_options[0] = 'required: false';
    list_arr.push(`  @ApiProperty({ ${api_property_options.join(', ')} })`);
    list_arr.push('  @IsOptional()');
    list_arr.push(`  ${param.name}: ${type};`)

  });

  create_arr.push('}');
  list_arr.push('}');

  console.log(`\n........ CreateDTO`);
  // console.log(create_arr);
  content = create_arr.join('\n');
  fs.writeFileSync(folderName + '/dto/create-dto.ts', content);

  console.log(`\n........ ListDTO`);
  // console.log(list_arr);
  content = list_arr.join('\n');
  fs.writeFileSync(folderName + '/dto/list-dto.ts', content);

  console.log(`\n........ UpdateDTO`);
  // console.log(list_arr);
  content = list_arr.join('\n').replace('ListDto', 'UpdateDto');
  fs.writeFileSync(folderName + '/dto/update-dto.ts', content);
}

function modifyTemplateFile(
  file_path,
  new_file_path,
  folderName,
  routeName,
  ucFirstName,
  fileName,
  camelCase,
) {
  let isOk = 1;

  let table_name = routeName.replace(/\-/g, '_');

  let spaceName = capitalCaseToSentenceCase(ucFirstName);

  let arr = fs.readFileSync(file_path, 'utf8').split('\n');
  const new_arr = [];
  for (let i = 0; i < arr.length; i++) {
    let line = arr[i];

    line = line.replace('{spaceName}', spaceName);

    line = line.replace('TemplateService', `${ucFirstName}Service`);
    line = line.replace('TemplateController', `${ucFirstName}Controller`);
    line = line.replace('TemplateRepository', `${ucFirstName}Repository`);
    line = line.replace('TemplateEntity', `${ucFirstName}Entity`);
    line = line.replace(
      'export class TemplateModule',
      `export class ${ucFirstName}Module`,
    );

    line = line.replace('template.service', `${fileName}.service`);
    line = line.replace('template.controller', `${fileName}.controller`);
    line = line.replace('template.repository', `${fileName}.repository`);
    line = line.replace('template.entity', `${fileName}.entity`);

    line = line.replace(
      "@Controller('/template')",
      `@Controller('/${routeName}')`,
    );

    line = line.replace('templateService', `${camelCase}Service`);
    line = line.replace('templateRepository', `${camelCase}Repository`);

    line = line.replace(
      'import { Template } from ',
      `import { ${ucFirstName} } from `,
    );
    line = line.replace('<Template>', `<${ucFirstName}>`);
    line = line.replace('(Template)', `(${ucFirstName})`);

    line = line.replace(
      "this.createQueryBuilder('template')",
      `this.createQueryBuilder('${table_name}')`,
    );

    line = line.replace(
      "query.orderBy('template.id'",
      ` query.orderBy('${table_name}.id'`,
    );

    line = line.replace(': Template,', `: ${ucFirstName},`);
    line = line.replace('(template.', `(${table_name}.`);

    line = line.replace(
      'export class Template extends BaseEntity',
      `export class ${ucFirstName} extends BaseEntity`,
    );

    line = line.replace(
      '// @ManyToOne(type => User, user => user.templates, { eager: false })',
      `@ManyToOne(type => User, user => user.${getPluralName(
        routeName,
      )}, { eager: false })`,
    );

    line = line.replace('../../src/', '../src/');
    line = line.replace('../src/auth', '../auth');
    line = line.replace('src/auth', '../auth');

    // modify entity columns
    if (file_path.indexOf('entity') !== -1) {
      if (i + 2 < arr.length && arr[i + 2].indexOf('field1: string') !== -1) {
        i = arr.length - 2;

        params.forEach((param) => {

          let column = '@Column()';
          let type = param.type;

          if (type === 'timestamp') {
            column = "@Column({ type: 'timestamp' })";
            type = "'timestamp'";
          }
          else if (type === 'float') {
            column = "@Column({ type: 'float', nullable: true })";
            type = 'number';
          }

          new_arr.push('');
          new_arr.push(`  ${column}`);
          new_arr.push(`  ${param.name}: ${type};`);
        });

        continue;
      }
    }

    // modify service
    if (file_path.indexOf('service') !== -1){
      let key = 'if (!isDefined(updateDto.field1) && !isDefined(updateDto.field2)) {';
      if (line.indexOf(key) !== -1){
        let replaceWith = ` if (` + params.map((param) => `!isDefined(updateDto.${param.name})`).join(' && ') + `) {`;
        line = line.replace(key, replaceWith);
      }
    }

    // modify repository
    if (file_path.indexOf('repository') !== -1){
      line = line.replace('const { field1, field2 }', `const { ${params.map(param => param.name).join(', ')} }`);
      if (line.indexOf('record.field1 = field1') !== -1){
        params.map(param => `    record.${param.name} = ${param.name};`).forEach((l) => {
          new_arr.push(l);
        })

        i++; // to skip field2 too.
        continue;
      }

      if (line.indexOf('if (field1) query.andWhere(') !== -1){
        params.map(param => `    if (${param.name}) query.andWhere('(${table_name}.${param.name} = :${param.name})', { ${param.name} });`).forEach((l) => {
          new_arr.push(l);
        })

        i++; // to skip field2 too.
        continue;
      }

    }

    new_arr.push(line);
  }

  let content = new_arr.join('\n');
  fs.writeFileSync(new_file_path, content);
  fs.unlinkSync(file_path);

  // console.log('arr: ', arr);
  new_arr.forEach((line) => {
    if (line.toLowerCase().indexOf('template') !== -1) {
      console.log(line.red);
      isOk = 0;
    }
  });

  return isOk;
}

function linkToUsers(routeName, ucFirstName) {
  let isOk = 1;

  const file_path = 'src/auth/user.entity.ts';

  const new_arr = [];

  let arr = fs.readFileSync(file_path, 'utf8').split('\n');
  for (let i = 0; i < arr.length; i++) {
    let line = arr[i];

    if (line.indexOf('async validatePassword') !== -1) {
      new_arr.push(
        `  @OneToMany(type => ${ucFirstName}, record => record.user, { eager: true })`,
      );
      new_arr.push(`  ${getPluralName(routeName)}: ${ucFirstName}[];`);
      new_arr.push('');
    }

    if (i + 1 < arr.length && arr[i + 1].indexOf('@Entity()') !== -1) {
      new_arr.push(
        `import { ${ucFirstName} } from '../${routeName}/${routeName}.entity';`,
      );
    }

    new_arr.push(line);
  }

  try {
    fs.writeFileSync(file_path, new_arr.join('\n'));
  } catch (error) {
    console.log(error.red);
    isOk = 0;
  }

  return isOk;
}

function modifyAppModule(routeName, ucFirstName) {
  let isOk = 1;

  const file_path = 'src/app.module.ts';

  const new_arr = [];

  let arr = fs.readFileSync(file_path, 'utf8').split('\n');
  for (let i = 0; i < arr.length; i++) {
    let line = arr[i];

    if (i + 1 < arr.length && arr[i + 1].indexOf('controllers:') !== -1) {
      new_arr.push(`    ${ucFirstName}Module,`);
    }

    if (i + 1 < arr.length && arr[i + 1].indexOf('@Module({') !== -1) {
      new_arr.push(
        `import { ${ucFirstName}Module } from './${routeName}/${routeName}.module';`,
      );
    }

    new_arr.push(line);
  }

  try {
    fs.writeFileSync(file_path, new_arr.join('\n'));
  } catch (error) {
    console.log(error.red);
    isOk = 0;
  }

  return isOk;
}

// -- helpers -------------------------
function getPluralName(str) {
  let plural_name = str.replace(/\-/g, '_');
  if (plural_name[plural_name.length - 1] !== 's') {
    plural_name += 's';
  }
  return plural_name;
}

function isSameCase(str) {
  return str.toLowerCase() === str || str.toUpperCase() === str;
}

function titleCase(str, separator) {
  var splitStr = str.toLowerCase().split(separator);
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(separator);
}

function titleCaseToCamelCase(text) {
  return text[0].toLowerCase() + text.slice(1, text.length);
}

function capitalCaseToSentenceCase(text){
  var result = text.replace( /([A-Z])/g, " $1" );
  var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
  finalResult = finalResult.slice(1);
  return finalResult;
}

async function copyRecursiveSync(src, dest) {
  let isOk = 1;

  let exists = fs.existsSync(src);
  let stats = exists && fs.statSync(src);
  let isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    try {
      fs.mkdirSync(dest);
    } catch {}

    fs.readdirSync(src).forEach(function (childItemName) {
      isOk =
        isOk &&
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName),
        );
    });
  } else {
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      isOk = 0;
      console.log(err);
    }
  }

  return isOk;
}
