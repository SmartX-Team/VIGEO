var express = require('express');
var app = express();
var fs = require('fs'); //file system 사용을 위한 모듈
var bodyParser = require('body-parser');
var mysql = require('mysql'); //mysql과의 연결을 위한 모듈
var engines = require('consolidate');
var path = require('path'); //파일 경로 표현을 위한 모듈
var nodemailer = require('nodemailer'); //메일 전송을 위한 모듈
var validator = require('validator'); //입력 형식 검사를 위한 모듈
var async = require('async'); //비동기 처리를 위한 모듈

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'semantic')));
app.use(express.static(path.join(__dirname, 'src')));
app.engine('html', engines.mustache);
app.set('view engine', 'html');

var transporter = nodemailer.createTransport('smtps://mail.varifier2@gmail.com:rnjsrnjs@smtp.gmail.com');
var rand, host, link, mailOptions;

//DB 접속 정보를 저장
var dbConnection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'inno1029#',
    database: 'member'
});

dbConnection.connect(function(err) {
    if (!err) {
        console.log("Database is connected ... \n\n");
    } else {
        console.log("Error connecting database ... \n\n");
    }
});

//3000번 포트의 응답을 처리하도록 설정
app.listen(3000, function() {
    console.log('Sever listening on port 3000!');
});
console.log('Server running');


//사이트 접속시 index page 라우팅
app.get('/', function(req, res) {
    res.render('view_login/index.html', function(error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        }
    });
});

app.get('/map', function(req, res) {
    res.render('view_map/view_map.html', function(error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        }
    });
});

//사용자가 로그인 정보 입력 후 post시 라우팅
app.post('/', function(req, res) {
    loginProcess(req, res);
});


//사용자 메일 인증 page 라우팅 (인증할 메일을 입력할 수 있는 page)
app.get('/verification', function(req, res) {
    res.render('view_login/view_mailverify.html', function(error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        }
    });
});

//전송된 Verification Mail의 링크를 클릭했을 때 인증 수행을 위한 라우팅
app.get('/verify', function(req, res) {
    verifyMail(req, res);
});


//회원가입을 위한 register page 라우팅
app.get('/register', function(req, res) {
    res.render('view_login/view_register.html', function(error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        }
    });
});

//Verification Mail 전송을 위한 라우팅
app.get('/send', function(req, res) {
    sendVerificationMail(req, res);
});

//회원가입 화면에 입력된
app.post('/register', function(req, res) {
    registerMember(req, res);
});

//사용자의 이메일 인증요청을 처리하는 함수
var verifyMail = function verifyMail(req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    console.log(req.query.email);
    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) //domain이 일치하지 않는 경우
    {
        console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) //rand 숫자(코드)가 일치하는 경우
        {
            var input_id = req.query.email;
            //DB에 인증된 계정임을 표기
            dbConnection.query('UPDATE member_info SET user_isverified=1 WHERE user_id= ?', [input_id], function(err, rows) {
                if (err) { //질의에 오류 발생
                    console.log('DB error');
                    console.log(err);
                    console.log('다시 시도해 주세요');
                } else {
                    console.log("email is verified");
                    res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
                }
            });
        } else //이메일 인증에 실패한 경우(rand값을 맞추지 못함)
        {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    } else {
        res.end("<h1>Request is from unknown source");
    }
}

//인증 메일을 보내는 동작을 위한 함수
var sendVerificationMail = function sendVerificationMail(req, res) {
    rand = Math.floor((Math.random() * 100) + 54);
    host = req.get('host');

    //인증을 위한 link를
    link = "http://" + req.get('host') + "/verify?id=" + rand + "&email=" + req.query.to;
    var msg = 'Hello,<br> Please Click on the link to verify your email.<br>';
    var link_tag = '<a href="' + link + '">Click here to verify </a>';

    //전송할 메일의 정보 설정
    mailOptions = {
        from: 'Please do not send a reply', // 송신자 주소 설정
        to: req.query.to, // 수신자를 설정
        subject: 'Please confirm your Email account', //메일 제목
        text: 'Hello', // plaintext body
        html: msg + link_tag // html body
    };

    //설정된 메일 전송
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            res.end("error"); //메일 전송에 실패하는 경우
        } else {
            console.log("Message sent: " + res.message); //메일 전송 성공시
            res.end("sent");
        }
    });
};

