var express    = require('express');
var Webtask    = require('webtask-tools');
var bodyParser = require('body-parser');
var base64urlDecode = require('base64-decode');
var crypto = require('crypto');

// express settings
var app = express();
app.use(bodyParser.json());

//constants
const SECRET = 'auth0';
const ALG = 'sha256';

//token manager module
var tokenManager = {
  //validate token format
  validateTokenFormat: function(token){
    //check token exist
    if (!token) {
      //Token not found
      return false;
    }
    // check segments
    var segments = token.split('.');
    if (segments.length !== 3) {
      //Not enough or too many segments
      return false;
    }
    
    return true;
  },
  //validate token signature
  validateSignature: function(token){
      var segments = token.split('.');
      // base64 decode
      var header = base64urlDecode(segments[0]);
      var payload = base64urlDecode(segments[1]);
      
      //singature should be the same
      var signature = segments[2];
      
      // verify signature. `sign` will return base64 string.
      var signingInput = [header, payload].join('.');
      var hash = crypto.createHmac(ALG, SECRET).update(signingInput).digest('base64');
      return hash === signature;
  },
  //read the token contents head & payload 
  resolveToken : function(token){
    //get segements
    var segments = token.split('.');
    //decode segments from base64 to readable format
    var header = JSON.parse(base64urlDecode(segments[0]));
    var payload = JSON.parse(base64urlDecode(segments[1]));
    var jwt = {
      header : header,
      payload : payload
    };
    
    return jwt;
  }
};

//set the default route
app.get('/', function (req, res) {
  //get token value from query string
  var token = req.query.token;
  if(!token){
      res.send("Please include a JWT token in \"token\" query string!");
  }
  else if(!tokenManager.validateTokenFormat(token)){
      res.send("Invalid JWT format");
  }
  else if(!tokenManager.validateSignature(token)){
      res.send("Failed validate JWT signature");
  }
  else{
    //resolve token
    var jwt = tokenManager.resolveToken(token);
    res.send(jwt);
  }
  
});

module.exports = Webtask.fromExpress(app);
