const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    name:{type:String,required:true},
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    email: {type: String,required:true},
    contact: Number,
    address: String,
    role:{type: String, required: true},
    approved: {type: Boolean, default: false}
});

UserSchema.pre("save", function(next) {
    var user = this;

// only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

// generate a salt
    bcrypt.genSalt(5, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);