//로그인을 위한 동작을 수행하는 함수
var loginProcess = function loginProcess(req, res) {
    var input_id = req.body.user_id;
    var input_pw = req.body.user_pw;

    //함수의 동작이 순차적으로 이루어질 수 있도록 callback 함수를 정의한다.
    var tasks = [
        //질의 1 : 로그인이 유효한지 질의
        function(callback) {
            dbConnection.query('SELECT count(*) AS cnt from member_info where user_id = ? and user_password = password(?)', [input_id, input_pw], function(err, rows) {
                if (err) { //질의에 오류 발생
                    console.log(err)
                    callback('DB error', 'fail');
                } else {
                    var cnt = rows[0].cnt;
                    console.log(cnt);
                    if (cnt == 1) {
                      callback(null, 'first done');
                    }
                    else{
                      callback(new Error('failToLogin'), 'fail');
                    }
                }
            });
        },
        //질의 2: 메일인증이 완료된 id인지 질의
        function(callback) {
            dbConnection.query('SELECT user_isverified AS isVerified from member_info where user_id = ?', [input_id], function(err, result) {
                if (err) { //질의에 오류 발생
                    console.log(err);
                    callback('DB error', 'fail');
                }
                else {
                    var isVerified = result[0].isVerified;
                    console.log(isVerified);
                    if (isVerified == 1) { //인증이 완료 된 이메일인 경우
                      console.log('로그인 성공');
                      res.send('<script>alert("로그인 되었습니다");location.href="/map";</script>');
                    }
                    else { //인증이 완료되지 않은 이메일인 경우
                      callback(new Error('needEmailVerification'), 'fail');
                    }
                }
            });
        }
    ];

    async.series(tasks, function(err, results) {
        if (err.message == 'failToLogin') {
            console.log(err);
            res.send('<script>alert("아이디와 비밀번호를 확인하세요");history.back(); </script>');
        }
        if (err.message == 'needEmailVerification') {
            console.log(err);
            res.send('<script>alert("이메일 인증이 필요합니다");location.href="/verification"; </script>');
        }
    });

    console.log(input_id, input_pw);
};


//회원가입 과정을 수행하는 함수
var registerMember = function registerMember(req, res) {
    var input_id = req.body.user_id; //form에 입력된 아이디, 비밀번호, 이름을 가져온다
    var input_pw = req.body.user_pw;
    var input_name = req.body.user_name;

    //함수의 동작이 순차적으로 이루어질 수 있도록 callback 함수를 정의한다.
    //(async synchronize 사용)
    var tasks = [

        function(callback) {
            if (!validator.isEmail(input_id)) { //id가 이메일 형식이 아닌경우
                callback(new Error('invalidIDForm'), 'fail');
            }
            else{
              callback(null, 'first done');
            }
        },

        function(callback) { //첫번째 질의 : 이미 가입된 Email인지 여부를 질의한다.
            dbConnection.query('SELECT count(*) AS cnt from member_info where user_id = ?', [input_id], function(err, rows) {
                if (err) { //질의에 오류 발생
                    console.log('DB error');
                    console.log(err);
                }
                else {
                    var cnt = rows[0].cnt; //질의 결과를 저장
                    if (cnt == 1) { //이미 가입된 동일 아이디가 존재하는 경우

                        callback(new Error('duplicatedID'), 'fail'); //예외 callback수행
                    }
                    else {
                      callback(null, 'second done');
                    }

                }
            });
        },

        function(callback) { //두번째 질의 : 회원정보를 DB에 Insert한다.
            dbConnection.query('INSERT INTO member_info(`user_id`, `user_password`, `user_name`) VALUES (?, password(?), ?)', [input_id, input_pw, input_name], function(err, rows) {
                if (err) { //insert 실패시
                    console.log('DB error2');
                    console.log(err);
                } else {
                    console.log('register success'); //DB에 등록이 완료 됨.
                    res.send('<script>alert("가입 되었습니다");location.href="/";</script>');
                }
            });
        }
    ];

    //예외처리시 호출되는 callback
    async.series(tasks, function(err, results) {
      console.log(results);

      if (err.message == 'invalidIDForm') {
          console.log(err.message);
          res.send('<script>alert("잘못된 형식의 이메일입니다");history.back(); </script>');
      }
      if (err.message == 'duplicatedID') {
          console.log(err.message);
          res.send('<script>alert("이미 가입된 이메일입니다");history.back(); </script>');
      }
    });
};


//callback 함수 제어 연습 코드
/*
var registerMember = function registerMember(req, res){
  async.waterfall(
    [
      function(callback){
        var input_id = req.body.user_id;
        var input_pw = req.body.user_pw;
        var input_name = req.body.user_name;

        if(!validator.isEmail(input_id)){//이메일 형식 검사
          res.send('<script>alert("잘못된 형식의 이메일입니다");history.back(); </script>');
        }

        callback(null, req, res, input_id, input_pw, input_name);
      },
      function(req, res, input_id, input_pw, input_name, callback) {
        dbConnection.query('SELECT count(*) AS cnt from member_info where user_id = ?',
        [input_id], function(err,rows){
          if(err){ //질의에 오류 발생
            console.log('DB error');
            console.log(err);
            callback("DBError", req, res);
          }
          else{
            var cnt = rows[0].cnt;
            if(cnt == 1){//아이디가 존재하는 경우
              res.send('<script>alert("이미 가입된 이메일입니다");history.back(); </script>');
              callback("DuplicatedID", req, res);
            }
          }
        });
        callback(null, req, res, input_id, input_pw, input_name);
      },
      function(req, res, input_id, input_pw, input_name, callback){
        console.log(input_id, input_pw, input_name);
        dbConnection.query('INSERT INTO member_info(`user_id`, `user_password`, `user_name`) VALUES (?, password(?), ?)',
        [input_id,input_pw,input_name], function(err,rows){
          if(err){ //질의에 오류 발생
            console.log('DB error');
            console.log(err);

          }
          else{
            console.log('register success');
            res.send('<script>alert("가입 되었습니다");location.href="/";</script>');
          }
        });
        }
    ],
    function(err, req, res){
      console.log(err);
    }
  )
}
*/
