# live-data-sync

Persist and restore the application state. Designed for [web-redux](https://github.com/beenotung/web-redux)

[![npm Package Version](https://img.shields.io/npm/v/live-data-sync.svg?maxAge=3600)](https://www.npmjs.com/package/live-data-sync)

# Features
- Support nested array and object
- Only store incremental update (instead of full snapshot)
- Backed by sqlite in sync mode (which is faster than async mode)
- 100% test coverage
