const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const Users = require("../Models/Users.js");
const UserVault = require("../Models/Password.js");

const SecretKey = process.env.SECRET_KEY;


// Validate if required fields are provided
const validateFields = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) {
            return { isValid: false, message: `${key} is required!` };
        }
    }
    return { isValid: true };
};


// Hash passwords
const hashPassword = async (password) => bcrypt.hash(password, 10);


// Find user by email
const findUserByEmail = async (email) => {
    const sanitizedEmail = validator.trim(validator.normalizeEmail(email));
    if (!validator.isEmail(sanitizedEmail)) {
        throw new Error("Invalid email format!");
    }
    return await Users.findOne({ email: sanitizedEmail });
};


// Find user by ID
const findUserById = async (id) => await Users.findById(id);


// Async error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
    fn(req, res, next).catch((e) => {
        console.error(e);
        res.status(500).json({ message: "Something went wrong!" });
    });
};


// function to login user
const userLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const fieldValidation = validateFields({ email, password });
    if (!fieldValidation.isValid) {
        return res.status(400).json({ message: fieldValidation.message });
    }
    const user = await findUserByEmail(email);
    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid Credentials or User Not Active!" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid Credentials!" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, SecretKey, { expiresIn: "30m" });
    user.lastLogin = Date.now();
    await user.save();
    const vault = await UserVault.find({ createdBy: user._id });
    const customUser = {
        email: user.email,
        name: user.name,
        answer: user.answer,
        dateOfBirth: user.dateOfBirth,
        firstLogin: vault.length === 0,
    };
    res.status(200).json({ message: "Login Successful!", token, user: customUser });
});


// function to register user
const userRegister = asyncHandler(async (req, res) => {
    const { name, email, dob, answer, password } = req.body;
    const fieldValidation = validateFields({ name, email, dob, answer, password });
    if (!fieldValidation.isValid) {
        return res.status(400).json({ message: fieldValidation.message });
    }
    if (await findUserByEmail(email)) {
        return res.status(409).json({ message: "Email Already Exist!!" });
    }
    const user = new Users({
        role: 0,
        isActive: true,
        name,
        dateOfBirth: dob,
        email: email.toLowerCase(),
        answer: btoa(answer.toLowerCase()),
        password: await hashPassword(password),
    });
    await user.save();
    res.status(201).json({ message: "User Registered Successfully!!" });
});


// function to forget password
const forgetPassword = asyncHandler(async (req, res) => {
    const { email, dob, answer, password } = req.body;
    const fieldValidation = validateFields({ email, dob, answer, password });
    if (!fieldValidation.isValid) {
        return res.status(400).json({ message: fieldValidation.message });
    }
    const user = await findUserByEmail(email);
    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid Credentials or User Not Active!" });
    }
    if (user.dateOfBirth !== dob || btoa(answer.toLowerCase()) !== user.answer) {
        return res.status(401).json({ message: "Invalid Credentials!" });
    }
    user.password = await hashPassword(password);
    await user.save();
    res.status(200).json({ message: "Password Changed Successfully!!" });
});


const resetPassword = asyncHandler(async (req, res) => {
    const user = await findUserById(req.body.id);
    user.password = await hashPassword(user.email);
    await user.save();
    res.status(200).json({ message: "Password Reset Successfully!!" });
});


const changeActiveState = asyncHandler(async (req, res) => {
    const user = await findUserById(req.body.id);
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ message: "User Active State Changed Successfully!!" });
});


const getAllUsers = asyncHandler(async (req, res) => {
    const users = await Users.find();
    res.status(200).json({ users });
});


// exporting functions
module.exports = {
    userLogin,
    userRegister,
    forgetPassword,
    resetPassword,
    changeActiveState,
    getAllUsers,
};
