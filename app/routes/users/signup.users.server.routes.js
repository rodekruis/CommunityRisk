var passport = require('passport'),
    signupController = require('../../controllers/user/siginup.users.server.controller');

module.exports = function(app) {
    app.get('/signup', signupController.show)
    app.post('/signup', signupController.signup)
}