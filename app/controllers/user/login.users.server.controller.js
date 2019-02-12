var passport = require('passport');

module.exports = {
    login: function() {
        passport.authenticate('local', {
            successRedirect: '/loggedin',
            failureRedirect: '/notloggedin'
        })
    },
    logout: function(req, res) {
        req.logout()
        res.redirect('/notloggedin')
    }
}