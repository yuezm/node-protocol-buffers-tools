module.exports = {
  "testEnvironment": "node",
  "preset": "ts-jest",
  "moduleFileExtensions": [
    "js",
    "json",
    "ts"
  ],
  "rootDir": "lib",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage"
};
