var express = require('express');
var router = express.Router();
const Doctor = require('../models/doctor');
const HealthRecord = require('../models/healthRecords');

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
  console.log("\n\nADMIN LOGIN SUCCESSFUL\n\n");
  res.send({ done: 1, adrs: admin, message: "ADMIN LOGIN SUCCESSFUL" });
});

router.post('/doctor_reg', (req, res) => {
  const { d_adrs: doctor, a_pswd: pswd } = req.body;
  console.log("\n\nDOCTOR LOGIN SUCCESSFUL\n\n");
  res.send({ done: 1, dadrs: doctor, message: "DOCTOR LOGIN SUCCESSFUL" });
});

router.post('/patients_reg', (req, res) => {
  const { p_adrs: patient, p_pswd: pswd } = req.body;
  console.log("\n\nPATIENT LOGIN SUCCESSFUL\n\n");
  res.send({ done: 1, padrs: patient, message: "PATIENT LOGIN SUCCESSFUL" });
});

// Add doctor records
router.post('/setDrRecords', (req, res) => {
  const { d_state, d_adrs, d_name, admin_adrs } = req.body;

  const newDoctor = new Doctor({ state: d_state, address: d_adrs, name: d_name, admin_address: admin_adrs });
  newDoctor.save()
    .then(() => res.json({ done: 1, message: 'Doctor details added successfully in the database' }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ done: 0, message: 'Failed to add doctor', error: err.message });
    });
});

// Retrieve doctor records
router.post('/getDrRecords', (req, res) => {
  const { d_adrs: dr } = req.body;

  Doctor.findOne({ address: dr })
    .then(doctor => {
      if (doctor) res.json({ done: 1, result: doctor });
      else res.json({ done: 0, message: 'Doctor not found in the database' });
    })
    .catch(err => res.json({ done: 0, message: 'Error while retrieving doctor record', error: err }));
});


// Add health records
router.post('/setHealthRecords', (req, res) => {
  const { patient_name, patient_address, inscription, doctor_address } = req.body;

  MyContract.methods.setHealthRecordsDetails(patient_name, patient_address, inscription)
    .send({ from: doctor_address, gas: 6283185 })
    .then(txn => {
      console.log("\n\nADDING HEALTH RECORDS TO BLOCKCHAIN\n\n", txn);

      const newHealthRecord = new HealthRecord({ patient_name, patient_address, inscription, doctor_address });
      return newHealthRecord.save();
    })
    .then(() => res.json({ done: 1, message: 'Health record added successfully in database' }))
    .catch(err => res.status(500).json({ done: 0, message: 'Failed to add health record', error: err.message }));
});

// Retrieve health records for patients
router.post('/getHealthRecordsForPatients', (req, res) => {
  const { did, p_adrs } = req.body;

  MyContract.methods.getHealthRecords(did).call({ from: p_adrs })
    .then(result1 => res.send({ done: 1, result: result1 }))
    .catch(err => res.send(err));
});

// Grant access to doctor
router.post('/grantAccessToDoctor', (req, res) => {
  const { did, access, p_adrs } = req.body;

  MyContract.methods.grantAccessToDoctor(did, access).send({ from: p_adrs, gas: 6283185 })
    .then(txn => res.send({ done: 1, message: "ACCESS GRANTED" }))
    .catch(err => res.send(err));
});

// Retrieve health records history for patients
router.post('/getHealthRecordsHistoryForPatients', (req, res) => {
  const { p_adrs } = req.body;

  MyContract.methods.getPatientDetails(p_adrs).call({ from: p_adrs })
    .then(result1 => res.send({ done: 1, result: result1 }))
    .catch(err => res.send(err));
});

// Retrieve health records history for doctor
router.post('/getHealthRecordsHistory', (req, res) => {
  const { pid, d_adrs } = req.body;

  MyContract.methods.getPatientDetails(pid).call({ from: d_adrs })
    .then(result1 => res.send({ done: 1, result: result1 }))
    .catch(err => res.send(err));
});

router.post('/getHealthRecords',function(req,res,next){
  let data = req.body; //only use GET for query
  MyContract.methods.getHealthRecordsForDoctor(data.pid).call({from:data.d_adrs}).then((result1)=>{
    console.log("\n\nR E T R E I V I N G     H E A L T H R E C O R D S     F O R     D R ."+result1._drName+"\n\n");
    console.log(result1);
    res.send({done:1,result:result1});
  }).catch(err=>{
    console.log("\n\nA C C E S S     D E N I E D\n\n");
    res.send(err);
  })
});

module.exports = router;
