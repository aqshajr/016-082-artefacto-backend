const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const templeRoutes = require('./templeRoutes');
const artifactRoutes = require('./artifactRoutes');
const ticketRoutes = require('./ticketRoutes');
const transactionRoutes = require('./transactionRoutes');
const ownedTicketRoutes = require('./ownedTicketRoutes');

router.use('/auth', authRoutes);
router.use('/temples', templeRoutes);
router.use('/artifacts', artifactRoutes);
router.use('/tickets', ticketRoutes);
router.use('/transactions', transactionRoutes);
router.use('/owned-tickets', ownedTicketRoutes);

module.exports = router; 