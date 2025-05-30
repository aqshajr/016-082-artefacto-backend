const { OwnedTicket, Ticket, Temple } = require('../models');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Get all owned tickets for current user
exports.getOwnedTickets = async (req, res) => {
  try {
    const userID = req.user.userID;
    
    const ownedTickets = await OwnedTicket.findAll({
      where: { userID },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }],
      order: [['ownedTicketID', 'DESC']]
    });

    res.json({
      status: 'sukses',
      data: { ownedTickets }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get specific owned ticket
exports.getOwnedTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.userID;

    const ownedTicket = await OwnedTicket.findOne({
      where: { 
        ownedTicketID: id,
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

    if (!ownedTicket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    res.json({
      status: 'sukses',
      data: { ownedTicket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create owned ticket
exports.createOwnedTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { ticketID, validDate } = req.body;
    const userID = req.user.userID;

    // Generate unique code
    const uniqueCode = crypto.randomBytes(8).toString('hex');

    const ownedTicket = await OwnedTicket.create({
      userID,
      ticketID,
      uniqueCode,
      validDate,
      usageStatus: 'Belum Digunakan',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      status: 'sukses',
      message: 'Tiket berhasil dibuat',
      data: { ownedTicket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update usage status of owned ticket
exports.updateUsageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.userID;

    // Find the owned ticket belonging to the current user
    const ownedTicket = await OwnedTicket.findOne({
      where: { 
        ownedTicketID: id,
        userID 
      }
    });

    if (!ownedTicket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // Check if ticket is already used
    if (ownedTicket.usageStatus === 'Sudah Digunakan') {
      return res.status(400).json({
        status: 'error',
        message: 'Tiket sudah pernah digunakan'
      });
    }

    // Update usage status
    await ownedTicket.update({
      usageStatus: 'Sudah Digunakan'
    });

    // Fetch updated ticket with related data
    const updatedTicket = await OwnedTicket.findOne({
      where: { ownedTicketID: id },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }]
    });

    res.json({
      status: 'sukses',
      message: 'Status penggunaan tiket berhasil diperbarui',
      data: { ownedTicket: updatedTicket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};
