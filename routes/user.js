var bcrypt = require('bcrypt'),
    db = require('../lib/db'),
    password = require('passport');

module.exports = {
    /**
     * Show the login page. Redirects to /setup if no users at all.
     */
    showLogin: function(req, res) {
        var users = db.coll('users');

        users.count(function(err, count) {
            if (count === 0) {
                res.redirect('/setup');
            } else {
                res.render('login', {
                    title: 'Login'
                });
            }
        });
    },
    /**
     * Show the setup page. Redirects to /login if there are users.
     */
    showSetup: function(req, res) {
        var users = db.coll('users');

        users.count(function(err, count) {
            if (count === 0) {
                res.render('setup', {
                    title: 'Admin User Setup'
                });
            } else {
                res.redirect('/login');
            }
        });
    },
    /**
     * Creates the admin user. 500s if there's already any user in the database.
     */
    createAdmin: function(req, res) {
        var users = db.coll('users');

        users.count(function(err, count) {
            var user = req.body.email,
                pwd = req.body.password,
                errors = module.exports.validate(req.body);

            if (count === 0) {
                if (errors.length === 0) {
                    bcrypt.hash(pwd, 10, function(err, hash) {
                        users.insert({
                            _id: user,
                            admin: true,
                            email: user,
                            hash: hash
                        }, function(err, users) {
                            var user;
                            if (err) {
                                res.send(500, err);
                            } else {
                                user = users[0];
                                req.logIn(user, function(err, a, b) {
                                    console.log(req.user);
                                    if (err) {
                                        res.send(500, err);
                                    } else {
                                        res.redirect('/');
                                    }
                                });
                            }
                        });
                    });
                } else {
                    res.send(403, errors.join(', '));
                }
            } else {
                res.send(500, "Admin user exists. Cannot overwrite.");
            }
        });
    },
    validate: function(user) {
        var errors = [];

        if (!user.email) {
            errors.push("Username required");
        }
        if (!user.password) {
            errors.push("Password required");
        } else if (user.password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        } else if (user.password !== user.confirm) {
            errors.push("Password and confirmation do not match");
        }

        return errors;
    }
};
