const fs = require('fs');
const diff = require('diff');
const { reverseChangesFromDiff, convertGitDiffToPatch } = require('./helpers');

const originalFile = `
/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var merge = require('utils-merge')
var parseUrl = require('parseurl');
var qs = require('qs');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function query(options) {
  var opts = merge({}, options)
  var queryparse = qs.parse;

  if (typeof options === 'function') {
    queryparse = options;
    opts = undefined;
  }

  if (opts !== undefined && opts.allowPrototypes === undefined) {
    // back-compat for qs module
    opts.allowPrototypes = true;
  }

  return function query(req, res, next){
    if (!req.query) {
      var val = parseUrl(req).query;
      req.query = queryparse(val, opts);
    }

    next();
  };
};
`;
const newFile = `
/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var merge = require('utils-merge');
var parseUrl = require('parseurl');
var qs = require('qs');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function query(options) {
  var opts = merge({}, options);
  var queryparse = qs.parse;

  if (typeof options === 'function') {
    queryparse = options;
    opts = undefined;
  }

  if (opts !== undefined && opts.allowPrototypes === undefined) {
    // back-compat for qs module
    opts.allowPrototypes = true;
  }

  return function query(req, res, next){
    if (!req.query) {
      var val = parseUrl(req).query;
      req.query = queryparse(val, opts);
    }

    next();
  };
};
`;

const gitDiffOutput = `
diff --git a/lib/middleware/query.js b/lib/middleware/query.js
index 7e916694..861596fe 100644
--- a/lib/middleware/query.js
+++ b/lib/middleware/query.js
@@ -12,7 +12,7 @@
  * Module dependencies.
  */
 
-var merge = require('utils-merge')
+var merge = require('utils-merge');
 var parseUrl = require('parseurl');
 var qs = require('qs');
 
@@ -23,7 +23,7 @@ var qs = require('qs');
  */
 
 module.exports = function query(options) {
-  var opts = merge({}, options)
+  var opts = merge({}, options);
   var queryparse = qs.parse;
 
   if (typeof options === 'function') {

`;
const diffFormat = convertGitDiffToPatch(gitDiffOutput);

const diffContent = diff.createPatch('query.js', originalFile, newFile);

const reversed = reverseChangesFromDiff(diffContent, newFile);

console.log(reversed);
