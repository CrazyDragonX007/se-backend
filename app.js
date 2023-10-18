const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const shiftsRouter = require('./routes/shifts');
const mongoose = require("mongoose");
const app = express();
const {db_string, session_secret} = require('./config');

mongoose.connect(db_string,{useNewUrlParser: true, useUnifiedTopology: true}).then(()=>console.log("db connected"));

const passport = require("passport");
const bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local");
const User = require("./models/user");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: session_secret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({passReqToCallback: true}, async (req, username, password, done) => {
            try {
                const user = await User.findOne({username: username});
                if (!user) return done("Incorrect username");
               user.comparePassword(password,(err,isMatch)=>{
                    if(isMatch){
                        return done(null, user);
                    }else{
                        return done("Incorrect password");
                    }
                });
            } catch (error) {
                console.log(error);
                return done(error, false);
            }
        }
    )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/shifts', shiftsRouter);

module.exports = app;
