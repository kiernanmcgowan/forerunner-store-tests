// queue-test
// tests for forerunner queue modules

var vows = require('vows');
var async = require('async');
var _ = require('underscore');
var assert = require('assert');

var sampleData = [];

// take in a queue object just like forerunner would
// this way the queue object can be initialized properly w/o the tests being concerned
function testModule(storeObject, testCallbacks) {
  var tests = vows.describe('Store')
  .addBatch({
    'Creating a few jobs': {
      topic: function() {
        var self = this;
        var jobs = [1, 2, 3, 4];

        async.mapSeries(jobs, function(item, cb) {
          storeObject.create('testObject', {foo: 'bar' + item}, function(err, id, obj) {
            if (err) {
              cb(err);
            } else {
              cb(null, {
                id: id,
                obj: obj
              });
            }
          });
        }, function(err, results) {
          self.callback(err, results);
        });
      },

      'returns an id and an object': function(err, storedObjects) {
        assert.isNull(err);
        var ids = [];
        _.each(storedObjects, function(obj) {
          assert.equal(ids.indexOf(obj.id), -1);
          assert.isObject(obj.obj);
          // store the data for reference later
          sampleData.push(obj);
        });
      }
    }
  })
  .addBatch({
    'Marking progress': {
      topic: function() {
        storeObject.progress(sampleData[0].id, 'wharrgarbl', this.callback);
      },

      'works': function(err) {
        assert.isUndefined(err);
      }
    }
  })
  .addBatch({
    'Counting a failure': {
      topic: function() {
        storeObject.countFailed(sampleData[1].id, 'fail_count', this.callback);
      },

      'returns a failure count of 1': function(err, count) {
        assert.isNull(err);
        assert.equal(count, 1);
      },

      'doing it again': {
        topic: function() {
          storeObject.countFailed(sampleData[1].id, 'fail_count', this.callback);
        },

        'returns a count of 2': function(err, count) {
          assert.isNull(err);
          assert.equal(count, 2);
        }
      }
    }
  })
  .addBatch({
    'Marking a failure': {
      topic: function() {
        storeObject.failed(sampleData[2].id, this.callback);
      },

      'works': function(err) {
        assert.isUndefined(err);
      }
    }
  })
  .addBatch({
    'Marking a completion': {
      topic: function() {
        storeObject.complete(sampleData[3].id, {cat: 'dog'}, this.callback);
      },

      'works': function(err) {
        assert.isUndefined(err);
      }
    }
  })
  .addBatch({
    'Getting queued objects': {
      topic: function() {
        var self = this;
        // empty the queue first
        storeObject.getQueue(this.callback);
      },

      'returns the expected results': function(err, jobs) {
        assert.isNull(err);
        var sourceIds = _.pluck(jobs, 'id');
        // make sure only the two NOT marked as failed or complete are returned
        assert.equal(sourceIds.length, 2);
      }
    }
  })
  .run({reporter: require('vows/lib/vows/reporters/spec')}, testCallbacks);
}
module.exports = testModule;

