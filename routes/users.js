const express = require('express');
const router = express.Router();
const User = require("../models/user");
const mailer = require("../utils/mailer");

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
    address: req.body.address,
    role: req.body.role
  });
  if(user) {
    const subject = "Thanks for signing up";
    const body = 'Welcome to The Volunteer connection ' + username + '. You approval is pending with our administrator. Once approved, you will receive another email.';
    const mail_sent = await mailer(user.email,subject,body);
    if(mail_sent) {
      return res.status(200).json(user);
    }else{
      await User.findOneAndDelete({username: username});
      return res.status(400).json({error:"Some error occurred"});
    }
  }
  else return res.status(400).json({error:"Some error occurred"});
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
    console.log(error);
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

// Handling edit profile
router.post("/edit", async function (req, res) {
  const username = req.body.username;
  const existing_user = await User.findOne({username: username});
  if (existing_user && existing_user.username === username) {
    if(req.body.contact) existing_user.contact  = req.body.contact;
    if(req.body.email) existing_user.email = req.body.email;
    if(req.body.password) existing_user.password = req.body.password;
    if(req.body.address) existing_user.address = req.body.address;
    existing_user.save();
    return res.status(200).json({status:"successfully updated profile"});
  }
  return res.status(400).json({error: "No such profile"});
});

// Approval Pending API
router.get("/pending_approval", (req,res)=>{
  const username = req.query.username;
  User.findOne({username: username}).then((user)=>{
    if(user.role === 'admin'){
      User.find({approved:false}).then((users)=>res.status(200).json(users));
    }else {
      return res.status(400).json({error: "unauthorized"})
    }
  });
});

// Approve API
router.get("/approve_users",(req,res)=>{
  const usernames = req.query.usernames;
  let mails = true;
  for(let i=0;i<usernames.length;i++){
    User.findOne({username:usernames[i]}).then(async user=>{
      user.approved = true;
      user.save();
      const subject = 'Approved registration for The Volunteer Connection';
      const body = 'Congratulations '+user.username+', your registration has been approved. You may now view and sign up for shifts on our website.'
      const mail_sent = await mailer(user.email,subject,body);
      if(!mail_sent) {
        mails=false;
      }
    }).catch(err=>console.log(err));
  }
  if(mails) {
    return res.status(200).json({status: "Success"});
  }else{
    return res.status(400).json({error:"some mails were not sent"});
  }
});

router.get("/deny_users",(req,res)=>{
  const usernames = req.query.usernames;
  let mails = true;
  for(let i=0;i<usernames.length;i++){
    User.findOne({username:usernames[i]}).then(async user=>{
      const subject = "Registration rejected";
      const body = "Unfortunately, your registration was not approved. Please contact support for assistance.";
      const mail_sent = await mailer(user.email,subject,body);
      if(!mail_sent) {
        mails=false;
      }
    }).catch(err=>console.log(err));
  }
  if(mails) {
    return res.status(200).json({status: "Success"});
  }else{
    return res.status(400).json({error:"some mails were not sent"});
  }
});

module.exports = router;
