const User = require("../models/user");

exports.isAdmin=function(username){
    console.log(username);
    return User.findOne({username:username}).then(user => user.role === 'admin');
}