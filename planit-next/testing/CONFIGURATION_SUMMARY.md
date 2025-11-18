# Testing Configuration Summary

## Installed Packages

### Core Testing
- `jest` - JavaScript testing framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction testing
- `jest-environment-jsdom` - Browser-like testing environment
- `@types/jest` - TypeScript types for Jest
- `ts-node` - TypeScript execution

### Mutation Testing
- `@stryker-mutator/core` - Mutation testing framework
- `@stryker-mutator/typescript-checker` - TypeScript integration
- `@stryker-mutator/jest-runner` - Jest integration for Stryker

## Configuration Files

### 1. jest.config.js
```javascript
- Test environment: jsdom (browser simulation)
- Module mapping: @/ -> src/
- Coverage directory: testing/mutation/coverage
- Test pattern: testing/**/*.test.{js,jsx,ts,tsx}
- Coverage threshold: 70% (branches, functions, lines, statements)
```

### 2. jest.setup.js
```javascript
- Imports @testing-library/jest-dom matchers
- Mocks environment variables for testing
```

### 3. stryker.conf.json
```javascript
- Test runner: Jest
- Files to mutate: src/**/*.ts(x), lib/**/*.ts
- Excluded: tests, type definitions, CSS
- Output: testing/mutation/reports/
- Thresholds: High=80%, Low=60%, Break=50%
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:clear-cache` | Clear Jest cache |
| `npm run test:mutation` | Run mutation testing |
| `npm run test:mutation:watch` | Run mutation testing in watch mode |
| `npm run test:all` | Run coverage + mutation tests |

## Directory Structure

```
planit-next/
├── testing/
│   ├── mutation/
│   │   ├── reports/         # Generated mutation reports
│   │   ├── coverage/        # Generated coverage reports
│   │   └── stryker-tmp/     # Temporary mutation files
│   ├── unit/                # Unit test files
│   ├── integration/         # Integration test files
│   ├── README.md
│   └── MUTATION_TESTING_GUIDE.md
├── jest.config.js
├── jest.setup.js
└── stryker.conf.json
```

## What Gets Tested

### Included in Mutation Testing:
- All TypeScript files in `src/**/*.ts`
- All TypeScript React files in `src/**/*.tsx`
- All TypeScript files in `lib/**/*.ts`

### Excluded from Mutation Testing:
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definition files (`src/types/**`)
- CSS files (`src/app/globals.css`)
- Configuration files
- Node modules

## Quality Thresholds

### Code Coverage (Jest):
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Mutation Score (Stryker):
- **High:** 80% - Excellent
- **Low:** 60% - Acceptable
- **Break:** 50% - Fails build

## Reports Generated

1. **Coverage Report**
   - Location: `testing/mutation/coverage/`
   - Format: HTML, text, JSON
   - Shows: Line coverage, branch coverage, function coverage

2. **Mutation Report**
   - Location: `testing/mutation/reports/mutation-report.html`
   - Format: Interactive HTML
   - Shows: Killed/survived mutants, mutation score, code diff

## Test File Conventions

1. **Naming:** `*.test.ts` or `*.test.tsx`
2. **Location:** `testing/unit/` or `testing/integration/`
3. **Structure:** Describe blocks for organization
4. **Imports:** Use `@/` alias for src imports

## Environment Variables (Mocked in Tests)

- `MONGODB_URI` = 'mongodb://localhost:27017/test'
- `JWT_SECRET` = 'test-secret'
- `NEXTAUTH_URL` = 'http://localhost:3000'

## Next Steps

1. Write tests for existing components and utilities
2. Run `npm test` to verify setup
3. Run `npm run test:mutation` for mutation analysis
4. Review reports and improve test coverage
5. Integrate into CI/CD pipeline

## Example Test Files Created

- `testing/unit/auth-utils.test.ts` - Tests for authentication utilities
- `testing/unit/example.test.ts` - Example unit tests
- `testing/integration/example-integration.test.ts` - Example integration tests

These serve as templates for writing additional tests.
