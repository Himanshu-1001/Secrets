// import 'dotenv/config'
// import { configDotenv } from "dotenv";
// import encrypt from "mongoose-encryption";
import bodyParser from "body-parser";
import express from "express"
// import md5 from "md5";
import mongoose from "mongoose"
// import bcrypt from "bcrypt"
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose"

const app=express();
const port=3000;
const saltRounds=10;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "This is my secret.",
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema= new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose);
// const secret="Thisismysecret";
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User=new mongoose.model("User", userSchema); 

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', (req, res) =>{
    res.render("home.ejs");
})

app.get('/register', (req, res) =>{
    res.render("register.ejs");
})

app.get('/login', (req, res) =>{
    res.render("login.ejs");
})

app.get('/secrets', (req, res) =>{
    if(req.isAuthenticated()){
        res.render("secrets.ejs");
    } else{
        res.redirect('/login');
    }
})

app.get('/logout', (req, res) =>{
    req.logOut((err) =>{
        if(err){
            console.log(err);
        } else{
            res.redirect('/login');
        }
    });
    
})

app.post('/register', (req, res) =>{
    User.register({username: req.body.username}, req.body.password, (err, user) =>{
        if(err){
            console.log(err);
            res.redirect('/register');
        } else{
            passport.authenticate("local")(req, res, () =>{
                res.redirect('/secrets');
            })
        }
    })
    
})

app.post('/login', (req, res) =>{
    const newUser= new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(newUser, (err) =>{
        if(err){
            console.log(err);
            res.redirect('/login');

        } else{
            passport.authenticate("local")(req, res, () =>{
                res.redirect('/secrets');
            })
        }
    })


})

app.listen(port, () =>{
    console.log(`Server listening on port ${port}`);
})