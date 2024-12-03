const jwt = require("jsonwebtoken");
const UserDB = require("../Models/UserDB.js");
const NoteDB = require("../Models/NoteDB.js");
const VaultDB = require("../Models/VaultDB.js");
const { decrypt } = require("../Service/Cipher.js");

const SecretKey = process.env.SECRET_KEY;


const AuthSession = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.slice(7);
        if (!token) {
            return res.status(401).json({ message: "Token is not provided or invalid" });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, SecretKey);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token has expired" });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: "Invalid token" });
            }
            throw error;
        }

        const user = await UserDB.findById(decoded?.id);
        if (!user) { return res.status(401).json({ message: "Unauthorized" }); }

        // req.user = user;
        req.currentUser = user._id;

        const key = req.body.key;
        if (key && !user.isUserNew) {
            const isValidKey = await validateKey(req.currentUser, key);
            if (!isValidKey) {
                return res.status(400).json({ message: "Invalid Key!" });
            }
        }
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// Helper function to validate the key
const validateKey = async (userID, key) => {
    const [prevVault, previousNote] = await Promise.all([
        VaultDB.findOne({ createdBy: userID }),
        NoteDB.findOne({ createdBy: userID }),
    ]);

    return (
        (prevVault && decryptSafely(prevVault.password, key)) ||
        (previousNote && decryptSafely(previousNote.content, key)) ||
        changeIsUserNew(userID)
    );
};

// Helper function to safely attempt decryption
const decryptSafely = (data, key) => {
    try {
        decrypt(data, key);
        return true;
    } catch {
        return false;
    }
};

// Helper function to change isUserNew status
const changeIsUserNew = async (userID) => {
    await UserDB.findByIdAndUpdate(userID, { isUserNew: true });
    return true;
}

module.exports = AuthSession;
