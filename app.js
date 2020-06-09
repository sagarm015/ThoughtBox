const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({ //settin up are session
  secret: 'hoohohohoh',
  resave: false,
  saveUninitialized: true,
  //   cookie: { secure: true }
}));
app.use(passport.initialize()); //use pass port and intialize
app.use(passport.session()); //setting up passport for authentication in the session

mongoose.connect("mongodb+srv://admin-sagar:testing4321@cluster0-yhcmp.mongodb.net/thoughtboxDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true); // handle warning
const userSchema= new mongoose.Schema({
  fname: String,
  lname: String,
  username: String,
  password: String,
  thts:[]
});
userSchema.plugin(passportLocalMongoose); //hash salt password and mongodb storage
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy()); //helps create strategy
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/",function(req,res){
  res.render("home");
});

app.get("/about",function(req,res){
  res.render("about");
});

app.get("/contact",function(req,res){
  res.render("contact");
});

app.get("/register",function(req,res){
  res.render("register");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/thoughts",function(req,res){
  if (req.isAuthenticated()) { //checking if the request is authenticated or not - hence if the logged in session is not set up either thru login ot register command we will not render secrets

    User.find({"thts": {$ne: null}}, function(err,foundusers){
      if(err){
        console.log(err);
      }
      else{
        res.render("thoughts",{us: foundusers});
      }
    });
  } else {
    res.redirect("/login");
  }

});
app.get("/create",function(req,res){
  res.render("create");
});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
app.get("/profile/:i",function(req,res){
  User.findById(req.params.i, function(err,result){
    res.render("profile",{user: result});
  });
});
app.get("/self",function(req,res){
  User.findById(req.user.id, function(err,result){
    res.render("profile",{user: result});
  });
});
app.post("/register",function(req,res){
  User.register({
    username: req.body.username,
    lname: req.body.lname,
    fname: req.body.fname
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() { //Req is for requesting the cookies saved on client's browser res is for setting cookies to the client's browser
        res.redirect("/thoughts"); //making our user authenticated and setting logged in session for them
      }); //logged in session has great importance in this concept
    }
  });
});
app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
req.login(user,function(err){
  if(err){
    res.redirect("/login");
  }
  else{

    passport.authenticate("local")(req, res, function() { //Req is for requesting the cookies saved on client's browser res is for setting cookies to the client's browser
      res.redirect("/thoughts"); //making our user authenticated and setting logged in session for them
    });
  }
});

});

app.post("/create",function(req,res){
  const tht = req.body.thought;
  User.findById(req.user.id, function(err,userfound){
    if(err){
      console.log(err);
    }
    else{
      userfound.thts.push(tht);
      userfound.save(function(){
        res.redirect("/thoughts");
      });
    }
  });
});

app.listen(process.env.PORT, function() {
  console.log(" hello server started at port 3000");
});
