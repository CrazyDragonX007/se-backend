const express = require('express');
const router = express.Router();
const User = require("../models/user");
const mailer = require("../utils/mailer");
const passport = require("passport");

// Handling user signup
router.post("/register", async (req, res) => {
  const username = req.body.username;
  const existing_user = await User.findOne({username: username});
  if(existing_user?.username===username){
    return res.status(400).json({error:"Username already exists"});
  }
  User.create({
    username: username,
    password: req.body.password,
    name: req.body.name,
    email: req.body.email,
    contact: req.body.contact,
    address: req.body.address,
    role: req.body.role
  }).then(async user=>{
      if(user.role === 'admin') {
        user.approved = true;
        user.save();
      }
      const subject = "Thanks for signing up";
      const body = 'Welcome to The Volunteer connection ' + user.name + '. You approval is pending with our administrator. Once approved, you will receive another email.';
      const mail_sent = await mailer(user.email,subject,body);
      if(mail_sent) {
        return res.status(200).json(user);
      }else{
        await User.findOneAndDelete({username: username});
        return res.status(400).json({error:"Some error occurred"});
      }
  }).catch(err=>{
    console.log(err);
    return res.status(400).json(err);
  })

});

//Handling user login
router.post("/login",passport.authenticate("local"), async function(req, res){
    if(req.isAuthenticated()){
      res.status(200).json(req.user);
    }else{
      res.status(400).json({ error: "Some error occurred" });
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
  if(!username){
    res.status(401).json({error:"No username given"});
    return;
  }
  const existing_user = await User.findOne({username: username});
  if (existing_user && existing_user.username === username) {
    if(req.body.name) existing_user.name = req.body.name;
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
router.get("/pending_approval", async (req,res)=>{
  const username = req.query.username;
  if(!username){
    res.status(401).json({error:"No username given"});
    return;
  }
  User.findOne({username: username}).then(usr=>{
    if(usr.role==='admin'){
      User.find({approved:false,role:'volunteer'}).then((users)=>res.status(200).json(users));
    }else {
      return res.status(400).json({error: "not an admin"});
    }
  });
});

// Approve API
router.get("/approve_users",async (req,res)=>{
  const username = req.query.username;
  if(!username){
    res.status(401).json({error:"No username given"});
    return;
  }
  User.findOne({username: username}).then(usr=>{
    if(usr.role==='admin'){
      let usernames = req.query.usernames;
      let mails = true;
      if(!Array.isArray(usernames)){
        usernames = new Array([usernames])
      }
      for(let i=0;i<usernames.length;i++){
        User.findOne({username:usernames[i]}).then(async user=>{
          user.approved = true;
          user.save();
          const subject = 'Approved registration for The Volunteer Connection';
          const body = 'Congratulations '+user.name+', your registration has been approved. You may now view and sign up for shifts on our website.'
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
    }else {
      return res.status(400).json({error: "not an admin"});
    }
  });
});

router.get("/deny_users",async (req,res)=>{
  const username = req.query.username;
  if(!username){
    return res.status(401).json({error:"No username given"});
  }
  let usernames = req.query.usernames;
  let mails = true;
  if(!Array.isArray(usernames)){
    usernames = new Array([usernames])
  }
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
    User.deleteMany({username:{$in:usernames}}).then(res=>console.log(res));
    return res.status(200).json({status: "Success"});
  }else{
    return res.status(400).json({error:"some mails were not sent, hence no users were deleted."});
  }
});

router.get("/staff_list",async (req,res)=>{
  const username = req.query.username;
  if(!username){
    res.status(401).json({error:"No username given"});
    return;
  }
  User.findOne({username: username}).then(usr=>{
    if(usr.role==='admin'){
      User.find({approved: true}).then((users) => res.status(200).json(users));
    }else {
      return res.status(400).json({error: "not an admin"});
    }
  });
});

module.exports = router;
