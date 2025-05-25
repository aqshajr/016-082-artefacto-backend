const { Transaction, Ticket, Temple, OwnedTicket } = require('../models');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Get all transactions for current user
exports.getTransactions = async (req, res) => {
  try {
    const userID = req.user.userID;
    
    const transactions = await Transaction.findAll({
      where: { userID },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }],
      order: [['transaction_date', 'DESC']]
    });

    res.json({
      status: 'sukses',
      data: { transactions }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.userID;

    const transaction = await Transaction.findOne({
      where: { 
        transactionID: id,
        userID 
      },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }]
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaksi tidak ditemukan'
      });
    }

    res.json({
      status: 'sukses',
      data: { transaction }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { ticketID, validDate, ticketQuantity } = req.body;
    const userID = req.user.userID;

    // Cek apakah tiket ada
    const ticket = await Ticket.findByPk(ticketID, {
      include: [{
        model: Temple,
        attributes: ['title']
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // Hitung total harga
    const totalPrice = ticket.price * ticketQuantity;

    // Buat transaksi
    const transaction = await Transaction.create({
      userID,
      ticketID,
      ticketQuantity,
      totalPrice,
      validDate,
      status: 'success',
      transactionDate: new Date()
    });

    // Buat owned tickets
    const ownedTickets = [];
    for (let i = 0; i < ticketQuantity; i++) {
      const uniqueCode = crypto.randomBytes(8).toString('hex');
      const ownedTicket = await OwnedTicket.create({
        userID,
        ticketID,
        transactionID: transaction.transactionID,
        uniqueCode,
        usageStatus: 'Belum Digunakan'
      });
      ownedTickets.push(ownedTicket);
    }

    res.status(201).json({
      status: 'sukses',
      message: 'Transaksi berhasil dibuat',
      data: {
        transaction: {
          ...transaction.toJSON(),
          ticket: {
            title: ticket.Temple.title,
            price: ticket.price
          }
        },
        ownedTickets
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};