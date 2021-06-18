const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  "testEnvironment": "node",
  "preset": "ts-jest",
  "moduleFileExtensions": [
    "js",
    "json",
    "ts"
  ],
  "rootDir": "packages",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  modulePathIgnorePatterns: [ "dist/" ],
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  // moduleNameMapper: {
  // }
};
