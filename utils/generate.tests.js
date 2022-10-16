const fs = require('fs');
const colors = require('colors');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const rimraf = require('rimraf');

const jest_config_file = './jest.config.js';

const mock_response_name = 'mock_response';

const MOCKS_DIR = './test/mocks';
if (!fs.existsSync(MOCKS_DIR)) {
  fs.mkdirSync(MOCKS_DIR);
}

// variables
const stop_keywords = ['stop', 'close'];
let routeName;
let folderName;
let serviceDetails = {};
let dependenciesDetails = {};
let DTOs = {};
let DTOFieldTypes = {};
let exampleErrors = {};

let aliasMap = {};

const tab = '  ';

function readConf() {
  let path = `./utils/generate.tests.conf`;
  const content = fs.readFileSync(`${path}`, 'utf8');
  return JSON.parse(content);
}
const conf = readConf();

readDTOs();

recursiveAsyncReadLine();

// ----------------------------------------
// functions
// ----------------------------------------

async function main() {
  console.log('\n... gathering details');
  let isOk = 0;

  console.log('...... building alias map');
  aliasMap = buildAliasMap();

  console.log('...... route details');
  isOk = buildRouteDetails(folderName, routeName);

  const maineFile = Object.keys(serviceDetails)[0];

  if (isOk) {
    console.log('...... dependencies details');
    Object.keys(serviceDetails).forEach((file) => {
      Object.keys(serviceDetails[file]['imports_mapping']).forEach(
        (dep_name) => {
          const dep_file = serviceDetails[file]['imports_mapping'][dep_name];
          readFile(dep_file, folderName, dependenciesDetails);
        },
      );
    });
  }

  // debug
  // console.log(serviceDetails);
  // console.log(DTOs);

  if (isOk) {
    console.log('\n... build service test file');
    isOk = await buildServiceTestFile(serviceDetails, maineFile);
  }

  return isOk;
}

function buildAliasMap(){

  const hash = {};

  if (fs.existsSync(jest_config_file)) {
    // console.log("hereeee!", jest_config_file);

    const content = fs.readFileSync(jest_config_file, 'utf8');
    const lines = content.split('\n');

    let isStart = 0;
    let isEnd = 0;
    lines.forEach((line) => {

      if (line.indexOf('moduleNameMapper') !== -1){
        isStart = 1;
      }
      else if (isStart && line.indexOf('},') !== -1){
        isStart = 0;
        isEnd = 1;
      }
      else if (isStart && !isEnd){
        let parts = line.split(':');
        const key = parts[0].replace('(.*)$\'','').replace("'^","").trim();
        let val = parts[1].replace("'<rootDir>/","").replace("$1'","").trim();
        if (val.endsWith(",")){
          val = val.substr(0,val.length-1)
        }
        hash[key] = val;
      }
    });

  } else {
    // console.log('not exist :(');
  }

  // console.log(hash);

  return hash;
}

function replaceAliases(str){

  Object.keys(aliasMap).forEach((alias) => {
    str = str.replace(alias, aliasMap[alias]);
  });

  return str;
}

