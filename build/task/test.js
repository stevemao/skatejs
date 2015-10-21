'use strict';

var assign = require('lodash/object/assign');
var buildTest = require('./build-test');
var commander = require('../lib/commander');
var Server = require('karma').Server;

var vitalBrowsers = ['Firefox', 'Chrome'];
function isVitalBrowser(name) {
  return new RegExp(vitalBrowsers.join('|')).test(name);
}
commander
  .option('-b, --browsers [Chrome,Firefox]', 'The browsers to run the tests in.')
  .option('-g, --grep [pattern]', 'The grep pattern matching the tests you want to run.')
  .option('-h, --host [localhost]', 'The host to listen on.')
  .option('-p, --port [9876]', 'The port to listen on.')
  .parse(process.argv);

module.exports = function (opts, done) {
  var args = [];
  opts = assign({
    browsers: vitalBrowsers.join(',')
  }, opts);

  if (opts.grep) {
    args.push('--grep');
    args.push(opts.grep);
  }

  var config = {
    autoWatch: opts.watch,
    browsers: opts.browsers.split(','),
    client: { args: args },
    frameworks: ['mocha', 'sinon-chai'],
    singleRun: !opts.watch,
    files: [
      '.tmp/unit.js'
    ]
  };

  if (opts.saucelabs) {
    var saucelabsLaunchers = require('../lib/saucelabs-launchers');
    config = assign(config, {
      sauceLabs: {
        testName: 'Skate unit tests (0.13.x)',
        recordScreenshots: false
      },
      customLaunchers: saucelabsLaunchers,
      browsers: Object.keys(saucelabsLaunchers),
      captureTimeout: 120000,
      reporters: ['saucelabs'],
      autoWatch: false,
      client: {}
    });
  }

  var vitalBrowsersFailed = false;

  return buildTest(opts)
    .on('error', function (e) {
      throw e;
    })
    .on('end', function () {
      new Server(config, function() {
        /* we can use the exitCode parameter in the future when all our tests passed once */
        process.exit(0 + vitalBrowsersFailed);
      })
        .on('run_complete', function(browsers) {
          browsers.forEach(function (browser) {
            if (isVitalBrowser(browser.name)) {
              vitalBrowsersFailed |= !!browser.lastResult.failed;
            }
          });
        })
        .start();
    });
};
