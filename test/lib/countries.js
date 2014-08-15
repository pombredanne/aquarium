var assert = require('assert'),
    async = require('async'),
    moment = require('moment'),
    db = require('../../lib/db'),
    countries = require('../../lib/countries'),
    users = require('../../lib/users');

describe('countries', function() {
  before(function(done) {
    db.init(done);
  });

  beforeEach(function() {
    countries.drop();
  });

  describe('#list', function() {
    it('should return an empty list if there\'re no countries', function(done) {
      countries.list(function (err, countries) {
        assert.ifError(err);
        assert.deepEqual(countries, []);
        done();
      });
    });

    it('should return the country name, code, and its latest OBI score as numbers', function(done) {
      var data = {
        country: 'Brazil',
        code: 'BR',
        obi_scores: [{ score: '39', year: '2013' }, { score: '42', year: '2014' }]
      };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.list(function (err, countries) {
          var expected = [{
            country: data.country,
            code: data.code,
            obi_score: Number(data.obi_scores[1].score),
            obi_year: Number(data.obi_scores[1].year),
          }];

          assert.ifError(err);
          assert.deepEqual(countries, expected);
          assert.strictEqual(countries[0].obi_score, expected[0].obi_score);
          assert.strictEqual(countries[0].obi_year, expected[0].obi_year);
          done();
        });
      });
    });
  });

  describe('#insert', function() {
    it('should work', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.list(function (err, countries) {
          assert.ifError(err);
          assert.equal(countries.length, 1);
          assert.equal(countries[0].country, 'Brazil');
          done();
        });
      });
    });

    it('should not allow duplicates', function(done) {
      var data = { country: 'Brazil' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.insert(data, function(err) {
          assert(/duplicate/.test(err.err));
          done();
        });
      });
    });
  });

  describe('#get', function() {
    it('should work', function(done) {
      var data = { country: 'Brazil', code: 'BR' };

      countries.insert(data, function (err) {
        assert.ifError(err);
        countries.get({ code: 'BR' }, function (err, country) {
          assert.ifError(err);
          delete country.documents;
          assert.deepEqual(country, data);
          done();
        });
      });
    });

    it('should return null if couldn\'t find country code', function(done) {
      countries.get({ code: 'inexistent-code' }, function (err, country) {
        assert.ifError(err);
        assert.equal(country, null);
        done();
      });
    });

    it('should include the sites as documents', function(done) {
      var country = { country: 'Brazil', code: 'BR' },
          user = {
            username: 'username',
            password: 'password',
            user: {
              country: country.code + ' - ' + country.country,
              admin: false,
              sites: [{
                active: true,
                title: 'the title',
                type: 'Audit Report',
                search_dates: {
                  start: moment('2014-01-01').toString(),
                  end: moment('2014-06-01').toString(),
                }
              }],
            },
          };

      var expectedCountry = {
        country: country.country,
        code: country.code,
        documents: [{
          title: user.user.sites[0].title,
          type: user.user.sites[0].type,
          expected_date: user.user.sites[0].search_dates.start,
          state: 'late',
        }],
      };

      async.parallel({
        country: function(callback) {
          countries.insert(country, callback);
        },
        user: function(callback) {
          users.drop();
          users.insert(user, callback);
        },
      }, function(err, results) {
        assert.ifError(err);
        countries.get({ code: country.code }, function (err, country) {
          assert.ifError(err);
          delete country._id;
          assert.deepEqual(country, expectedCountry);
          users.drop();
          done();
        });
      });
    });
  });
});
