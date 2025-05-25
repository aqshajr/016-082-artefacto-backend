const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { ticketValidation, updateTicketValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute untuk semua user yang sudah login
router.get('/', ticketController.getAllTickets);
router.get('/:id', idParamValidation, ticketController.getTicketById);

// Rute khusus admin
router.post('/',
  isAdmin,
  ticketValidation,
  ticketController.createTicket
);

router.put('/:id',
  isAdmin,
  idParamValidation,
  updateTicketValidation,
  ticketController.updateTicket
);

router.delete('/:id',
  isAdmin,
  idParamValidation,
  ticketController.deleteTicket
);

module.exports = router;
