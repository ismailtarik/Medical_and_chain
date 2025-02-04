var express = require('express'); 
var router = express.Router();
const winston = require('winston');  // Importation de winston
const Doctor = require('../models/doctor');
const Transaction = require('../models/Transaction');
const { recoverPersonalSignature } = require('@metamask/eth-sig-util');

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

// S I G N I N G     W I T H     A D M I N     I N F O
router.post('/admin_reg', function (req, res, next) {
  var admin = req.body.a_adrs;
  console.log("\n\nA D M I N     L O G I N     S U C C E S S F U L L\n\n");
  res.send({ done: 1, adrs: admin, message: "ADMIN LOGIN SUCCESSFULL" });
})


// S I G N I N G     W I T H     D O C T O R     I N F O
router.post('/doctor_reg', function (req, res, next) {
  var doctor = req.body.d_adrs;
  console.log("\n\nD O C T O R     L O G I N     S U C C E S S F U L L\n\n");
  res.send({ done: 1, dadrs: doctor, message: "DOCTOR LOGIN SUCCESSFULL" });
});



// S I G N I N G     W I T H     P A T I E N T     I N F O
router.post('/patients_reg', function (req, res, next) {
  var patient = req.body.p_adrs;
  console.log("\n\nP A T I E N T     L O G I N     S U C C E S S F U L L\n\n");
  res.send({ done: 1, padrs: patient, message: "PATIENT LOGIN SUCCESSFULL" });
});


// Ajouter un médecin
router.post('/setDrRecords', async (req, res) => {
  const { d_state: state, d_adrs: adrs, d_name: name, admin_adrs: admin } = req.body;

  // Validation de l'adresse du médecin
  if (!/^0x[a-fA-F0-9]{40}$/.test(adrs)) {
    return res.status(400).json({ done: 0, message: 'Invalid doctor address' });
  }

  try {
    const accList = await web3.eth.getAccounts();
    if (accList.length === 0) {
      return res.status(400).json({ done: 0, message: 'No accounts found in Web3' });
    }

    const senderAddress = admin || accList[0];
    console.log("Using sender address:", senderAddress);

    // Appel au contrat pour enregistrer les détails du médecin
    const txn = await MyContract.methods.setDoctorDetails(state, adrs, name)
      .send({ from: senderAddress, gas: 6283185 });

    console.log("Transaction successful:", txn.transactionHash);

    // Sauvegarde de la transaction
    const newTransaction = new Transaction({
      transactionHash: txn.transactionHash,
      from: txn.from,
      to: txn.to,
      value: txn.value,
    });
    await newTransaction.save();

    // Sauvegarde des détails du médecin dans MongoDB
    const newDoctor = new Doctor({
      state: state,
      address: adrs,
      name: name,
      admin_address: senderAddress,
    });
    const savedDoctor = await newDoctor.save();

    res.json({
      done: 1,
      message: "Doctor details added and transaction saved to database",
      doctor: savedDoctor,
      transactionHash: txn.transactionHash,
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      done: 0,
      message: 'An error occurred while processing the request',
      error: err.message,
    });
  }
});


// Retrieve doctor records based on address
// router.post('/getDrRecords', (req, res) => {
//   const { d_adrs: dr } = req.body;

//   // Validate input
//   if (!dr) {
//     logger.warn("Doctor address not provided in request");  // Log missing input
//     return res.status(400).json({ done: 0, message: 'Doctor address is required' });
//   }

//   // Search for doctor in MongoDB
//   Doctor.findOne({ address: dr })
//     .then(doctor => {
//       if (doctor) {
//         logger.info(`Doctor found for address: ${dr}`);  // Log success
//         res.status(200).json({ done: 1, result: doctor });
//       } else {
//         logger.warn(`No doctor found for address: ${dr}`);  // Log not found
//         res.status(404).json({ done: 0, message: 'Doctor not found with the given address' });
//       }
//     })
//     .catch(err => {
//       logger.error(`Error retrieving doctor record: ${err.message}`);  // Log error
//       res.status(500).json({ done: 0, message: 'Error while retrieving doctor record', error: err.message });
//     });
// });

