import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


app.use(cors( {
  // cors_origin is for which link it will allow
  origin: process.env.CORS_ORIGIN,
  // about authentication.
  credentials: true
}))

// for json limit
app.use(express.json({limit: "16kb"}))
// for url encoded data
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// for public folder
app.use(express.static("public"))
// cookie parser use
app.use(cookieParser())

// import router from routes
import router from "./routes/user.routes.js"

app.use('/api/v1/users', router)

export { app }