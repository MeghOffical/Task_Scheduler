# Mutation Testing Setup - Quick Start Guide

## What is Mutation Testing?

Mutation testing is a technique to evaluate the quality of your test suite by introducing small changes (mutations) to your source code and checking if your tests catch these changes. A high mutation score indicates that your tests are effective at detecting bugs.

## Installation Complete ✓

The following packages have been installed:
- `@stryker-mutator/core` - Core mutation testing framework
- `@stryker-mutator/typescript-checker` - TypeScript support
- `@stryker-mutator/jest-runner` - Jest integration
- `jest` - Testing framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM elements
- `@testing-library/user-event` - User interaction simulation

## Directory Structure Created

```
planit-next/
├── testing/
│   ├── mutation/          # Mutation testing reports
│   ├── unit/              # Unit test files
│   │   ├── auth-utils.test.ts
│   │   └── example.test.ts
│   ├── integration/       # Integration test files
│   │   └── example-integration.test.ts
│   └── README.md
├── stryker.conf.json      # Mutation testing config
├── jest.config.js         # Jest configuration
└── jest.setup.js          # Jest setup file
```

## Running Tests

### 1. Run Unit Tests
```bash
npm test
```

### 2. Run Tests in Watch Mode
```bash
npm run test:watch
```

### 3. Generate Coverage Report
```bash
npm run test:coverage
```
Coverage report will be saved to `testing/mutation/coverage/`

### 4. Run Mutation Testing
```bash
npm run test:mutation
```
Mutation report will be generated at `testing/mutation/reports/mutation-report.html`

### 5. Run All Tests (Coverage + Mutation)
```bash
npm run test:all
```

### 6. Clear Jest Cache (if needed)
```bash
npm run test:clear-cache
```

## Understanding Mutation Testing Results

After running `npm run test:mutation`, you'll see output like:

```
Mutant killed: 45
Mutant survived: 5
Mutant timeout: 0
Mutant no coverage: 10
Mutation score: 75%
```

### Mutation Status Explained:

- **Killed**: ✓ Good! Your tests detected the mutation
- **Survived**: ✗ Bad! The mutation wasn't caught by tests
- **Timeout**: Test took too long (usually indicates infinite loop)
- **No Coverage**: No tests cover this code

### Thresholds:
- **High (80%+)**: Excellent test quality
- **Low (60-79%)**: Acceptable test quality  
- **Break (<50%)**: Build will fail - needs improvement

## Configuration Files

### stryker.conf.json
Configures which files to mutate and testing thresholds.

### jest.config.js
Configures Jest test runner and coverage collection.

### jest.setup.js
Sets up test environment and mocks.

## Writing Tests

### Example Unit Test Structure
```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test File Locations
- Place unit tests in `testing/unit/`
- Place integration tests in `testing/integration/`
- Name test files with `.test.ts` or `.test.tsx` extension

## Next Steps

1. **Write tests for your components and utilities**
   - Start with critical business logic
   - Test edge cases and error conditions

2. **Run tests regularly during development**
   ```bash
   npm run test:watch
   ```

3. **Check mutation score before commits**
   ```bash
   npm run test:mutation
   ```

4. **Review mutation reports**
   - Open `testing/mutation/reports/mutation-report.html`
   - Focus on survived mutants
   - Add tests to kill surviving mutants

## Common Issues & Solutions

### Issue: Tests not found
**Solution:** Ensure test files end with `.test.ts` or `.test.tsx`

### Issue: Module not found errors
**Solution:** Run `npm install` and check import paths

### Issue: Mutation testing takes too long
**Solution:** Use `jest.enableFindRelatedTests: true` in stryker.conf.json (already configured)

### Issue: Low mutation score
**Solution:** 
- Review survived mutants in HTML report
- Add tests for uncovered edge cases
- Focus on boundary conditions

## Tips for Better Tests

1. **Test behavior, not implementation**
2. **Write descriptive test names**
3. **Keep tests independent**
4. **Mock external dependencies**
5. **Test error conditions**
6. **Aim for 70%+ code coverage**
7. **Target 60%+ mutation score**

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [React Testing Library](https://testing-library.com/react)

## Support

For issues or questions about the testing setup, refer to:
- Project README
- `testing/README.md`
- Team documentation
