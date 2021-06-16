import express from 'express';
import {v2} from "cloudinary";
import {createUser, userLogin, register, login} from "../controllers/users/usersController.js";

const router = express.Router();


router.get('/users', (req, res) => {

})

router.post('/register', register)
router.post('/login', login)

export default router
