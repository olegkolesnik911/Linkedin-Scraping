const express = require('express');
const creditRouter = express.Router();
const creditController = require('../controllers/creditController');

// Routes
creditRouter.get('/', creditController.getAllCredits);
creditRouter.post('/', creditController.createCredit);
creditRouter.get('/totalCredits', creditController.getSumCredits);
creditRouter.post('/useCredit', creditController.useCredit);

module.exports = creditRouter;