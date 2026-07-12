const {getUser} = require("../services/auth")

async function loginCheck(req,res,next)
{
    const token = req.cookies?.uid;
    const user = getuser(token);
    if(!user)
    {
        return res.redirect("//login")
    }
    req.user = user;
    next();
}

function viewOnlyBy(roles=[])
{
    return function (req,res,next)
    {
        if(!req.user) 
        {
            return res.redirect("//login");
        }
        
        if(!roles.includes(req.user.role))
        {
            return res.status(403).send("Unauthorized");
        }

        next();
    }
}

module.exports = {loginCheck,viewOnlyBy}