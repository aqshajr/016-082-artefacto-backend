const express = require('express');
const router = express.Router();
const ownedTicketController = require('../controllers/ownedTicketController');
const { ownedTicketValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute untuk user yang sudah login
router.get('/', ownedTicketController.getOwnedTickets);
router.get('/:id', idParamValidation, ownedTicketController.getOwnedTicketById);
router.post('/', ownedTicketValidation, ownedTicketController.createOwnedTicket);

module.exports = router;
