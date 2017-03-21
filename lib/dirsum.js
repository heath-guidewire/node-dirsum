// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var crypto = require('crypto');
var fs = require('fs');

function _summarize(method, hashes) {
  var keys = Object.keys(hashes);
  keys.sort();

  var obj = {};
  obj.files = hashes;
  var hash = crypto.createHash(method);
  for (var i = 0; i < keys.length; i++) {
    if (typeof(hashes[keys[i]]) === 'string') {
      hash.update(hashes[keys[i]]);
    } else if (typeof(hashes[keys[i]]) === 'object') {
      hash.update(hashes[keys[i]].hash);
    } else {
      console.error('Unknown type found in hash: ' + typeof(hashes[keys[i]]));
    }
  }

  obj.hash = hash.digest('hex');
  return obj;
}

function doDigesting(dirName, method, callback, ignoreCallback) {
  var hashes = {};
  fs.readdir(dirName, function(err, files) {
    if (err) return callback(err);

    if (files.length === 0) {
      return callback(undefined, { hash: '', files: {} });
    }

    var processed = 0;
    var total = files.length;
    function bookkeeping() {
      if (++processed >= total) {
        callback(undefined, _summarize(method, hashes));
      }
    }
    files.forEach(function(f) {
      var path = dirName + '/' + f;
      if (!ignoreCallback || !ignoreCallback(path, f)) {
        fs.stat(path, function(err, stats) {
          if (err) return callback(err);

          if (stats.isDirectory()) {
            return doDigesting(path, method, function(err, hash) {
              if (err) return callback(err);

              hashes[f] = hash;
              bookkeeping();
            }, ignoreCallback, hashes);
          } else if (stats.isFile()) {
            var hash = crypto.createHash(method);
            var stream = fs.createReadStream(path, { encoding: 'utf8' });
            stream.on('data', function(data) {
              hash.update(data);
            });
            stream.on('end', function() {
              hashes[f] = hash.digest('hex');
              bookkeeping();
            });
            stream.on('error', function(err) {
              callback(err);
            });
          } else {
            console.error('Skipping hash of %s', f);
            bookkeeping();
          }
        });
      } else {
        console.log('Skipping: ', path);
        bookkeeping();
      }
    });
  });
}

function digest(root, method, callback, ignoreCallback) {
  if (!root || typeof(root) !== 'string') {
    throw new TypeError('root is required (string)');
  }
  if (method) {
    if (typeof(method) === 'string') {
      // NO-OP
    } else if (typeof(method) === 'function') {
      ignoreCallback = callback;
      callback = method;
      method = 'md5';
    } else {
      throw new TypeError('hash must be a string');
    }
  } else {
    throw new TypeError('callback is required (function)');
  }
  if (!callback) {
    throw new TypeError('callback is required (function)');
  }

  if (ignoreCallback && typeof(ignoreCallback) !== 'function') {
    throw new TypeError('ignoreCallback is required to be a function');
  }

  doDigesting(root, method, function(err, hashes) {
    callback(err, hashes);
  }, ignoreCallback);
}

module.exports = {
  digest: digest
};
