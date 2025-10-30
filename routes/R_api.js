import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '15d' })
}

router.post('/register', async (req, res) => {
    try{
        const { username, email, password, name } = req.body;
        if(!username || !email || !password){
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        if(password.length < 6){
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }
        if(username.length < 3 || username.length > 30){
            return res.status(400).json({ msg: 'Username must be between 3 and 30 characters' });
        }

        const existingUser = await User.findOne({$or: [{email}, {username}]})
        if(existingUser){
            return res.status(400).json({ msg: 'User with this email or username already exists' });
        }

        // const existingEmail = await User.findOne({username})
        // if(existingEmail){
        //     return res.status(400).json({ msg: 'User with this username already exists' });
        // }

        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const user = new User({ 
            username, 
            email, 
            password, 
            name,
            profileImage: profileImage 
        });

        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({ 
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            msg: 'User registered successfully' 
        });
    }catch(err){
        console.error("Error in register route", err);
        res.status(500).json({ message: "Internal Server Error."});
    }
});

router.post('/login', async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){   
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        //check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if(!isPasswordCorrect){
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ 
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            msg: 'User logged in successfully' 
        });
    }catch(err){
        console.error("Error in login route", err);
        res.status(500).json({ message: "Internal Server Error."});
    }
})

router.get('/status', async (req, res) => {
  res.json({ status: 'API is working with MongoDB' });
});

export default router;