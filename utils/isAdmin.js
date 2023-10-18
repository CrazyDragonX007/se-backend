const User = require("../models/user");

exports.isAdmin=function(req){
    return User.findOne({username:req.user.username}).then(user => user.role === 'admin');
}