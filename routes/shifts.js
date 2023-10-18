const express = require('express');
const router = express.Router();
const Shift = require('../models/shift');
const {isAdmin} = require("../utils/isAdmin");

//TODO: Add get request to see all shifts
//TODO: Shift request functionality?
router.post("/create", async function (req,res){
    console.log(!req.isAuthenticated())
    if(req.isAuthenticated()) {
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.create({
                date: req.body.date,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                location: req.body.location,
                req_skills: req.body.req_skills,
                max_volunteers: req.body.max_volunteers
            }).then(sft => res.status(200).json(sft))
                .catch(e => {
                    console.log(e);
                    res.status(400).json({error: "some error occurred"});
                });
        } else {
            res.status(401).json({error: "Not an admin"});
        }
    } else {
        res.status(401).json({error:"Not logged in"});
    }
});

// TODO: Add email functionallity
router.post("/edit",async function (req,res){
    if(req.isAuthenticated()) {
        if (!req.body?._id) {
            res.status(400).json({error: "No id given"});
        }
        const adminCheck = await isAdmin(req);
        if (adminCheck) {
            Shift.findById(req.body._id).then(shift => {
                if (req.body.date) shift.date = req.body.date;
                if (req.body.startTime) shift.startTime = req.body.startTime;
                if (req.body.endTime) shift.endTime = req.body.endTime;
                if (req.body.location) shift.location = req.body.location;
                if (req.body.req_skills) shift.req_skills = req.body.req_skills;
                if (req.body.max_volunteers) shift.max_volunteers = req.body.max_volunteers;
                shift.save();
                res.status(200).json({status: "success"});
            }).catch(e => {
                console.log(e);
                res.status(400).json({error: "an error occurred"});
            });
        }
    } else{
        res.status(401).json({error:"Not logged in"});
    }
});

// TODO: Add shift delete api with email functionality

module.exports = router;

