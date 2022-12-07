const https = require('https');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');
const OTP_LENGTH = 10;
const otpGenerator = require('otp-generator');
var path = require("path");
const { verify } = require('crypto');
const { nextTick } = require('process');
const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
require("dotenv").config();

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};

//Database info
const connection = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
  password: '327P@ssw0rd!!!D@wg',
	database: 'website'
});

//Connect to database
connection.connect(function(err){
  if (err){
    console.log('error' + err.message);
  }
  else{
    console.log("Connected to database");
  }
});

// for sending emails
let transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

//Session stuff
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

//Sign in new user
app.post('/auth', function(req, res){
  username = req.body.username;
  password = req.body.password;
  if(username && password){
    connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields){
      if(error){
        console.log('error' + error.message);
        res.send('Something went wrong');
      }else if(results.length > 0){
        connection.query('SELECT password FROM users WHERE username = ?', [username], function(error, results, feilds){
          bcrypt.compare(password, results[0]['password'], function(error, results){
            if(error){
              console.log(error.message);
              res.send('Something went wrong');
            }
            else if(results){
              req.session.username = username;
              res.redirect('/2FA');
            }
            else{
              res.send('Incorrect Password');
            }
          });
        });
      }else{
        res.send('Incorrect username');
      }    
    });
  }else{
    res.send('Input username and password');
  }
});

//Register a new user
app.post('/reg', function(req, res){
  username = req.body.username;
  password = req.body.password;
  confirm_password = req.body.confirm_password;
  email = req.body.email;
  confirm_email = req.body.confirm_email;
  if(username && password && email && confirm_email && confirm_password){
    connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields){
      if(error){
        console.log('error' + error.message);
        res.send('Something went wrong');
      } else if(results.length > 0){
        res.send('username is taken');
      } else{
        if (email != confirm_email){
          res.send('emails must match');
        }else if(password != confirm_password){
          res.send('passwords must match');
        } else if((password.length < 8) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !specialChars.test(password)){
          res.send('Password must contain an uppercase letter, a number, a special character, and must be longer than 8 characters');
        } else{
          bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err){
              res.send('something went wrong');
            }
            bcrypt.hash(password, salt, function(err, hash) {
              if (err){
                res.send('something went wrong');
              }
              connection.query('INSERT INTO users (username, password, email) VALUES(?, ?, ?)',[username, hash, email], function(error, results, fields){
                if(error){
                  res.send('Something went wrong');
                }else{
                  req.session.loggedin = true;
                  req.session.username = username;
                  res.redirect('/menu');
                }
              });
            });
          });
        }
      }
    });
  }
});

// Send 2FA OTP
app.use('/send-otp', function(req, res, next){
  console.log('send otp');
  if(req.session.username == null){
    res.redirect('/login');
  }
  connection.query('SELECT email FROM users WHERE username = ?', [req.session.username], function(error, results, fields){
    if(error){
      console.log('error' + error.message);
      res.send('Something went wrong');
    } else if (results != null){
      req.session.otp = otpGenerator.generate(OTP_LENGTH, {upperCaseAlphabets: false, specialChars:false});
      mailOptions = {
        from: 'anya.r.castillo@gmail.com', // Sender address
        to: results[0]['email'], // List of recipients
        subject: 'Requested One Time Code', // Subject line
        text: 'Here is the one time code you requested: ' + req.session.otp, // Plain text body
      };
      new Promise(function(resolve, reject){
        transport.sendMail(mailOptions, function(error, info){
          if(error){
            reject(error);
          } else {
            console.log(info);
            resolve(data);
          }
        });
      }).then((success) => res.send(success)).catch((error) => {
        console.log(error);
        res.status(500).send();
      });
      res.status(204).send();
    }
    else{
      console.log("Couldn't find email");
      res.send("Couldn't find email");
    }
  });
  
});

//Verify 2FA
app.post('/verify', function(req, res){
  otp = req.body.token;
  if(otp == req.session.otp){
    req.session.loggedin = true;
    res.redirect('/menu');
  }
  else{
    res.send('code is incorrect');
  }
});

