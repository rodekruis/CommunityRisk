var passport = require('passport'),
    signupController = require('../controllers/signupController.js'),
    Model = require('../models/models.js'),
    LocalStrategy = require('passport-local').Strategy;

module.exports = function(app) {
    var isAuthenticated = function(req, res, next) {
        if (req.isAuthenticated())
            return next()
        req.flash('error', 'You have to be logged in to access the page.')
        res.redirect('/home')
    }

    app.get('/signup', signupController.show)
    app.post('/signup', signupController.signup)

    app.post('/login',
        passport.authenticate('local', {
            successRedirect: '/dashboard',
            failureRedirect: '/home'
        }));

    app.get('/home', function(req, res) {
        console.log(passport.authenticate)
        res.send('home, not logged in')
    })


    app.get('/loggedin', function(req, res) {
        res.send('You logged in succesfully')
    })

    app.get('/dashboard', isAuthenticated, function(req, res) {
        res.send('dashboard, succesfully logged in')
    })

    app.get('/logout', function(req, res) {
        req.logout()
        res.redirect('/home')
    })
}