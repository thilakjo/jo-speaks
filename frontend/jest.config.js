module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$                   ": "identity-obj-proxy", // Mock CSS imports
    "^@/(.*)$                  ": "<rootDir>/src/$1", // If you use path aliases like @/components
  },
  transform: {
    "^.+\\.tsx?$                  ": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  // Indicates whether each individual test should be reported during the run.
  verbose: true,
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // A list of paths to modules that run some code to configure or set up the testing framework before each test file in the suite is executed
  // setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'], // if you have a setupTests.ts file
};
