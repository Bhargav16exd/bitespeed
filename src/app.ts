import express from 'express'
import dotenv from 'dotenv'

dotenv.config();


const app = express();

const PORT = process.env.PORT ;


app.use(express.json());
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})

app.use('/',(req,res)=>{
    res.send("Hello World")
})



export default app;