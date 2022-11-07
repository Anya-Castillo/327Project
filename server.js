const https = require('https');
const fs = require('fs');
var url = require("url");

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};

https.createServer(options, function (request, response) {

  var pathname = url.parse(request.url).pathname;
  console.log("Request for " + pathname + " received.");

  response.writeHead(200);

  if(pathname == "/") {
      html = fs.readFileSync("index.html", "utf8");
      response.write(html);
  } else if (pathname == "/game.js") {
      script = fs.readFileSync("game.js", "utf8");
      response.write(script);
  } else if (pathname == "/style.css", "utf8"){
      style = fs.readFileSync("style.css", "utf8");
      response.write(style);
  }

  response.end();
}).listen(8080);

console.log("The server is listening to port 8080 with HTTPS enabled.");