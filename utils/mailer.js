const nodemailer = require('nodemailer');
const {mail_username, mail_password} = require('../config');

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:mail_username,
        pass: mail_password
    }
});

const mailer = async (receiver,subject,body) => {
    const mailOptions = {
        from: mail_username,
        to:receiver,
        subject:subject,
        text:body
    };

    const res = await transporter.sendMail(mailOptions).then((info,err) => {
        if(err){
            console.log(err);
            return false;
        }
        console.log(info.response);
        return true;
    });
    return res;
}

module.exports = mailer;