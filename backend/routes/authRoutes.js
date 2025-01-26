import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.get('/users', authController.getAllUsers);
router.put('/users/:userId/block', authController.blockUser);

export default router;