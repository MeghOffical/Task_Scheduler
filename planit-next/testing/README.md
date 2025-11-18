# Testing Directory

This directory contains all testing-related files and configurations for the planit-next project.

## Directory Structure

```
testing/
├── mutation/          # Mutation testing reports and configurations
├── unit/             # Unit test files
├── integration/      # Integration test files
└── README.md         # This file
```

## Test Types

### 1. Unit Tests
Location: `testing/unit/`

Unit tests focus on testing individual components, functions, and modules in isolation.

**Run unit tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm run test:coverage
```

### 2. Integration Tests
Location: `testing/integration/`

Integration tests verify that different parts of the application work together correctly.

### 3. Mutation Tests
Location: `testing/mutation/`

Mutation testing evaluates the quality of your test suite by introducing small changes (mutations) to your code and checking if tests catch them.

**Run mutation tests:**
```bash
npm run test:mutation
```

**View mutation report:**
After running mutation tests, open `testing/mutation/reports/mutation-report.html` in your browser.

## Configuration Files

- **jest.config.js** - Jest configuration for unit and integration tests
- **jest.setup.js** - Jest setup file with global test configurations
- **stryker.conf.json** - Stryker mutation testing configuration

## Getting Started

### Running Tests

1. **Run all tests:**
   ```bash
   npm test
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Run mutation testing:**
   ```bash
   npm run test:mutation
   ```

4. **Generate coverage report:**
   ```bash
   npm run test:coverage
   ```

## Test Writing Guidelines

1. **File naming:** Test files should be named `*.test.ts` or `*.test.tsx`
2. **Location:** Place test files in the `testing/` directory organized by type
3. **Coverage:** Aim for at least 70% code coverage
4. **Mutation score:** Target at least 60% mutation score

## Mutation Testing Thresholds

- **High:** 80% - Excellent test quality
- **Low:** 60% - Acceptable test quality
- **Break:** 50% - Build will fail below this threshold

## Reports

All test reports are generated in the `testing/mutation/reports/` directory:
- `mutation-report.html` - Interactive HTML report
- `mutation-report.json` - JSON format for CI/CD integration

## Troubleshooting

If you encounter issues:

1. Ensure all dependencies are installed: `npm install`
2. Clear Jest cache: `npm run test:clear-cache`
3. Check that Node.js version is compatible (14+)
4. Verify that all configuration files are present

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Stryker Mutator](https://stryker-mutator.io/)
