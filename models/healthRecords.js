const mongoose = require('mongoose');

// Définir le schéma
const healthRecordSchema = new mongoose.Schema({
    patient_name: String,
    patient_address: String,
    inscription: String,
    doctor_address: String
});

// Exporter le modèle
module.exports = mongoose.model('HealthRecord', healthRecordSchema);
