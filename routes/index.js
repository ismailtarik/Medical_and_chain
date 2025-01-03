var express = require('express'); 
var router = express.Router();
const winston = require('winston');  // Importation de winston
const Doctor = require('../models/doctor');
const HealthRecord = require('../models/healthRecords');

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'execution_trace.log' })  // Enregistrer les logs dans un fichier
  ],
});

// Routes to render pages
router.get('/', (req, res) => res.render('dr_reg'));
router.get('/patients_reg', (req, res) => res.render('patient_reg'));
router.get('/admin_reg', (req, res) => res.render('admin_reg'));
router.get('/addHealthRecords', (req, res) => res.render('addHealthRecords'));
router.get('/patient_access', (req, res) => res.render('patient_access'));
router.get('/setDrRecords', (req, res) => res.render('addDrRecords'));

// Routes for signing in
router.post('/admin_reg', (req, res) => {
  const { a_adrs: admin, a_pswd: pswd } = req.body;
  logger.info("ADMIN LOGIN SUCCESSFUL");  // Utilisation du logger
  res.send({ done: 1, adrs: admin, message: "ADMIN LOGIN SUCCESSFUL" });
});

router.post('/doctor_reg', (req, res) => {
  const { d_adrs: doctor, a_pswd: pswd } = req.body;
  logger.info("DOCTOR LOGIN SUCCESSFUL");  // Utilisation du logger
  res.send({ done: 1, dadrs: doctor, message: "DOCTOR LOGIN SUCCESSFUL" });
});

router.post('/patients_reg', (req, res) => {
  const { p_adrs: patient, p_pswd: pswd } = req.body;
  logger.info("PATIENT LOGIN SUCCESSFUL");  // Utilisation du logger
  res.send({ done: 1, padrs: patient, message: "PATIENT LOGIN SUCCESSFUL" });
});

// Add doctor records
router.post('/setDrRecords', (req, res) => {
  const { d_state, d_adrs, d_name, admin_adrs } = req.body;

  const newDoctor = new Doctor({ state: d_state, address: d_adrs, name: d_name, admin_address: admin_adrs });
  newDoctor.save()
    .then(() => {
      logger.info('Doctor details added successfully in the database');  // Utilisation du logger
      res.json({ done: 1, message: 'Doctor details added successfully in the database' });
    })
    .catch(err => {
      logger.error(`Error adding doctor: ${err.message}`);  // Utilisation du logger
      res.status(500).json({ done: 0, message: 'Failed to add doctor', error: err.message });
    });
});

// Retrieve doctor records
router.post('/getDrRecords', (req, res) => {
  const { d_adrs: dr } = req.body;

  Doctor.findOne({ address: dr })
    .then(doctor => {
      if (doctor) {
        logger.info(`Doctor found: ${dr}`);  // Utilisation du logger
        res.json({ done: 1, result: doctor });
      } else {
        logger.warn(`Doctor not found: ${dr}`);  // Utilisation du logger
        res.json({ done: 0, message: 'Doctor not found in the database' });
      }
    })
    .catch(err => {
      logger.error(`Error retrieving doctor record: ${err.message}`);  // Utilisation du logger
      res.json({ done: 0, message: 'Error while retrieving doctor record', error: err });
    });
});

// Add health records
router.post('/setHealthRecords', (req, res) => {
  const { patient_name, patient_address, inscription, doctor_address } = req.body;

  MyContract.methods.setHealthRecordsDetails(patient_name, patient_address, inscription)
    .send({ from: doctor_address, gas: 6283185 })
    .then(txn => {
      logger.info(`Adding health records to blockchain: ${txn.transactionHash}`);  // Utilisation du logger

      const newHealthRecord = new HealthRecord({ patient_name, patient_address, inscription, doctor_address });
      return newHealthRecord.save();
    })
    .then(() => {
      logger.info('Health record added successfully in database');  // Utilisation du logger
      res.json({ done: 1, message: 'Health record added successfully in database' });
    })
    .catch(err => {
      logger.error(`Failed to add health record: ${err.message}`);  // Utilisation du logger
      res.status(500).json({ done: 0, message: 'Failed to add health record', error: err.message });
    });
});

// Retrieve health records for patients
router.post('/getHealthRecordsForPatients', (req, res) => {
  const { did, p_adrs } = req.body;

  MyContract.methods.getHealthRecords(did).call({ from: p_adrs })
    .then(result1 => {
      logger.info(`Retrieved health records for patient: ${p_adrs}`);  // Utilisation du logger
      res.send({ done: 1, result: result1 });
    })
    .catch(err => {
      logger.error(`Error retrieving health records for patient: ${err.message}`);  // Utilisation du logger
      res.send(err);
    });
});

// Grant access to doctor
router.post('/grantAccessToDoctor', (req, res) => {
  const { did, access, p_adrs } = req.body;

  logger.info(`Granting access to doctor with DID: ${did}, access: ${access}, patient address: ${p_adrs}`);

  MyContract.methods.grantAccessToDoctor(did, access).send({ from: p_adrs, gas: 6283185 })
    .then(txn => {
      logger.info(`Access granted transaction successful: ${txn.transactionHash}`);
      res.send({ done: 1, message: "ACCESS GRANTED" });
    })
    .catch(err => {
      logger.error(`Error granting access: ${err.message}`);
      res.send(err);
    });
});

// Retrieve health records history for patients
router.post('/getHealthRecordsHistoryForPatients', (req, res) => {
  const { p_adrs } = req.body;

  logger.info(`Retrieving health records history for patient address: ${p_adrs}`);

  MyContract.methods.getPatientDetails(p_adrs).call({ from: p_adrs })
    .then(result1 => {
      logger.info(`Health records retrieved for patient: ${p_adrs}`);
      res.send({ done: 1, result: result1 });
    })
    .catch(err => {
      logger.error(`Error retrieving health records: ${err.message}`);
      res.send(err);
    });
});

// Retrieve health records history for doctor
router.post('/getHealthRecordsHistory', (req, res) => {
  const { pid, d_adrs } = req.body;

  logger.info(`Retrieving health records history for doctor address: ${d_adrs}, patient ID: ${pid}`);

  MyContract.methods.getPatientDetails(pid).call({ from: d_adrs })
    .then(result1 => {
      logger.info(`Health records history retrieved for doctor: ${d_adrs}, patient ID: ${pid}`);
      res.send({ done: 1, result: result1 });
    })
    .catch(err => {
      logger.error(`Error retrieving health records for doctor: ${err.message}`);
      res.send(err);
    });
});

// Retrieve health records for doctor
router.post('/getHealthRecords', function (req, res, next) {
  let data = req.body;
  
  logger.info(`Retrieving health records for doctor with address: ${data.d_adrs}, patient ID: ${data.pid}`);

  MyContract.methods.getHealthRecordsForDoctor(data.pid).call({ from: data.d_adrs })
    .then((result1) => {
      logger.info(`Health records retrieved for doctor: ${data.d_adrs}, patient ID: ${data.pid}, Doctor Name: ${result1._drName}`);
      res.send({ done: 1, result: result1 });
    })
    .catch(err => {
      logger.error(`Access denied or error retrieving health records: ${err.message}`);
      res.send(err);
    });
});


module.exports = router;
