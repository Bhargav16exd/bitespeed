import express, { NextFunction, Request } from 'express'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';
import { Identify } from './controllers/product.controller';

dotenv.config();
const PORT = process.env.PORT ;

// Initialize the express app
const app = express();

// Initialize the Prisma client
const prisma = new PrismaClient();


app.use(express.json());
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})

// Gets the request and forward it to the Identify function of controller
app.post('/identify',Identify)






export default app;
export {
    prisma
}