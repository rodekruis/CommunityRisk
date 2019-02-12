var bcrypt = require('bcrypt'),
    Model = require('../../models/models.js')

module.exports.show = function(req, res) {
    res.send('signup')
}

module.exports.signup = function(req, res) {
    console.log("Signup")
    var username = req.body.username
    var password = req.body.password
    var password2 = req.body.password2

    console.log("Data is", username, password)

    if (!username || !password || !password2) {
        res.send('error', "Please, fill in all the fields.")
        res.redirect('signup')
    }

    if (password !== password2) {
        res.send('error', "Please, enter the same password twice.")
        res.redirect('signup')
    }

    var salt = bcrypt.genSaltSync(10)
    var hashedPassword = bcrypt.hashSync(password, salt)

    var newUser = {
        username: username,
        salt: salt,
        password: hashedPassword
    }

    Model.User.create(newUser).then(function() {
        res.redirect('/loggedin')
    }).catch(function(error) {
        res.send("Please, choose a different username.")
        res.redirect('/signup')
    })
}