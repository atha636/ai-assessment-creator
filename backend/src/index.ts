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

app.use(cors());

app.use(express.json());

app.use(
"/api/assignments",
assignmentRoutes
);

connectDB();

const server=
http.createServer(app);

initSocket(server);

server.listen(

5000,

()=>{

console.log(
"Server Running"
);

}

);