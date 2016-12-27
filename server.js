
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var mysql = require('mysql');

app.use(bodyParser.urlencoded({ extended: false }))

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
        res.send('seccess');
      }
      else {//로그인이 유효하지 않은 경우
        console.log('fail to login');
        res.send('fail');
        //res.redirect('/');
      }
    }
  });

  console.log(input_id, input_pw);
});

app.get('/',function(req, res) {
  fs.readFile('view_login/index.html', function(error,data){
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
