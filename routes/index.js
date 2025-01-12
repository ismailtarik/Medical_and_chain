var express = require('express'); 
var router = express.Router();
const winston = require('winston');  // Importation de winston
const Doctor = require('../models/doctor');
const Transaction = require('../models/Transaction');

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

  // Créer un nouvel objet Doctor pour MongoDB
  const newDoctor = new Doctor({ state: d_state, address: d_adrs, name: d_name, admin_address: admin_adrs });

  // Enregistrer dans MongoDB
  newDoctor.save()
    .then(() => {
      // Une fois enregistré dans MongoDB, ajouter les informations sur la blockchain
      MyContract.methods.setDoctorDetails(d_name, d_adrs, d_state)
        .send({ from: admin_adrs, gas: 6283185 })
        .then(txn => {
          // Log transaction info after blockchain interaction
          logger.info(`Doctor details added successfully in MongoDB: ${txn.transactionHash}`);  // Utilisation du logger

          // Créer un nouvel objet de transaction pour MongoDB
          const newTransaction = new Transaction({
            transactionHash: txn.transactionHash,
            from: txn.from,
            to: txn.to,
            value: txn.value, // Adaptez cela si nécessaire en fonction de la structure de la transaction
          });

          // Enregistrer la transaction dans MongoDB
          newTransaction.save()
            .then(() => {
              logger.info(`Transaction saved to MongoDB: ${txn.transactionHash}`);
              res.json({ done: 1, message: 'Doctor details added successfully in the database', transactionHash: txn.transactionHash });
            })
            .catch(err => {
              logger.error(`Error saving transaction to MongoDB: ${err.message}`); // Utilisation du logger
              res.status(500).json({ done: 0, message: 'Failed to save transaction to MongoDB', error: err.message });
            });
        })
        .catch(err => {
          logger.error(`Error adding doctor to blockchain: ${err.message}`);  // Utilisation du logger
          res.status(500).json({ done: 0, message: 'Failed to add doctor to blockchain', error: err.message });
        });
    })
    .catch(err => {
      logger.error(`Error adding doctor to database: ${err.message}`);  // Utilisation du logger
      res.status(500).json({ done: 0, message: 'Failed to add doctor to database', error: err.message });
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

// Ajouter des enregistrements de santé
router.post('/setHealthRecords', (req, res) => {
  const { patient_name, patient_address, inscription, doctor_address } = req.body;

  // Effectuer la transaction sur la blockchain
  MyContract.methods.setHealthRecordsDetails(patient_name, patient_address, inscription)
    .send({ from: doctor_address, gas: 6283185 })
    .then(txn => {
      logger.info(`Adding health records to blockchain: ${txn.transactionHash}`);  // Utilisation du logger

      // Créer un nouvel objet de transaction pour MongoDB
      const newTransaction = new Transaction({
        transactionHash: txn.transactionHash,
        from: txn.from,
        to: txn.to,
        value: txn.value, // Adaptez cela si nécessaire en fonction de la structure de la transaction
      });

      // Enregistrer la transaction dans MongoDB
      newTransaction.save()
        .then(() => {
          logger.info(`Transaction saved to MongoDB: ${txn.transactionHash}`);
          res.json({
            done: 1,
            message: 'Health record added successfully to blockchain',
            transactionHash: txn.transactionHash
          });
        })
        .catch(err => {
          logger.error(`Error saving transaction to MongoDB: ${err.message}`); // Utilisation du logger
          res.status(500).json({
            done: 0,
            message: 'Failed to save transaction to MongoDB',
            error: err.message
          });
        });
    })
    .catch(err => {
      logger.error(`Failed to add health record to blockchain: ${err.message}`); // Utilisation du logger
      res.status(500).json({
        done: 0,
        message: 'Failed to add health record to blockchain',
        error: err.message
      });
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
      // Log transaction info after blockchain interaction
      logger.info(`Access granted transaction successful: ${txn.transactionHash}`);

      // Create a new transaction object for MongoDB
      const newTransaction = new Transaction({
        transactionHash: txn.transactionHash,
        from: txn.from,
        to: txn.to,
        value: txn.value, // Adjust this depending on the structure of the transaction
      });

      // Save the transaction to MongoDB
      newTransaction.save()
        .then(() => {
          res.send({ done: 1, message: "ACCESS GRANTED", transactionHash: txn.transactionHash });
        })
        .catch(err => {
          logger.error(`Error saving transaction to MongoDB: ${err.message}`);
          res.status(500).json({ done: 0, message: 'Failed to save transaction to MongoDB', error: err.message });
        });
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


// R E T R E I V E     H E A L T H     R E C O R D S     H I S T O R Y     F O R     D O C T O R
router.post('/getHealthRecordsHistory', function (req, res, next) {
  let data = req.body; //only use GET for query
  MyContract.methods.getPatientDetails(data.pid).call({ from: data.d_adrs }).then((result1) => {
    console.log("\n\nR E T R E I V I N G     H E A L T H R E C O R D S     H I S T O R Y     F O R     P A T I E N T : " + result1._paName + "\n\n");
    console.log(result1);
    res.send({ done: 1, result: result1 });
  }).catch(err => {
    console.log("\n\nA C C E S S     D E N I E D\n\n");
    res.send(err);
  })
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


// Afficher toutes les transactions
router.get('/transactions', (req, res) => {
  Transaction.find()
    .sort({ timestamp: -1 }) // Tri par date décroissante
    .then(transactions => {
      // Passer les transactions à la vue EJS
      res.render('transactions', { transactions: transactions });
    })
    .catch(err => {
      res.status(500).json({ done: 0, message: 'Failed to retrieve transactions', error: err.message });
    });
});



module.exports = router;
