// import 'dotenv/config'
// import { configDotenv } from "dotenv";
// import encrypt from "mongoose-encryption";
import bodyParser from "body-parser";
import express from "express"
// import md5 from "md5";
import mongoose from "mongoose"
import bcrypt from "bcrypt"

const app=express();
const port=3000;
const saltRounds=10;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema= new mongoose.Schema({
    email: String,
    password: String
})

// const secret="Thisismysecret";
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User=new mongoose.model("User", userSchema); 

app.get('/', (req, res) =>{
    res.render("home.ejs");
})

app.get('/register', (req, res) =>{
    res.render("register.ejs");
})

app.get('/login', (req, res) =>{
    res.render("login.ejs");
})


app.post('/register', (req, res) =>{
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) =>{
        const newUser=new User({
            email: req.body.username,
            password: hash
        })

        try {
            await newUser.save();
            res.render("secrets.ejs");
          } catch (err) {
            console.log(err);
          }
    })
    
})

app.post('/login', async (req, res) =>{
    try{
        const found = await User.findOne({"email": req.body.username});
        bcrypt.compare(req.body.password, found.password, (err, result) =>{
            if(result){
                res.render("secrets.ejs");
            }
        })
    } catch (err){
        console.log(err);
    }
})

app.listen(port, () =>{
    console.log(`Server listening on port ${port}`);
})