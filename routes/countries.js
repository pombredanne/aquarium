var countries = require('../lib/countries'),
    janitor = require('../lib/janitor');

module.exports = {
  init: function(app) {
    app.get('/countries.json', module.exports.showCountries);
    app.get('/country/:code.json', module.exports.getCountry);
  },

  showCountries: function(req, res) {
    countries.list({}, function (err, theCountries) {
      if (err) {
        return janitor.error(res, err);
      }
      res.send(theCountries);
    });
  },

  getCountry: function(req, res) {
    var options = {
      code: req.params.code,
    };
    countries.get(options, function(err, country) {
      if (err) {
        return janitor.error(res, err);
      } else if (!country) {
        return janitor.missing(res);
      }
      res.send(country);
    });
  },
};
