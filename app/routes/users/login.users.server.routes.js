var passport = require('passport');

module.exports = function(app) {

    var isAuthenticated = function(req, res, next) {
        if (req.isAuthenticated())
            return next()
        req.flash('error', 'You have to be logged in to access the page.')
        res.redirect('/notloggedin')
    }

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/loggedin',
        failureRedirect: '/notloggedin'
    }))

    app.get('/logout', function(req, res) {
        req.logout()
        res.redirect('/notloggedin')
    })

    app.get('/notloggedin', function(req, res) {
        res.send('OUT, you are not logged in')
    })

    app.get('/loggedin', isAuthenticated, function(req, res) {
        res.send('IN, succesfully logged in')
    })
}