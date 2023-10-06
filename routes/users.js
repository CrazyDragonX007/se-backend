const express = require('express');
const router = express.Router();
const User = require("../models/User");

// Handling user signup
router.post("/register", async (req, res) => {
  const username = req.query.username;
  const existing_user = await User.findOne({username: username});
  if(existing_user?.username===username){
    return res.status(400).json({error:"Username already exists"});
  }
  const user = await User.create({
    username: username,
    password: req.query.password,
    email: req.query.email,
    contact: req.query.contact,
    role: req.query.role
  });
  return res.status(200).json(user);
});

//Handling user login
router.post("/login", async function(req, res){
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.query.username });
    if (user) {
      //check if password matches
      const result = req.query.password === user.password;
      if (result) {
        res.status(200).json({user});
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
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
module.exports = router;
