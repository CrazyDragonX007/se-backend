const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
    title:{type:String,required:true},
    date: {type:Date, required:true},
    startTime: {type: Number, required: true},
    endTime: {type: Number, required:true},
    location: String,
    req_skills: String,
    max_volunteers: {type: Number, required: true},
    assignedVolunteers: {type: [String], default:[] },
    requests: {type: [String], default:[] },
    completed: {type: Boolean, default: false}
    // if date.now() > date or( date.now = date and endtime < date.now().time )
});

module.exports = mongoose.model('Shift',shiftSchema);