// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var assert = require('assert');

var dirsum = require('../lib/dirsum');

dirsum.digest(process.cwd() + '/tst/openldap', function(err, hashes) {
  assert.ok(!err);
  assert.ok(hashes);
  console.log(JSON.stringify(hashes, null, 2));
});

dirsum.digest(process.cwd() + '/tst', function(err, hashes) {
  assert.ok(!err);
  assert.ok(hashes);
  assert.ok(hashes.files);
  assert.equal(hashes.files['dirsum.test.js'], undefined);
  console.log(JSON.stringify(hashes, null, 2));
}, function(path, filename) {
  return filename === 'dirsum.test.js';
});
