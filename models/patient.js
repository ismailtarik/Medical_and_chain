const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    p_name: String,
    p_adrs: String,
    inscription: String,
    doctor_adrs: String
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
