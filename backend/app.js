require("dotenv").config();
const express = require("express")

const apiAuthRouter = require("./routes/apiAuth")
const apiAlertRouter = require("./routes/apiAlert")
const apiAssignmentRouter = require("./routes/apiAssignment")
const apiHotspotRouter = require("./routes/apiHotspot")
const apiNotificationRouter = require("./routes/apiNotification")

const app = express()

app.get("/",(req,res)=>{
    return res.end("Hello from Server")
})

app.route("/api/auth",apiAuthRouter)
app.route("/api/alert",apiAlertRouter)
app.route("/api/assignment",apiAssignmentRouter)
app.route("/api/hotspot",apiHotspotRouter)
app.route("/api/notification",apiNotificationRouter)

module.exports = app