function buildServiceTestFile(serviceDetails, file) {
  const testing_file_name = `${file}.spec.ts`;
  const testing_file_path = folderName + '/' + testing_file_name;

  // debug
  // console.log(serviceDetails);

  // make sure not already exist
  if (fs.existsSync(testing_file_path)) {
    // console.log(`${testing_file_path} already exists! skipping`.red);
    console.log(`${testing_file_path} already exists! updating`.blue);
    // return;
  }

  let arr = [];

  // imports
  arr.push("import { Test, TestingModule } from '@nestjs/testing';");
  arr = arr.concat(
    serviceDetails[file].imports.filter((iter) => {
      return iter.indexOf('Dto') === -1;
    }),
  );

  // if (Object.keys(serviceDetails[file]['exceptions_imports']).length > 0){
  //   arr.push(
  //     `import { ${ Object.keys(serviceDetails[file]['exceptions_imports']).join(", ") } } from '@nestjs/common';`,
  //   );
  // }

  if (serviceDetails[file]['import_jwt'] === 1) {
    arr.push(`import { JwtService } from '@nestjs/jwt';`);
  }
  if (serviceDetails[file]['import_http'] === 1) {
    arr.push(`import { HttpModule } from '@nestjs/common';`);
  }
  let shared_mocks_path = `../${MOCKS_DIR.replace(/^\.\//, '')}/responses.mock`;
  let utils_path = 'shared/utils';

  let haveMocks = (fs.existsSync('./src/' + shared_mocks_path + '.ts'));
  let haveUtils = (fs.existsSync('./src/' + utils_path + '.ts'));

  folderName
    .replace('src/', '')
    .split('/')
    .forEach(() => {
      shared_mocks_path = '../' + shared_mocks_path;
      utils_path = '../' + utils_path;
    });

  if (haveUtils) {
    arr.push(`import { deepClone } from '${utils_path}';`);
  }

  arr.push('');

  if (haveMocks) {
    arr.push(`import * as ${mock_response_name} from '${shared_mocks_path}';`);
  }

  // not found exception
  // if (serviceDetails[file].not_exist_exception && Object.keys(serviceDetails[file].not_exist_exception).length > 0) {
  //   arr.push(`import { NotFoundException } from '@nestjs/common';`);
  // }

  // console.log(serviceDetails[file].imports_mapping);
  // console.log(dependenciesDetails);

  const mocks = {};

  if (serviceDetails[file]['import_jwt'] === 1) {
    mocks['jwt.service'] = {
      name: 'mockJwtService',
      content: `export const mockJwtService = () => ({
${tab}sign: jest.fn(),
});`,
    };
  }

  if (serviceDetails[file]['import_http'] === 1) {
    mocks['http.service'] = {
      name: 'mockHTTPService',
      content: `export const mockHTTPService = () => ({
${tab}get: jest.fn(),
});`,
    };
  }

  Object.keys(serviceDetails[file].imports_mapping).forEach((name) => {
    if (name.indexOf('Dto') !== -1) {
      return;
    }
    const file_name = serviceDetails[file].imports_mapping[name].replace(
      '.ts',
      '',
    );

    const mock_file_name = file_name.split('/').pop() + '.mock';

    if (dependenciesDetails[file_name]) {
      mocks[mock_file_name] = {
        name: `mock${name}`,
        content: `export const mock${name} = () => ({`,
      };

      // console.log(file_name, dependenciesDetails[file_name].functions);

      dependenciesDetails[file_name].functions.forEach((iter) => {
        mocks[mock_file_name].content += '\n' + `${tab}${iter}: jest.fn(),`;
      });

      // add repository functions
      if (file_name.indexOf('repository') !== -1) {
        mocks[mock_file_name].content += '\n' + `${tab}delete: jest.fn(),`;
        mocks[mock_file_name].content += '\n' + `${tab}findOne: jest.fn(),`;
      }

      mocks[mock_file_name].content += '\n' + `});`;
    }
  });
  if (Object.keys(mocks).length > 0) {
    Object.keys(mocks).forEach((mock_file_name) => {
      const name = mocks[mock_file_name].name;
      const mock_content = mocks[mock_file_name].content;

      // add mock import
      let mock_path = `../${MOCKS_DIR.replace(/^\.\//, '')}/${mock_file_name}`;
      folderName
        .replace('src/', '')
        .split('/')
        .forEach(() => {
          mock_path = '../' + mock_path;
        });
      arr.push(`import { ${name} } from '${mock_path}';`);

      // console.log(`${MOCKS_DIR}/${mock_file_name}.ts`);
      // console.log(mock_content);

      // create mock file
      fs.writeFileSync(`${MOCKS_DIR}/${mock_file_name}.ts`, mock_content);

    });
    // console.log(mocks);
    arr.push('');
  }

  arr.push(`describe('${serviceDetails[file].class}', () => {`);

  // variables & beforeEach
  arr.push(`${tab}let service;`);
  const providers = [];
  const providers2 = [];
  serviceDetails[file].dependencies.forEach((dep) => {
    const varName = dep.name;
    providers.push(`{ provide: ${dep.type}, useFactory: mock${dep.type} },`);
    providers2.push(`${varName} = module.get<${dep.type}>(${dep.type});`);
    arr.push(`${tab}let ${varName};`);
  });

  // beforeEach
  arr.push(`
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${serviceDetails[file].class},
        ${providers.join('\n        ')}
      ],
    }).compile();

    service = module.get<${serviceDetails[file].class}>(${
    serviceDetails[file].class
  });

    // mocks
    ${providers2.join('\n    ')}
  });`);

  // -------------------------------------
  // should be defined tests suite
  // -------------------------------------
  arr.push(`
${tab}describe('Should be Defined', () => {`);
  arr.push(`${tab}${tab}it('service should be defined', () => {
      expect(service).toBeDefined();
    });`);
  serviceDetails[file].dependencies.forEach((dep) => {
    const varName = dep.name;
    arr.push(`
    it('${varName} should be defined', () => {
      expect(${varName}).toBeDefined();
    });`);
  });
  arr.push(`  });\n`);

  // -------------------------------------
  // service functions tests suites
  // -------------------------------------
  serviceDetails[file].functions.forEach((functionName) => {
    arr.push(`${tab}describe('${functionName}', () => {`);

    arr.push(`${tab}${tab}it('should be defined', () => {
${tab}${tab}${tab}expect(service.${functionName}).toBeDefined();
${tab}${tab}});`);

    arr.push('');
    arr.push(`${tab}${tab}it('should be a function', () => {
${tab}${tab}${tab}expect(typeof(service.${functionName})).toEqual('function');
${tab}${tab}});`);

    arr.push('');

    // -------------------------------------------------------------------------------
    // inner function calls
    // -------------------------------------------------------------------------------
    const have_inner_calls = Object.keys(
      serviceDetails[file].function_calls[functionName],
    ).filter((iter) => {
      return iter.indexOf('mockService') === -1;
    }).length;

    if (have_inner_calls) {
      const temp = [];
      const temp2 = [];
      let mocked = {};
      arr.push(`${tab}${tab}it('inner function calls', async () => {`);

      Object.keys(serviceDetails[file].function_calls[functionName]).forEach(
        (iter) => {
          if (iter.indexOf('mockService') === -1) {
            mocked[
              `${tab}${tab}${tab}${iter}.mockResolvedValue(${getMockResolvedValueByFunc(
                iter,
              )});`
              ] = 1;
          }

          if (iter.indexOf('mockService') !== -1) {
            mocked = addMockServiceMocks(mocked, serviceDetails, file, iter);
          }

          if (iter.indexOf('mockService') === -1) {
            const numOfTimes =
              serviceDetails[file].function_calls[functionName][iter];
            temp.push(
              `${tab}${tab}${tab}expect(${iter}).not.toHaveBeenCalled();`,
            );
            // temp2.push(`${tab}${tab}${tab}expect(${iter}).toHaveBeenCalledTimes(${numOfTimes});`); // sometimes there are IFs and then expected is 3 but actual is 2 for example
            temp2.push(`${tab}${tab}${tab}expect(${iter}).toHaveBeenCalled();`);
          }
        },
      );

      arr = arr.concat(Object.keys(mocked).sort());

      let params = getParams(serviceDetails, file, functionName);

      let params_string = JSON.stringify(params);
      params_string = params_string.substring(1, params_string.length - 1);

      // console.log(functionName, JSON.stringify(params).red);
      // >> console.log(`\n${tab}${tab}${tab}const result = await service.${functionName}(${params_string});`.red);
      // console.log(JSON.stringify(serviceDetails[file].function_parameters).red);

      arr = arr.concat(temp);
      arr.push(
        `\n${tab}${tab}${tab}const result = await service.${functionName}(${params_string});`,
      );

      arr = arr.concat(temp2);
      arr.push(`${tab}${tab}});`);
      arr.push('');
    }

    // -------------------------------------------------------------------------------
    // matches expected results
    // -------------------------------------------------------------------------------
    if (have_inner_calls && (serviceDetails[file]['return_await'][functionName])){
      let mocked = {};
      arr.push(`${tab}${tab}it('matches expected result', async () => {`);

      Object.keys(serviceDetails[file].function_calls[functionName]).forEach(
        (iter) => {
          if (iter.indexOf('mockService') === -1) {
            mocked[
              `${tab}${tab}${tab}${iter}.mockResolvedValue(${getMockResolvedValueByFunc(
                iter,
              )});`
              ] = 1;
          }
          if (iter.indexOf('mockService') !== -1) {
            mocked = addMockServiceMocks(mocked, serviceDetails, file, iter);
          }
        },
      );

      arr = arr.concat(Object.keys(mocked).sort());
      let params = getParams(serviceDetails, file, functionName);
      let params_string = JSON.stringify(params);
      params_string = params_string.substring(1, params_string.length - 1);
      arr.push(
        `\n${tab}${tab}${tab}const result = await service.${functionName}(${params_string});`,
      );

      if (serviceDetails[file]['return_await'][functionName]){
        let iter = serviceDetails[file]['return_await'][functionName];
        if (iter.indexOf('.') === -1){ iter = `mockService.${iter}`; }

        // console.log(`expect result to be same as ${iter}`.red);

        arr.push(
          `\n${tab}${tab}${tab}expect(result).toEqual(${getMockResolvedValueByFunc(
            iter,
            serviceDetails[file].class,
          )});`);
      }

      arr.push(`${tab}${tab}});`);
      arr.push('');
    }

    // -------------------------------------------------------------------------------
    // throws when there are missing required parameters
    // -------------------------------------------------------------------------------

    const required = getRequiredParams(
      serviceDetails,
      file,
      functionName,
    ).filter((iter) => {
      return typeof iter === 'object' && Object.keys(iter).length > 0;
    });

    if (required.length > 0) {
      arr.push(
        `${tab}${tab}describe('Throws on missing required parameters', () => {`,
      );

      required.forEach((iter) => {
        // on upsert only name is required.
        if (functionName.indexOf('upsert') !== -1) {
          if (iter.hasOwnProperty('name')) {
            iter = {
              name: iter.name,
            };
          }
        }

        Object.keys(iter).forEach((param) => {
          // delete required param
          let params = deepClone(getParams(serviceDetails, file, functionName));
          params.forEach((a) => {
            if (typeof a === 'object' && a.hasOwnProperty(param)) {
              delete a[param];
            }
          });

          const mocked = getMockResolved(serviceDetails, file, functionName);
          arr.push(`${tab}${tab}${tab}it('${param} is missing', async () => {`);
          arr = arr.concat(
            Object.keys(mocked)
              .map((iter) => tab + iter)
              .sort(),
          );

          let params_string = JSON.stringify(params);
          params_string = params_string.substring(1, params_string.length - 1);

          arr.push(`
        let res;
        let error;
        try {
          res = await service.${functionName}(${params_string});
        } catch (e) {
          error = e?.response?.message;
        }

        await expect(error).toMatch('${param} : missing');
        await expect(res).toBeUndefined();`);

          // arr.push(`\n${tab}${tab}${tab}${tab}const res = await service.${functionName}(${params_string});`)
          // arr.push(`\n${tab}${tab}${tab}${tab}expect(res).rejects.toThrow();`);

          arr.push(`${tab}${tab}${tab}});`);
        });
      });

      arr.push(`${tab}${tab}});`);
    }

    // -------------------------------------------------------------------------------
    // throws NotFoundException if not exist
    // -------------------------------------------------------------------------------
    if (serviceDetails[file].function_calls[functionName] &&
      serviceDetails[file].not_exist_exception[functionName])
    {
      let mocked = {};
      arr.push(`${tab}${tab}it('throw NotFoundException if not exist', async () => {`);

      Object.keys(serviceDetails[file].function_calls[functionName]).forEach(
        (iter) => {
          if (iter.indexOf('mockService') === -1) {

            let mockVal = getMockResolvedValueByFunc(iter);

            if (iter === serviceDetails[file].not_exist_exception[functionName]) {
              mockVal = 'null';
            }
            if (iter.endsWith('delete')) {
              mockVal = '{ affected: 0 }';
            }

            mocked[
              `${tab}${tab}${tab}${iter}.mockResolvedValue(${mockVal});`
              ] = 1;
          }
          if (iter.indexOf('mockService') !== -1 && iter.indexOf('Repository') === -1) {
            const temp = addMockServiceMocks(deepClone(mocked), serviceDetails, file, iter);
            Object.keys(temp).filter((iter) => { return iter.indexOf('Repository') === -1 }).forEach((key) => {

              if (key.indexOf('delete.mockResolvedValue(') !== -1){
                  key =
                    key.split('delete.mockResolvedValue(')[0] +
                    'delete.mockResolvedValue({ affected: 0 });';
              }

              conf['not_exist_mock_null'].forEach((keyword) => {
                if (key.indexOf(keyword) !== -1) {
                  key = key.split('(')[0] + '(null);';
                }
              });
              mocked[key] = 1;
            });
          }
        },
      );

      if (Object.keys(mocked).length === 1){
        let key = Object.keys(mocked)[0];
        let mockData = 'null';
        if (key.indexOf('delete') !== -1) { mockData = '{ affected: 0 }'; }
        key = key.split('(')[0] + '(' + mockData + ');';
        mocked = {};
        mocked[key] = 1;
      }

      arr = arr.concat(Object.keys(mocked).sort());
      let params = getParams(serviceDetails, file, functionName);
      let params_string = JSON.stringify(params);
      params_string = params_string.substring(1, params_string.length - 1);
      // arr.push(`\t\t  expect(service.${functionName}(${params_string})).rejects.toThrow(NotFoundException);`);

      arr.push(`
        let res;
        let error;
        let status;
        try {
          res = await service.${functionName}(${params_string});
        } catch (e) {
          error = e?.response?.error;
          status = e?.status;
        }

        await expect(error).toEqual('Not Found');
        await expect(status).toEqual(404);
        await expect(res).toBeUndefined();`);

      arr.push(`${tab}${tab}});`);
      arr.push('');
    }

    // -------------------------------------------------------------------------------
    // throws BadRequest on invalid parameters - will be tested on the E2E
    // -------------------------------------------------------------------------------
    // if (serviceDetails[file].function_calls[functionName])
    //   // && serviceDetails[file].not_exist_exception[functionName])
    // {
    //   arr.push('');
    //   let mocked = {};
    //   arr.push(`${tab}${tab}it('throw BadRequest on invalid parameters', async () => {`);
    //
    //   Object.keys(serviceDetails[file].function_calls[functionName]).forEach(
    //     (iter) => {
    //       if (iter.indexOf('mockService') === -1) {
    //
    //         let mockVal = getMockResolvedValueByFunc(iter);
    //
    //         if (iter === serviceDetails[file].not_exist_exception[functionName]) {
    //           mockVal = 'null';
    //         }
    //         if (iter.endsWith('delete')) {
    //           mockVal = '{ affected: 0 }';
    //         }
    //
    //         mocked[
    //           `${tab}${tab}${tab}${iter}.mockResolvedValue(${mockVal});`
    //           ] = 1;
    //       }
    //       if (iter.indexOf('mockService') !== -1 && iter.indexOf('Repository') === -1) {
    //         const temp = addMockServiceMocks(deepClone(mocked), serviceDetails, file, iter);
    //         Object.keys(temp).filter((iter) => { return iter.indexOf('Repository') === -1 }).forEach((key) => {
    //
    //           if (key.indexOf('delete.mockResolvedValue(') !== -1){
    //             key = key.split('delete.mockResolvedValue(')[0] + 'delete.mockResolvedValue({ affected: 0 });';
    //           }
    //
    //           if (key.indexOf('getPlayer') !== -1 || key.indexOf('getTeam') !== -1){
    //             key = key.split('(')[0] + '(null);'
    //           }
    //
    //           mocked[key] = 1;
    //         });
    //       }
    //     },
    //   );
    //
    //   if (Object.keys(mocked).length === 1){
    //     let key = Object.keys(mocked)[0];
    //     let mockData = 'null';
    //     if (key.indexOf('delete') !== -1) { mockData = '{ affected: 0 }'; }
    //     key = key.split('(')[0] + '(' + mockData + ');';
    //     mocked = {};
    //     mocked[key] = 1;
    //   }
    //
    //   arr = arr.concat(Object.keys(mocked).sort());
    //   let params = getWrongParams(serviceDetails, file, functionName);
    //   let params_string = JSON.stringify(params);
    //   params_string = params_string.substring(1, params_string.length - 1);
    //
    //   // console.log(`expect result to throw NotFoundException`.red);
    //
    //   arr.push(`
    //     let res;
    //     let error;
    //     let status;
    //     try {
    //       res = await service.${functionName}(${params_string});
    //     } catch (e) {
    //       error = e?.response?.error;
    //       status = e?.status;
    //     }
    //
    //     await expect(error).toEqual('Internal');
    //     await expect(status).toEqual(500);
    //     await expect(res).toBeUndefined();`);
    //
    //   arr.push(`${tab}${tab}});`);
    //   arr.push('');
    // }

    // -------------------------------------------------------------------------------

    arr.push(`  });\n`);
  });

  arr.push(`});`);
  // >> console.log(arr.join('\n'));

  const content = arr.join('\n');
  fs.writeFileSync(testing_file_path, content);
  console.info(`\nTesting File Created! at ${testing_file_path}\n`.green);
}

