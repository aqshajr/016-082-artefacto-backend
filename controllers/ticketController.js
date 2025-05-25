const { Ticket, Temple } = require('../models');
const { validationResult } = require('express-validator');

// Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    res.json({
      status: 'sukses',
      data: { tickets }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Get ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    res.json({
      status: 'sukses',
      data: { ticket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Create new ticket
exports.createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { templeID, price, description } = req.body;
    const ticket = await Ticket.create({
      templeID,
      price,
      description
    });

    res.status(201).json({
      status: 'sukses',
      message: 'Tiket berhasil dibuat',
      data: { ticket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Update ticket
exports.updateTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    const { templeID, price, description } = req.body;
    const updateData = {
      ...(templeID !== undefined && { templeID }),
      ...(price !== undefined && { price }),
      ...(description !== undefined && { description })
    };

    await ticket.update(updateData);

    // Fetch updated ticket with temple info
    const updatedTicket = await Ticket.findByPk(req.params.id, {
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    res.json({
      status: 'sukses',
      message: 'Tiket berhasil diperbarui',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    await ticket.destroy();

    res.json({
      status: 'sukses',
      message: 'Tiket berhasil dihapus'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};