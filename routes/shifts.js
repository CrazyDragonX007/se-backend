const express = require('express');
const router = express.Router();
const Shift = require('../models/shift');
const User = require('../models/user');
const {isAdmin} = require("../utils/isAdmin");
const mailer = require("../utils/mailer");

// Get all shifts by both admin and volunteer
router.get('/shifts', async (req, res) => {
    if (req.isAuthenticated() && req.user.approved === true) {
        Shift.find().then(shifts => res.status(200).json(shifts));
    } else {
        res.status(401).json({error: "Not logged in"});
    }
});

// Request for a shift by volunteer
router.get('/request', async (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'volunteer') {
        const shiftId = req.query.shiftid;
        Shift.findById(shiftId).then(shift => {
            shift.requests.push(req.user._id);
            shift.save();
            res.status(200).json({status: "success"});
        })
    } else {
        res.status(401).json({error: "Not logged in"});
    }
});

// View all shift requests by an admin
router.get('/shift_requests', async (req, res) => {
    if (req.isAuthenticated()) {
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.find({"requests.0": {"$exists": true}}).then(async shifts => {
                const newshifts = await Promise.all(shifts.map(async shift => {
                    const users = [];
                    const reqs = shift.requests;
                    for (let i = 0; i < reqs.length; i++) {
                        const user = await User.findById(reqs[i]);
                        users.push(user);
                    }
                    shift = {...shift._doc, users: users};
                    return shift;
                }));
                res.status(200).json(newshifts);
            }).catch(err => {
                console.log(err);
                res.status(400).json(err);
            })
        } else {
            res.status(401).json({error: "Not an admin"});
        }
    } else {
        res.status(401).json({error: "Not logged in"});
    }
});

//Admin - create shift
router.post("/create", async function (req, res) {
    if (req.isAuthenticated()) {
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.create({
                title: req.body.title,
                date: req.body.date,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                location: req.body.location,
                req_skills: req.body.req_skills,
                max_volunteers: req.body.max_volunteers
            }).then(shift => res.status(200).json(shift)).catch(e => {
                    console.log(e);
                    res.status(400).json({error: "some error occurred"});
                });
        } else {
            res.status(401).json({error: "Not an admin"});
        }
    } else {
        res.status(401).json({error: "Not logged in"});
    }
});

// Admin approve shift
router.post("/approve_shifts", async (req, res) => {
    if (req.isAuthenticated()) {
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            const data = req.body;
            data.forEach(element => {
                Shift.findById(element.shift_id).then(shift => {
                    const requests = shift.requests;
                    element.user_ids.forEach(uid => {
                        const index = requests.indexOf(uid);
                        requests.splice(index, 1);
                        shift.assignedVolunteers.push(uid);
                        User.findById(uid).then(user=>{
                            const subject = "Shift request approved";
                            const body = 'Your request to volunteer for ' + shift.title + ' has been approved. Kindly login to view additional details.';
                            mailer(user.email,subject,body);
                        }).catch(err=>{
                            console.log(err);
                        });
                    });
                    shift.requests = requests;
                    shift.save();
                }).catch(err => {
                    console.log(err);
                });
            });
            res.status(200).json({status:"success"});
        }else {
            res.status(401).json({error: "Not an admin"});
        }
    }else {
        res.status(401).json({error: "Not logged in"});
    }
});

//Admin deny shift
router.post("/deny_shifts", async (req, res) => {
    if (req.isAuthenticated()) {
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            const data = req.body;
            data.forEach(element => {
                Shift.findById(element.shift_id).then(shift => {
                    const requests = shift.requests;
                    element.user_ids.forEach(uid => {
                        const index = requests.indexOf(uid);
                        requests.splice(index, 1);
                        User.findById(uid).then(user=>{
                            const subject = "Shift request denied";
                            const body = 'Your request to volunteer for ' + shift.title + ' has been denied. Kindly login to contact our administrator and view additional details.';
                            mailer(user.email,subject,body);
                        }).catch(err=>{
                            console.log(err);
                        })
                    });
                    shift.requests = requests;
                    shift.save();
                }).catch(err => {
                    console.log(err);
                });
            });
            res.status(200).json({status:"success"});
        }else {
            res.status(401).json({error: "Not an admin"});
        }
    }else {
        res.status(401).json({error: "Not logged in"});
    }
});

// Admin - edit shift
router.post("/edit", async function (req, res) {
    if (req.isAuthenticated()) {
        if (!req.body?.id) {
            res.status(400).json({error: "No id given"});
        }
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.findById(req.body.id).then(shift => {
                if (shift) {
                    if (req.body.title) shift.title = req.body.title;
                    if (req.body.date) shift.date = req.body.date;
                    if (req.body.startTime) shift.startTime = req.body.startTime;
                    if (req.body.endTime) shift.endTime = req.body.endTime;
                    if (req.body.location) shift.location = req.body.location;
                    if (req.body.req_skills) shift.req_skills = req.body.req_skills;
                    if (req.body.max_volunteers) shift.max_volunteers = req.body.max_volunteers;
                    shift.save();
                    if (shift.assignedVolunteers.length > 0) {
                        shift.assignedVolunteers.forEach(volunteer => {
                            User.findById(volunteer).then(user => {
                                const subject = "Updates to shift";
                                const body = 'Your assigned shift for ' + shift.title + ' has been updated. Kindly login to view additional details.';
                                mailer(user.email, subject, body);
                            }).catch(err => {
                                console.log(err);
                            });
                        });
                    }
                    res.status(200).json({status: "success"});
                }else {
                    res.status(400).json({error:"No such shift"});
                }
            }).catch(e => {
                console.log(e);
                res.status(400).json({error: "an error occurred"});
            });
        } else {
            res.status(401).json({error: "Not an admin"});
        }
    } else {
        res.status(401).json({error: "Not logged in"});
    }
});

//Admin - delete shift
router.delete("/delete", async (req, res) => {
    if (req.isAuthenticated()) {
        if (!req.query?.id) {
            res.status(400).json({error: "No id given"});
        }
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.findByIdAndDelete(req.query.id).then(shift => {
                if (shift) {
                    if(shift.assignedVolunteers.length > 0){
                        shift.assignedVolunteers.forEach(volunteer=>{
                            User.findById(volunteer).then(user=>{
                                const subject = "Updates to shift";
                                const body = 'Your assigned shift for ' + shift.title + ' has been removed. Kindly login to view additional details and sign up for other volunteer opportunities.';
                                mailer(user.email,subject,body);
                            }).catch(err=>{
                                console.log(err);
                            });
                        });
                    }
                    res.status(200).json({status: "success"});
                } else {
                    res.status(400).json({error: "No such shift found"});
                }
            }).catch(err => {
                console.log(err);
                res.status(400).json(err);
            })
        } else {
            res.status(401).json({error: "Not an admin"});
        }
    } else {
        res.status(401).json({error: "Not logged in"});
    }
})

module.exports = router;

