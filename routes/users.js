const express = require('express');
const router = express.Router();
const User = require("../models/User");

// Handling user signup
router.post("/register", async (req, res) => {
  const username = req.body.username;
  const existing_user = await User.findOne({username: username});
  if(existing_user?.username===username){
    return res.status(400).json({error:"Username already exists"});
  }
  const user = await User.create({
    username: username,
    password: req.body.password,
    email: req.body.email,
    contact: req.body.contact,
    role: req.body.role
  });
  return res.status(200).json(user);
});

//Handling user login
router.post("/login", async function(req, res){
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      //check if password matches
      user.comparePassword(req.body.password, function (err,match){
        if (err) {
          console.log(err);
          res.status(400).json({ error: "Some error occurred" });
        }
        if(match){
          res.status(200).json({user});
        }else{
          res.status(400).json({ error: "password doesn't match" });
        }
      });
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

//Handling user logout
router.get("/logout", function (req, res) {
  req.logout(function(err) {
    if (err) { res.status(400).json(err); }
    res.status(200).json({status:"successfully logged out"});
  });
});

router.post("/edit", async function (req, res) {
  const username = req.body.username;
  const existing_user = await User.findOne({username: username});
  if (existing_user && existing_user.username === username) {
    if(req.body.contact) existing_user.contact  = req.body.contact;
    if(req.body.email) existing_user.email = req.body.email;
    if(req.body.password) existing_user.password = req.body.password;
    existing_user.save();
    return res.status(200).json({status:"successfully updated profile"})
  }
  return res.status(400).json({error: "No such profile"});
})

module.exports = router;