//Change Password
app.post('/password-change', function(req, res){
  if(req.session.username == null){
    res.redirect('/login');
  }
  cur_pass = req.body.cur_pass;
  pass = req.body.pass;
  confirm_pass = req.body.confirm_pass;
  if(pass != confirm_pass){
    res.send('Passwords must match');
  }
  else{
    connection.query('SELECT password FROM users WHERE username = ?', [req.session.username], function(error, results, fields){
      if(error){
        console.log('Error' + error.message);
      }
      else if(results.length > 0){
        bcrypt.compare(cur_pass, results[0]['password'], function(error, results){
          if(error){
            console.log(error.message);
            res.send('Something went wrong');
          }
          else if(results){
            if((pass.length < 8) || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass) || !specialChars.test(pass)){
              res.send('Password must contain an uppercase letter, a number, a special character, and must be longer than 8 characters'); //Placeholder
            }else{
              bcrypt.genSalt(saltRounds, function(err, salt) {
                if(err){
                  res.send('something went wrong');
                }
                bcrypt.hash(pass, salt, function(err, hash) {
                  if(err){
                    res.send('something went wrong');
                  }
                  connection.query('UPDATE users SET password = ? WHERE username = ?',[hash, req.session.username], function(error, results, fields){
                    if(error){
                      res.send('something went wrong');
                    }
                    else{
                      console.log(results);
                      res.redirect('/menu');
                    }
                  });
                });
              });
            }
          }else{
            res.send('Incorrect Password');
          }
        });
      }
    });
  }
});

//Get ending and save to database
app.post('/ending', function(req, res){
  if(req.session.loggedin){
      bodyData = req.body;
      console.log(bodyData.num + ' ' + bodyData.name);
      connection.query('SELECT * FROM endings WHERE user = ?', [req.session.username], function(error, results, fields){
        if(error){
          res.send("Couldn't add ending");
        } else if(results.length > 0){
          if(bodyData.num == '10'){
            connection.query('UPDATE endings SET one = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '12'){
            connection.query('UPDATE endings SET two = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '22'){
            connection.query('UPDATE endings SET three = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '33'){
            connection.query('UPDATE endings SET four = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '34'){
            connection.query('UPDATE endings SET five = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '31'){
            connection.query('UPDATE endings SET six = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '32'){
            connection.query('UPDATE endings SET seven = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '30'){
            connection.query('UPDATE endings SET eight = ? WHERE user = ?',
            [bodyData.name, req.session.username], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else{
            console.log('Could not save ending');
          }
        } else{//User has no endings saved
          if(bodyData.num == '10'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, bodyData.name, null, null, null, null, null, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '12'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, bodyData.name, null, null, null, null, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '22'){//'INSERT INTO users (username, password, email) VALUES(?, ?, ?)',[username, hash, email]
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, null, bodyData.name, null, null, null, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
              console.log(results);
            });
          }else if(bodyData.num == '33'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, null, null, bodyData.name, null, null, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '34'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, null, null, null, bodyData.name, null, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '31'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, null, null, null, null, bodyData.name, null, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '32'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, null, null, null, null, null, bodyData.name, null], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else if(bodyData.num == '30'){
            connection.query('INSERT INTO endings (user,one,two,three,four,five,six,seven,eight) VALUES(?,?,?,?,?,?,?,?,?)',
            [req.session.username, null, bodyData.name, null, null, null, null, null, bodyData.name], function(error, results, fields){
              if(error){
                console.log(error.message);
              }
            });
          }else{
            console.log('Could not save ending');
          }
        }
        res.status(204).send();
      });
  }
  else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});

//Routers
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/login',function(req,res){
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/index',function(req,res){
  if(req.session.loggedin){
    res.sendFile(path.join(__dirname+'/index.html'));
  }else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});
app.get('/2FA', function(req, res){
  if(req.session.username == null && !req.session.loggedin){
    res.sendFile(path.join(__dirname+'/login.html'));
  }else{
    req.session.loggedin = true;
    res.sendFile(path.join(__dirname+'/2FA.html'));
  }
})
app.get('/menu',function(req,res){
  if(req.session.loggedin){
    res.sendFile(path.join(__dirname+'/menu.html'));
  }else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});
app.get('/game.js',function(req,res){
  if(req.session.loggedin){
    res.sendFile(path.join(__dirname+'/game.js'));
  }
  else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});
app.get('/style.css',function(req,res){
  res.sendFile(path.join(__dirname+'/style.css'));
});
app.get('/logout',function(req,res){
  req.session.loggedin = false;
  req.session.username = null;
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/signup',function(req,res){
  res.sendFile(path.join(__dirname+'/signup.html'));
});
app.get('/password',function(req, res){
  res.sendFile(path.join(__dirname+'/password.html'));
});
app.get('/view', function(req, res){
  if(req.session.loggedin){
    res.sendFile(path.join(__dirname+'/view.html'));
  }
  else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});
app.get('/getEnd', function(req, res){
  if(req.session.loggedin){
    connection.query('SELECT * FROM endings WHERE user = ?', [req.session.username], function(error, results, fields){
      if(error){
        console.log(error.message);
        res.send('Something went wrong');
      }
      else{
        console.log(results[0]);
        res.json(results[0]);
      }
    });
  }
  else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});

https.createServer(options,app).listen(8080, () =>{
  console.log("The server is listening to port 8080 with HTTPS enabled.");
});
