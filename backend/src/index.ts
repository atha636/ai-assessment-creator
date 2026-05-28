import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";

import { connectDB }
from "./config/db";

import { initSocket }
from "./sockets/socket";

import assignmentRoutes
from "./routes/assignment.routes";

import "./jobs/worker";

const app=express();

app.use(

cors({

origin: [

"http://localhost:3000",

process.env.CLIENT_URL || ""

],

credentials: true

})

);

app.use(express.json());

app.use(
"/api/assignments",
assignmentRoutes
);

connectDB();

const server=
http.createServer(app);

initSocket(server);

const PORT =
process.env.PORT || 5000;

server.listen(
PORT,
()=>{

console.log(
`Server Running on ${PORT}`
);

}
);