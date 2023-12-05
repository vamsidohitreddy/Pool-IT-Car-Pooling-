import express from "express";
import ejs from "ejs";
import path from "path";
import pg from 'pg';
import bodyParser from "body-parser";
import session from 'express-session';
import cookieParser from 'cookie-parser';


const app = express();
const port = 3000;
app.set('view engine', 'ejs')

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "carpooling",
    password: "####",
    port: 5432,
  });
  db.connect();

  app.use(
    session({
      secret: 'your_secret_key',
      resave: true,
      saveUninitialized: true,
    })
  );
  

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
//app.use('/css',express.static(__dirname+'public/css'));
const __dirname = path.resolve()
app.use(bodyParser.json());
app.use(cookieParser());

// Custom middleware to check user authentication
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.get('/', (req,res) =>{
    //const imagePath = 'https://img.freepik.com/free-vector/lightened-luxury-sedan-car-darkness-with-headlamps-rear-lights-lit-realistic-image-reflection_1284-28803.jpg?w=996&t=st=1701346107~exp=1701346707~hmac=af8053a5f420e9a27c88f37d3c45b7f585401ff64d3381ee6403d883846cec81';
    //res.render('yourFile', { imagePath });
    res.render("main");
});

app.get('/uploadride',(req,res) =>{
    //res.render("uploadride.ejs");
    res.render('uploadride.ejs', { successMessage: null });
});

app.get('/searchride',(req,res)=>{
    res.render("searchride.ejs",{ data: false });
});

app.post('/uploadride', async(req,res) =>{
    let fullname = req.body.fullName;
    let phonenumber = req.body.phoneNumber;
    let arrival = req.body.arrival;
    let destination = req.body.destination;
    let date = req.body.date;
    let email = req.body.email;
    //const success = document.getElementById('success');
    try{
        await db.query("insert into rides (fullname,phonenumber,arrival,destination,date,email) values ($1,$2,$3,$4,$5,$6)",[fullname,phonenumber,arrival,destination,date,email]);
        //success.style.display = 'block'
        //res.render("app.ejs",success.style.display = 'block');
        // res.send('<h1 style:"color: green, ">Form submitted successfully!</h1>');
        res.render('uploadride.ejs', { successMessage: 'Submitted successfully..!' });
    }
   catch(err){
    res.render('uploadride.ejs', { successMessage: 'Error occured please check all try one again' });
    console.log(err);
   }
});

app.post('/searchride', async(req,res) =>{
    let arrival = req.body.arrival;
    let destination = req.body.destination;
    let date = req.body.date;
    try {
        const result = await db.query(
          'SELECT fullname,phonenumber FROM rides WHERE arrival = $1 AND destination = $2 AND date = $3',
          [arrival, destination,date]
        );
    
        res.render('searchride', { data: result.rows });
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
});

app.get('/signup', async(req,res) =>{
  res.render('signup');
});

app.get('/login', async(req,res) =>{
  res.render('login');
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [
      username,
      password,
    ]);

    req.session.user = result.rows[0];
    res.redirect('/');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Error during signup');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [
      username,
      password,
    ]);

    if (result.rows.length > 0) {
      req.session.user = result.rows[0];
      res.redirect('/');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).send('Error during logout');
    } else {
      res.redirect('/');
    }
  });
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });