# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.2.0-0](https://github.com/abhinaba-ghosh/axe-playwright/compare/v2.1.0...v2.2.0-0) (2025-08-25)


### Features

* added chnagelog ([2f20011](https://github.com/abhinaba-ghosh/axe-playwright/commit/2f2001164befa5bb708e694242e1b76212f211ce))


### Bug Fixes

* change reporter conditionals in `checkA11y()` to fix `skipFailure` options not working when reporter is 'junit' ([b4514d0](https://github.com/abhinaba-ghosh/axe-playwright/commit/b4514d043ed747ab7079241f3dbb3670e12ce2f0))

## [2.1.0] - 2024-08-25

### Features

* **reporter**: add junit xml reporter for test results
* **reporter**: add html reporter with custom output paths
* **reporter**: enhance terminal reporter v2 with colored output
* **core**: add support for multiple accessibility standards (WCAG21AA, WCAG22AA, etc.)
* **config**: add verbose mode configuration for all reporters

### Bug Fixes

* **core**: improve error handling and reporting
* **types**: enhance TypeScript interfaces and type definitions
* **utils**: fix various edge cases in violation processing

### Performance Improvements

* **core**: optimize axe injection and execution
* **reporter**: improve report generation performance

### Documentation

* **readme**: update examples and usage documentation
* **changelog**: add automated changelog generation