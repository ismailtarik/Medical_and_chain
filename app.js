var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');  // morgan logger
var Web3 = require('web3');

// Establish connection with Alchemy Sepolia
const web3 = new Web3('https://eth-sepolia.g.alchemy.com/v2/QOp6tWYTJ1a_1M_bAuKOIR989euSGZ2Z');

// Get contract address
const contractAddress = '0x09bd209B22D39cbfeF9C4ce0543Cf40cF707B1ee';

// I M P O R T     C O M P I L E D     O U T P U T     O F     M E D I C A L C H A I N     C O N T R A C T     F R O M     B U I L D     D I R E C T O R Y
var MyContractJSON = require(path.join(__dirname,'build/contracts/MedicalChain.json'));

// // E S T A B L I S H     C O N N E C T I O N     W I T H     L O C A L     G E T H     P R I V A T E     C H A I N
// web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

// // G E T     C O N T R A C T     A D D R E S S ,   F R O M     N E T W O R K     I D     4 0 0 2  (N/W ID OF PRIVATE CHAIN)
// contractAddress = MyContractJSON.networks['5777'].address;

// C O N T R A C T     A D D R E S S
console.log("\nC O N T R A C T     A D D R E S S : "+contractAddress+"\n");

// A B I
const abi = MyContractJSON.abi;

//  C R E A T I N G     C O N T R A C T     O B J E C T
MyContract = new web3.eth.Contract(abi, contractAddress);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/medical_chain', {
            useNewUrlParser: true, // Toujours requis
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit process with failure
    }
};

connectDB();

const winston = require('winston');
// Configuration du logger pour Winston
const winstonLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'execution_trace.log' })  // Enregistrer les logs dans un fichier
  ],
});
// Exemple d'enregistrement de logs
winstonLogger.info('Backend is starting');

app.use(morgan('dev')); // morgan logger
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// C A T C H     4 0 4     &     F W D     T O     E R R O R     H A N D L E R 
app.use(function(req, res, next) {
  next(createError(404));
});

// E R R O R     H A N D L E R
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // R E N D E R     T H E     E R R O R     P A G E 
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