function getMockResolved(serviceDetails, file, functionName) {
  let mocked = {};
  Object.keys(serviceDetails[file].function_calls[functionName]).forEach(
    (iter) => {
      if (iter.indexOf('mockService') === -1) {
        mocked[
          `${tab}${tab}${tab}${iter}.mockResolvedValue(${getMockResolvedValueByFunc(
            iter,
          )});`
          ] = 1;
      }

      if (iter.indexOf('mockService') !== -1) {
        mocked = addMockServiceMocks(mocked, serviceDetails, file, iter);
      }
    },
  );

  return mocked;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getParams(serviceDetails, file, functionName, dtoExample = "extended") {
  let params = [];

  // console.log("DTOs:", Object.keys(DTOs));

  serviceDetails[file].function_parameters[functionName].forEach((param) => {
    // console.log(param.type, param.dto_file, Object.keys(DTOs).join(",").red);

    const result = param.dto_file
      ? Object.keys(DTOs).filter((iter) => iter.indexOf(param.dto_file) !== -1)
      : undefined;

    if (result && result.length > 0) {
      // console.log(param.dto_file, result);
      params.push(DTOs[result[0]].examples[dtoExample]);
    } else if (param.name === 'start' && param.type === 'number') {
      params.push(1);
    } else {
      params.push(generateExample(param.type, param.name));
    }
  });
  params = params.map((iter) => {
    if (
      typeof iter === 'string' &&
      iter.indexOf('[') === -1 &&
      iter.indexOf('{') !== -1
    ) {
      iter = `"${iter}"`;
    }
    return iter;
  });

  // custom
  if (
    functionName === 'listRecords' &&
    file === 'three-points-contest.service'
  ) {
    params[0]['winner_name'] = 'some string';
  }

  return params;
}

function getRequiredParams(serviceDetails, file, functionName) {
  let params = [];
  serviceDetails[file].function_parameters[functionName].forEach((param) => {
    const result = param.dto_file
      ? Object.keys(DTOs).filter((iter) => iter.indexOf(param.dto_file) !== -1)
      : undefined;

    if (result && result.length > 0) {
      // console.log(param.dto_file, result);
      params.push(DTOs[result[0]].examples.basic);
    }

    // console.log(param.type, Object.keys(DTOs).join(",").red);
    // if (DTOs[param.type]){
    //   params.push(DTOs[param.type].examples.basic);
    // }
  });
  return params;
}

function addMockServiceMocks(mocked, serviceDetails, file, iter) {
  Object.keys(
    serviceDetails[file].function_calls[iter.replace('mockService.', '')],
  ).forEach((iter2) => {
    if (iter2.indexOf('mockService') === -1)
      mocked[
        `${tab}${tab}${tab}${iter2}.mockResolvedValue(${getMockResolvedValueByFunc(
          iter2,
        )});`
        ] = 1;
    else mocked = addMockServiceMocks(mocked, serviceDetails, file, iter2);
  });
  return mocked;
}

function buildRouteDetails(folderName) {
  let isOk = 1;
  let isFound = 0;
  try {
    const files = fs.readdirSync(folderName);

    files.forEach((file) => {
      if (file.indexOf('service.ts') !== -1) {
        isFound = 1;
        console.log(`......... reading ${file}`);
        readFile(file, folderName, serviceDetails);
      }
      // console.log('no: ' + file);
    });
  } catch (error) {
    isOk = 0;

    // console.log(JSON.stringify(error));
    if (error['errno'] == '-4058') {
      error = `no such file or directory ${error['path']}`;
    }
    console.error(`Error: ${error}`.red);
  }

  if (isOk && isFound === 0) {
    console.error(`Error: No files to test in this path ('${folderName}')`.red);
    isOk = 0;
  }

  return isOk;
}

function readFile(file, folderName, hash) {
  let path = `./${file}`;
  if (file.indexOf(folderName) === -1){
    path = `${folderName}/${file}`;
  }
  const content = fs.readFileSync(`${path}`, 'utf8');
  const lines = content.split('\n');

  let name = file.replace('.ts', '');

  hash[name] = hash[name] || {};
  hash[name]['folderName'] = folderName;
  hash[name]['dependencies'] = hash[name]['dependencies'] || [];
  hash[name]['function_calls'] = hash[name]['function_calls'] || {};
  hash[name]['function_parameters'] = hash[name]['function_parameters'] || {};
  hash[name]['functions'] = hash[name]['functions'] || [];
  hash[name]['imports'] = hash[name]['imports'] || [];
  hash[name]['imports_mapping'] = hash[name]['imports_mapping'] || {};
  hash[name]['import_jwt'] = 0;
  hash[name]['import_http'] = 0;
  hash[name]['return_await'] = hash[name]['return_await'] || {};
  hash[name]['not_exist_exception'] = hash[name]['not_exist_exception'] || {};
  hash[name]['exceptions_imports'] = hash[name]['exceptions_imports'] || {};

  let last_function_call;

  let constructorFlag = 0;
  let funcName;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // current class name
    if (line.indexOf('export class ') !== -1 && !hash[name]['class']) {
      const currClass = line
        .replace('export class ', '')
        .replace('{', '')
        .trim();
      hash[name]['class'] = currClass;
      hash[name]['imports'].push(`import { ${currClass} } from './${name}';`);
    }

    // build dependencies based on constructor
    if (line.indexOf('constructor') !== -1) constructorFlag = 1;
    if (constructorFlag) {
      if (line.indexOf('}') !== -1) constructorFlag = 0;
      if (line.indexOf('private') !== -1 || line.indexOf('public') !== -1) {
        line = line
          .replace('private ', '')
          .replace('public ', '')
          .replace('readonly ', '')
          .replace('constructor(', '')
          .replace('{}')
          .replace(',', '')
          .replace('\r', '')
          .trim();
        const dep_parts = line.split(':').map((iter) => {
          return iter.trim();
        });
        // console.log(dep_parts);
        let dep = {};
        dep['name'] = dep_parts[0];
        dep['type'] = dep_parts[1];
        hash[name]['dependencies'].push(dep);
      }
    } else {
      // build imports
      if (line.trim().indexOf('import') === 0) {
        if (line.indexOf('@nestjs/jwt') !== -1) {
          hash[name]['import_jwt'] = 1;
        }
        if (line.indexOf('HttpService') !== -1) {
          hash[name]['import_http'] = 1;
        }
        if (
          line.indexOf('.service') !== -1 ||
          line.indexOf('.repository') !== -1 ||
          line.indexOf('/dto/') !== -1
        ) {
          line = replaceAliases(line);
          hash[name]['imports'].push(line);

          const parts = line.split(' from ');
          parts[0] = parts[0].replace('import {', '').replace('}', '').trim();
          parts[1] = parts[1]
            .replace(/'/gi, '')
            .replace(/"/gi, '')
            .replace(';', '')
            .trim();

          hash[name]['imports_mapping'][parts[0]] = parts[1] + '.ts';
        }
      }

      // build functions, function calls
      if (line.indexOf('async') !== -1 && line.indexOf('forEach') === -1 && !(line.trim().startsWith("//"))) {
        funcName = line.trim().replace('async', '').split('(')[0].trim().split('=')[0].trim();
        funcName = funcName.replace('private','').replace('public','').trim();
        hash[name]['functions'].push(funcName);
        hash[name]['function_calls'][funcName] = hash[name]['function_calls'][funcName] || {};

        // hash[name]['return_await'][funcName] = hash[name]['return_await'][funcName] || {};

        // parameters
        while (line.indexOf(')') === -1) {
          i++;
          line += ' ' + lines[i];
        }
        const parts = line.split('(')[1].split(')')[0].split(',');
        hash[name]['function_parameters'][funcName] =
          hash[name]['function_parameters'][funcName] || [];

        parts.forEach((param_str) => {
          if (param_str.trim() !== '') {
            const parts2 = param_str.split(':');
            if (parts2.length === 1) {
              parts2.push('string');
            } // if type not mentioned
            if (parts2.length > 0) {
              const paramName = parts2[0].trim();
              const paramType = parts2[1].trim();

              let dto_file = hash[name]['imports_mapping'][paramType.replace('[]', '')];

              if (dto_file)
                dto_file = dto_file
                  .replace(/\.\.\//gi, '/')
                  .replace(/\.\//gi, '/')
                  .replace(/\/\//gi, '/');
              if (dto_file && dto_file.indexOf('/dto') !== -1)

                if (dto_file.indexOf(folderName) === -1) {
                  dto_file = (folderName + dto_file).replace(/\/\//gi, '/');
                }

              hash[name]['function_parameters'][funcName].push({
                name: paramName,
                type: paramType,
                dto_file: dto_file,
              });
            }
          }
        });
      } else {
        if (
          line.replace('this.logger').indexOf(`this.`) !== -1 &&
          !line.trim().startsWith('//')
        ) {
          if (!funcName) {
            console.log(i, line.red);
          }

          let func = line.split('this.')[1].split('(')[0].replace('this.', ''); // depname
          if (func.indexOf('.') === -1) {
            func = 'mockService.' + func;
          }
          if (func.indexOf('.') !== -1) {
            hash[name]['function_calls'][funcName][func] =
              hash[name]['function_calls'][funcName][func] || 0;
            hash[name]['function_calls'][funcName][func]++;

            last_function_call = func;
          }
        }
      }

      if (line.trim().startsWith('return await this.')) {
        hash[name]['return_await'][funcName] = line.trim().replace('return await this.', '').split('(')[0];
      }
      if (line.indexOf('throw new NotFoundException') !== -1) {
        hash[name]['not_exist_exception'][funcName] = last_function_call;
        hash[name]['exceptions_imports']['NotFoundException'] = 1;
      }
    }
  }

  // read file debug
  // console.log(content);
  // console.info(serviceDetails);
  // console.log(JSON.stringify(hash,null," "));
}

function recursiveAsyncReadLine() {
  routeName = undefined;
  folderName = undefined;
  serviceDetails = {};
  dependenciesDetails = {};

  rl.question(
    `[write ${stop_keywords.join(
      ' / ',
    )} to exit]\nWhat is the name of the route ? `,
    async function (name) {
      if (stop_keywords.indexOf(name.toLowerCase()) !== -1) rl.close();

      name = name.trim();
      name = name.replace(/\s\s+/g, ' ');
      name = name.replace(/\s/g, '-');
      routeName = name.toLowerCase();
      folderName = 'src/' + routeName;

      // rl.question("Where do you live ? ", function(country) {
      console.log(`Folder Name: ${name}`);

      if (routeName === '' || folderName === '') {
        console.log('Error! please provide route name!'.red);
        recursiveAsyncReadLine();
        return false;
      }

      if (name === 'all') {
        const folders = walkDirectory('src').filter((iter) => {
          return (
            !iter.endsWith('/dto') &&
            !iter.endsWith('/pipes') &&
            !iter.endsWith('/api')
          );
        });

        // console.log(folders);
        // return;

        for (let i = 0; i < folders.length; i++) {
          routeName = folders[i].split('/').pop();
          folderName = folders[i];
          serviceDetails = {};
          dependenciesDetails = {};

          await main();
        }

        rl.close();
      } else {
        main();

        // run again
        recursiveAsyncReadLine();
      }
    },
  );
}

function readDTOFile(file) {
  const content = fs.readFileSync(`${file}`, 'utf8');
  const lines = content.split('\n');

  const hash = {
    required_fields: [],
    optional_fields: [],
    imports: [],
    imports_mapping: {},
    examples: {},
  };

  let isRequired = 1;

  lines.forEach((line) => {
    // current class name
    if (line.indexOf('export class ') !== -1 && !hash['class']) {
      const currClass = line
        .replace('export class ', '')
        .replace('{', '')
        .trim();
      hash['class'] = currClass;
      hash['file'] = file;
    } else if (line.indexOf('import') !== -1 && line.indexOf('enum') !== -1) {
      line = replaceAliases(line);
      hash['imports'].push(line);

      const parts = line.split(' from ');
      parts[0] = parts[0].replace('import {', '').replace('}', '').trim();
      parts[1] = parts[1]
        .replace(/'/gi, '')
        .replace(/"/gi, '')
        .replace(';', '')
        .trim();

      hash['imports_mapping'][parts[0]] = parts[1] + '.ts';
    } else if (line.indexOf('@IsOptional') !== -1) {
      isRequired = 0;
    } else if (line.indexOf(':') !== -1 && line.trim().endsWith(';')) {
      const parts = line.split(':');
      let name = parts[0].trim();
      if (name.endsWith("?")) {
        name = name.substring(0,name.length-1);
        isRequired = 0;
      }
      const type = parts[1]
        .replace(';', '')
        .trim()
        .replace(/'/gi, '')
        .replace(/"/gi, '');

      const key = isRequired ? 'required_fields' : 'optional_fields';
      hash[key].push({
        name,
        type,
      });
      DTOFieldTypes[type] = DTOFieldTypes[type] || 0;
      DTOFieldTypes[type]++;
    }
  });

  // build basic example of this DTO.
  const basicExample = {};
  hash['required_fields'].forEach((field) => {
    basicExample[field.name] = generateExample(field.type, field.name);
  });
  hash['examples']['basic'] = basicExample;

  // extended example
  const extended_example = {};
  hash['required_fields'].concat(hash['optional_fields']).forEach((field) => {
    extended_example[field.name] = generateExample(field.type, field.name);
  });
  hash['examples']['extended'] = extended_example;

  // build wrong example of this DTO.
  const wrongExample = {};
  hash['required_fields'].concat(hash['optional_fields']).forEach((field) => {
    wrongExample[field.name] = generateWrongExample(field.type);
  });
  hash['examples']['wrong'] = wrongExample;

  return hash;
}

function readDTOs() {
  const files = walk('src').filter((iter) => iter.indexOf('-dto.ts') !== -1 || iter.indexOf('Dto.ts') !== -1);

  files.forEach((file) => {
    const hash = readDTOFile(file);
    if (hash['file']) {
      let dto_name = hash['file'];
      // delete hash['class'];
      DTOs[dto_name] = hash;
    }
  });

  // console.log(JSON.stringify(DTOs,null," "));
  // console.log(JSON.stringify(DTOFieldTypes,null," "));
}

function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}

function walkDirectory(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Is a file */
      results.push(file);

      results = results.concat(walkDirectory(file));
    }
  });
  return results;
}

rl.on('close', async function () {
  process.exit(0);
});

// --- custom ----------------------------------------------
function generateExample(fieldType, fieldName) {

  const examples = conf.examples;
  let example = examples[fieldType];

  // custom conditions
  if (fieldType === 'string' && fieldName !== 'winner') {
    example = fieldName;
  }

  if (example == undefined) {
    if (!exampleErrors[fieldType]) {
      console.error(`No examples for type ${fieldType}`.red);
      exampleErrors[fieldType] = 1;
    }
  }

  return example;
}

function generateWrongExample(fieldType) {
  if (fieldType === 'string') return true;
  else return `not a ${fieldType}`;
}

function getMockResolvedValueByFunc(funcName, className) {

  let mockResponse = conf.mocks[funcName];
  if (
    mockResponse == undefined &&
    conf.mocks['byClass'] &&
    conf.mocks['byClass'][className] &&
    conf.mocks['byClass'][className][funcName]
  ) {
    mockResponse = conf.mocks['byClass'][className][funcName];
  }

  if (mockResponse == undefined) {
    return '[{}]';
  }

  mockResponse = mockResponse.replace(
    '${mock_response_name}',
    mock_response_name,
  );
  if (mockResponse.startsWith('[')) {
    mockResponse = `deepClone(${mockResponse})`;
  }

  return mockResponse;
}

// function getWrongParams(serviceDetails, file, functionName) {
//   let params = [];
//
//   serviceDetails[file].function_parameters[functionName].forEach((param) => {
//     // console.log(param.type, param.dto_file, Object.keys(DTOs).join(",").red);
//
//     const result = param.dto_file
//       ? Object.keys(DTOs).filter((iter) => iter.indexOf(param.dto_file) !== -1)
//       : undefined;
//
//     if (result && result.length > 0) {
//       // console.log(param.dto_file, result);
//       params.push(DTOs[result[0]].examples.wrong);
//     } else if (param.name === 'start' && param.type === 'number') {
//       params.push(1);
//     } else {
//       params.push(generateWrongExample(param.type));
//     }
//   });
//   params = params.map((iter) => {
//     if (
//       typeof iter === 'string' &&
//       iter.indexOf('[') === -1 &&
//       iter.indexOf('{') !== -1
//     ) {
//       iter = `"${iter}"`;
//     }
//     return iter;
//   });
//
//   // custom
//   if (
//     functionName === 'listRecords' &&
//     file === 'three-points-contest.service'
//   ) {
//     params[0]['winner_name'] = 'some string';
//   }
//
//   return params;
// }
