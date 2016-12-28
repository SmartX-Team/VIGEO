
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var engines = require('consolidate');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'));
app.engine('html', engines.mustache);
app.set('view engine', 'html');

var dbConnection = mysql.createConnection({
    host    :'localhost',
    port : 3306,
    user : 'root',
    password : 'inno1029#',
    database:'member'
});

dbConnection.connect(function(err){
 if(!err) {
    console.log("Database is connected ... \n\n");
  }
 else {
    console.log("Error connecting database ... \n\n");
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.post('/register', function(req, res) {
  var input_id = req.body.user_id;
  var input_pw = req.body.user_pw;
  var input_name = req.body.user_name;
  var input_email = req.body.user_email;

  console.log(input_id, input_pw, input_name, input_email);
  dbConnection.query('INSERT INTO member_info(`user_id`, `user_password`, `user_name`, `user_email`) VALUES (?, ?, ?, ?)',
  [input_id,input_pw,input_name,input_email], function(err,rows){
    if(err){ //질의에 오류 발생
      console.log('DB error');
      console.log(err);
    }
    else{
      console.log('register success');
      res.send('<script>alert("가입 되었습니다");location.href="/";</script>');
    }
  });
});

app.post('/', function(req, res) {
  var input_id = req.body.user_id;
  var input_pw = req.body.user_pw;

  dbConnection.query('SELECT count(*) AS cnt from member_info where user_id = ? and user_password = ?',
  [input_id,input_pw], function(err,rows){
    if(err){ //질의에 오류 발생
      console.log('DB error');
      console.log(err);
    }
    else{
      var cnt = rows[0].cnt;

      if(cnt == 1){//로그인이 유효한 경우
        console.log('login succes');
        res.send('<script>alert("로그인 되었습니다");</script>');
      }
      else {//로그인이 유효하지 않은 경우
        console.log('fail to login');
        res.send('<script>alert("로그인 실패");history.back(); </script>');
      }
    }
  });
  console.log(input_id, input_pw);
});

app.get('/',function(req, res) {
  res.render('view_login/index.html', function(error,data){
    if(error){
      console.log(error);
    }
    else{
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(data);
    }
  });
});

app.get('/register',function(req, res) {
  res.render('view_login/view_register.html', function(error,data){
    if(error){
      console.log(error);
    }
    else{
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(data);
    }
  });
});
console.log('Server running');
