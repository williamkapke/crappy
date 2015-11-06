
var http = require('http');
var end;

module.exports = {
  response: {
    __proto__: http.ServerResponse.prototype,
    validationError: function (errors) {
      this.statusMessage = "validation error";
      this.statusCode = 400;
      this.json(errors);
    },
    unauthorized: function (message) {
      this.writeHead(401, message || "unauthorized");
      this.end();
    },
    badRequest: function (message) {
      this.writeHead(400, message || "bad request");
      this.end();
    },
    forbidden: function () {
      this.send(403);
    },
    //throw away all arguments. use res.json() instead.
    get end() {
      var end = module.exports.response.__proto__.end.bind(this);
      return ()=>{ end(); };
    },
    error: function (map) {
      var res = this;

      function error(err) {
        res.log ? res.log.error(err) : console.error(err.stack);
        res.send(500);
      }

      if(map instanceof Error)
        return error(map);

      return err=>{
        var result = map[Object.keys(map).$find(k=>err.message.includes(k))];
        return !result? error(err) :
          typeof result === 'number'?
            res.send(result) :
            res.validationError(result);
      }
    },
    get json() {
      var res = this;
      return function(obj){
        //special getter for `mock-http`
        if(!arguments.length && res.getBuffer)
          return JSON.parse(res.getBuffer()||'""');

        var text = JSON.stringify(obj);
        if (!res.statusCode) res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', text.length);
        res.write(text);
        res.end();
      }
    },
    status: function(code){
      this.statusCode = code;
      return this;
    },
    send: function (code) {
      if(typeof code === 'number')
        return this.status(code).end();

      if(code instanceof Error) {
        if(code.statusCode)
          return this.send(code.statusCode);
        throw code;
      }

      throw new Error("This is a JSON API! Use res.json()");
    }
  }
};
