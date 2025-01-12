const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionHash: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  value: { type: String, required: false, default: '0' },  // Rendre "value" optionnel et définir une valeur par défaut
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
