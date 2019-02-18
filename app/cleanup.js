'use strict';
User = require('./models/user.server.model')

module.exports = function(callback) {
    console.log("Attempting to create an initial user")
        // recreate User table
    User.User.sync({ force: true }).then(function() {
        // create username with username: user and 
        // password: user
        User.User.create({
            username: 'user',
            password: '$2a$10$QaT1MdQ2DRWuvIxtNQ1i5O9D93HKwPKFNWBqiiuc/IoMtIurRCT36',
            salt: '$2a$10$QaT1MdQ2DRWuvIxtNQ1i5O'
        }).then(callback)
    })
}