// Retrieve doctor records from blockchain based on address
router.post('/getDrRecords', async (req, res) => {
  const { d_adrs: dr } = req.body;

  // Validation de l'adresse
  if (!dr) {
    logger.warn("Adresse du docteur manquante dans la requête");
    return res.status(400).json({ done: 0, message: 'L\'adresse du docteur est requise' });
  }

  try {
    const accList = await web3.eth.getAccounts();
    if (accList.length === 0) {
      return res.status(400).json({ done: 0, message: 'Aucun compte trouvé dans Web3' });
    }

    // Appel à la méthode du contrat pour obtenir les détails du docteur
    const doctorDetails = await MyContract.methods.getDoctorDetails(dr).call({ from: accList[0] });

    // Log des données récupérées pour débogage
    logger.info(`Détails du docteur récupérés : ${JSON.stringify(doctorDetails)}`);

    if (doctorDetails) {
      // Assurez-vous que le nom est bien récupéré en tant que chaîne de caractères
      if (!doctorDetails[0]) {
        logger.warn(`Nom du docteur vide pour l'adresse : ${dr}`);
        return res.status(404).json({ done: 0, message: 'Nom du docteur introuvable' });
      }

      res.status(200).json({
        done: 1,
        result: {
          name: doctorDetails[0], // Nom du docteur
          state: doctorDetails[1], // État du docteur
          address: dr,
        }
      });
    } else {
      logger.warn(`Aucun docteur trouvé pour l'adresse : ${dr}`);
      res.status(404).json({ done: 0, message: 'Docteur introuvable pour cette adresse' });
    }
  } catch (err) {
    logger.error(`Erreur lors de la récupération du docteur : ${err.message}`);
    res.status(500).json({
      done: 0,
      message: 'Erreur lors de la récupération des données du docteur depuis la blockchain',
      error: err.message,
    });
  }
});



// Route pour ajouter un dossier médical
router.post('/setHealthRecords', async (req, res) => {
  const { patient_name, patient_adrs, inscription, doctor_adrs } = req.body;

  console.log(doctor_adrs);
  // Vérifier si l'adresse du médecin est valide (longueur 42 caractères)
  if (!doctor_adrs || doctor_adrs.length !== 42) {
    return res.status(400).json({
      done: 0,
      message: 'Adresse du médecin invalide',
    });
  }

  // Vérifier que les autres informations sont bien présentes
  if (!patient_name || !patient_adrs || !inscription) {
    return res.status(400).json({
      done: 0,
      message: 'Tous les champs doivent être remplis',
    });
  }

  try {
    // Si l'adresse du médecin et les informations sont valides, procéder à l'ajout du dossier médical
    const txn = await MyContract.methods.setHealthRecordsDetails(patient_name, patient_adrs, inscription)
      .send({ from: doctor_adrs, gas: 6283185 });

    console.log("Transaction réussie:", txn.transactionHash);

    // Répondre avec le succès
    res.json({
      done: 1,
      message: "Dossier médical ajouté et transaction sauvegardée",
      transactionHash: txn.transactionHash,
    });
  } catch (err) {
    console.error("Erreur:", err.message);
    res.status(500).json({
      done: 0,
      message: 'Une erreur est survenue lors du traitement de la demande',
      error: err.message,
    });
  }
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
      logger.info(`Doctor id: ${did}`);
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


// Middleware to generate nonce
let nonces = {}; // In-memory store for demonstration; replace with a database in production

router.get('/get_nonce/:address', (req, res) => {
  const address = req.params.address;
  if (!address) {
    return res.status(400).json({ message: "Invalid address" });
  }
  const nonce = `Login request: ${Math.floor(Math.random() * 1000000)}`;
  nonces[address] = nonce;
  res.json({ nonce });
});

// MetaMask login route with nonce validation
router.post('/metamask_login', async (req, res) => {
  const { address, signature, role } = req.body;
  const nonce = nonces[address];

  if (!nonce) {
    return res.status(400).json({ success: false, message: "Nonce missing or expired" });
  }

  try {
    const msgHex = `0x${Buffer.from(nonce, 'utf8').toString('hex')}`;
    const recoveredAddress = recoverPersonalSignature({
      data: msgHex,
      signature: signature,
    });

    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      delete nonces[address]; // Invalidate the nonce after successful login

      const redirectUrl = getRedirectUrl(role);
      return res.json({ success: true, role, redirectUrl, address });
    } else {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Helper function to determine redirect URL based on role
function getRedirectUrl(role) {
  switch (role) {
    case 'admin':
      return '/setDrRecords';
    case 'dr':
      return '/addHealthRecords';
    case 'patient':
      return '/patient_access';
    default:
      return '/'; // Default landing page
  }
}


module.exports = router;
