import 'dotenv/config'
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
import {Strategy as GoogleStrategy} from "passport-google-oauth20"
import findOrCreate from 'mongoose-findorcreate';

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
    password: String,
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// const secret="Thisismysecret";
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User=new mongoose.model("User", userSchema); 

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://secrets-hzrm.vercel.app/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) =>{
    res.render("home.ejs");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get('/register', (req, res) =>{
    res.render("register.ejs");
})

app.get('/login', (req, res) =>{
    res.render("login.ejs");
})

app.get('/secrets', async (req, res) =>{
    const foundUser=await User.find({secret: {$ne: null}});
    res.render("secrets.ejs", {userWithSecrets: foundUser})
})

app.get('/submit', (req, res) =>{
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    } else{
        res.redirect('/login');
    }
})

app.post('/submit', async (req, res) =>{
    const foundUser=await User.findById(req.user.id);
    if(foundUser){
        foundUser.secret= req.body.secret;
        await foundUser.save();
        res.redirect('/secrets');
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

app.listen(process.env.PORT || port, () =>{
    console.log(`Server listening on port ${port}`);
})