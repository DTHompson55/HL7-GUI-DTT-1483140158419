/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// get the soap extensions
var soap = require("soap");

// get the fileupload capabilities
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

var fs = require('fs');

//create a new express server
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


var HL7Data = {
		ReqType: "XXX",
		ReqBody: "YYY",
		FileName: "ZZZ",
		HL7: "data"
}

//---------------------------------------------------------------------
app.post('/api/fetchHL7', function(req, res) {
	
	console.log(process.cwd()+ " " + 'HL7s/'+req.body.FileName);
	
	fs.open('HL7s/'+req.body.FileName, 'r', (err, fd) => {
		  if (err) {
		    if (err.code === "ENOENT") {
		        HL7Data.HL7 = 'HL7s/'+req.body.FileName + ' does not exist';		        
		        res.send(HL7Data);
		    	console.error('HL7s/'+req.body.FileName + ' does not exist');
		      return;
		    } else {
		      throw err;
		    }
		  }
		  fs.fstat(fd, function(err, stats) {
		        var bufferSize=stats.size,
		            chunkSize=512,
		            buffer=new Buffer(bufferSize),
		            bytesRead = 0;

		        while (bytesRead < bufferSize) {
		            if ((bytesRead + chunkSize) > bufferSize) {
		                chunkSize = (bufferSize - bytesRead);
		            }
		            fs.read(fd, buffer, bytesRead, chunkSize, bytesRead);
		            bytesRead += chunkSize;
		        }
		        
		        console.log(buffer.toString('utf8', 0, bufferSize)); // seems to be a timing problem....
		        HL7Data.HL7 = buffer.toString('utf8', 0, bufferSize);
		        
		        res.send(HL7Data);
		        console.log("Sent HL7");
		        fs.close(fd);
		  });
	});	 
});

//---------------------------------------------------------------------
app.post('/api/saveHL7', function(req, res) {
	res.send('HL7 Saved');
});

//------------

app.post('/api/uploadHL7', upload.single('HL7FileUpload')
		, function (req, res, next) {
  // req.body contains the text fields
	console.log(req.file);
	res.send(HL7Data);
});

//----------------------------------------------------------------------
app.post('/api/sendHL7', function(req, res, next) {
  
//  console.log("Received HL7 from WebApp: "+JSON.stringify(req.body));
  
//	console.log('params: ' + JSON.stringify(req.params));
//	console.log('body: ' + JSON.stringify(req.body));
//	console.log('query: ' + JSON.stringify(req.query));
	
//	console.log("ReqType = "+req.body.ReqType);
//	console.log("ReqBody = "+req.body.ReqBody);
  
	var url = "http://rcodm1.bpm4business.com:7800/QuestHL7Req?WSDL";
	var args = {ReqType: req.body.ReqType, ReqBody: "<![CDATA["+req.body.ReqBody+"]]>"}

//    console.log("Args are:"+JSON.stringify(args));

	soap.createClient(url, function(err, client) {
	       client.NewOperation(args, function(err, result) {
//	    	          console.log(result);
	    	          var jsonResp = JSON.stringify({title: req.body.ReqType, html: result.RespBody});
//	    	          console.log(jsonResp);
	    	      	  res.send(jsonResp);	    	          
	       });
	   });
});

var sendHL7 = function(reqType, reqBody){console.log("Called the Function Properly");} 


