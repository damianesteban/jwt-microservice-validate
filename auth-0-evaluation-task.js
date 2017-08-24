var express    = require('express');
var Webtask    = require('webtask-tools');
var bodyParser = require('body-parser');
var base64_url_decode = require('base64-decode');
var crypto = require('crypto');

// express settings
var app = express();
app.use(bodyParser.json());

const SECRET = 'auth0';

//token manager module
var tokenManager = {
  //validate token format
  validateTokenFormat: function(token){
    //check token exist
    if (!token) {
      throw new Error('Token not found');
    }
    // check segments
    var segments = token.split('.');
    if (segments.length !== 3) {
      throw new Error('Not enough or too many segments');
    }
    return true;
  },
  //validate token signature
  validateSignature: function(token){
      var segments = token.split('.');
      // base64 decode and parse JSON
      var header = JSON.parse(base64urlDecode(segments[0]));
      var payload = JSON.parse(base64urlDecode(segments[1]));
      
      //singature should be the same
      var signature = segments[2];
      
      // verify signature. `sign` will return base64 string.
      var signingInput = [headerSeg, payloadSeg].join('.');
      if (!verify(signingInput, key, signingMethod, signingType, signatureSeg)) {
        throw new Error('Signature verification failed');
      }
      
  },
  //read the token contents head & payload 
  resolveToken : function(token){
    //get segements
    var segments = token.split('.');
    //decode segments from base64 to readable format
    var header = JSON.parse(base64_url_decode(segments[0]));
    var payload = JSON.parse(base64_url_decode(segments[1]));
    var jwt = 
    {
      header : header,
      payload : payload
    };
    
    return jwt;
  }
};


app.get('/', function (req, res) {
  var token = req.query.token;
  if(!token)
  {
      res.send("Please include a JWT token in \"token\" query string!");
  }
  //resolve token
  var jwt = tokenManager.resolveToken(token);
  res.send(jwt);
});

module.exports = Webtask.fromExpress(app);
