const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    state: String,
    address: String,
    name: String,
    admin_address: String
});

module.exports = mongoose.model('Doctor', doctorSchema);
