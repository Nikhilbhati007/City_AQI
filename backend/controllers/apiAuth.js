const User = require("../models/user");
const {setUser} = require("../services/auth")


async function AuthorityRegister(req, res) {
    try {
        const { name, email, password, role, city, phone } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            city,
            phone,
        });

        return res.status(201).json({
            message: "Authority Registered Successfully",
            user,
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

async function AuthorityLogin(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Invalid Password",
            });
        }

        const token = setUser(user);
        return res.cookie("uid",token);

        return res.redirect("//dashboard page")
        
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

async function AuthorityLogout(req, res) {
    res.clearCookie("uid");
    return res.redirect("//home page of city aqi");
}

async function AuthorityProfile(req, res) {
    return res.redirect("//admin profile page")
}



module.exports = {
    AuthorityLogin,
    AuthorityRegister,
    AuthorityLogout,
    AuthorityProfile
}
