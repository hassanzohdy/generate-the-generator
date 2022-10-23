import fs from '@mongez/fs';
import { rootPath } from '@mongez/node';

// get the absolute path to the root of the project for the given path
const packageJsonPath = rootPath('package.json');

// get the json contents of the file in object format 
const packageJsonContent = fs.getJson(packageJsonPath);

console.log(packageJsonContent);
