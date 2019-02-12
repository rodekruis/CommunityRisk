var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    Model = require('./models/models.js'),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    passport = require("passport");

module.exports = function(app) {
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(
        function(username, password, done) {
            Model.User.findOne({
                where: {
                    'username': username
                }
            }).then(function(user) {
                if (user == null) {
                    return done(null, false, { message: 'Incorrect credentials.' })
                }

                var hashedPassword = bcrypt.hashSync(password, user.salt)

                if (user.password === hashedPassword) {
                    return done(null, user)
                }

                return done(null, false, { message: 'Incorrect credentials.' })
            })
        }
    ))

    passport.serializeUser(function(user, done) {
        done(null, user.id)
    })

    passport.deserializeUser(function(id, done) {
        Model.User.findOne({
            where: {
                'id': id
            }
        }).then(function(user) {
            if (user == null) {
                done(new Error('Wrong user id.'))
            }

            done(null, user)
        })
    })
}