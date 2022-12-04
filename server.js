const https = require('https');
const fs = require('fs');
const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
var path = require("path");

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
              res.send('Something went wrong');//Placeholder
            }
            else if(results){
              req.session.loggedin = true;
              req.session.username = username;
              res.redirect('/menu.html');
            }
            else{
              res.send('Incorrect Password');//Placeholder
            }
          });
        });
      }else{
        res.send('Incorrect username');//Placeholder
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
        res.send('username is taken');//Placeholder
      } else{
        if (email != confirm_email){
          res.send('emails must match');//Placeholder
        }else if(password != confirm_password){
          res.send('passwords must match');
        }else{
          bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
              connection.query('INSERT INTO users (username, password, email) VALUES(?, ?, ?)',[username, hash, email], function(error, results, fields){
                if(error){
                  res.send('Something went wrong');
                }else{
                  req.session.loggedin = true;
                  req.session.username = username;
                  res.redirect('/menu.html');
                }
              });
            });
          });
        }
      }
    });
  }
});

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/login.html',function(req,res){
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/index.html',function(req,res){
  if(req.session.loggedin){
    res.sendFile(path.join(__dirname+'/index.html'));
  }else{
    res.sendFile(path.join(__dirname+'/login.html'));
  }
});
app.get('/menu.html',function(req,res){
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
app.get('/logout.html',function(req,res){
  req.session.loggedin = false;
  res.sendFile(path.join(__dirname+'/login.html'));
});
app.get('/signup.html',function(req,res){
  res.sendFile(path.join(__dirname+'/signup.html'));
});

https.createServer(options,app).listen(8080, () =>{
  console.log("The server is listening to port 8080 with HTTPS enabled.");
});
