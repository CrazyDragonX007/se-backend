const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
    date: {type:Date, required:true},
    startTime: {type: Number, required: true},
    endTime: {type: Number, required:true},
    location: String,
    req_skills: String,
    max_volunteers: {type: Number, required: true},
    assignedVolunteers: [{type: mongoose.Schema.ObjectId, ref:'User', default:[] }],
    requests: [{type: mongoose.Schema.ObjectId, ref:'User', default:[] }]
});

module.exports = mongoose.model('Shift',shiftSchema);