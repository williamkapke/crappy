var testing = process.env.NODE_ENV==='test';

var cfg = module.exports = {
  root: __dirname,

  apis: {
    user: {
      controllers: {
        get user() { return cfg.controllers.user; }
      },
      middleware: {
        get allow() { return cfg.middleware.allow; }
      },
      resources: {
        get http() { return cfg.resources.http; }
      }
    }
  },

  middleware: {
    allow: {
      controllers: {
        get user() { return cfg.controllers.user; }
      }
    }
  },

  //business logic
  controllers: {
    emailer: {
      resources: {
        get emailer() { return cfg.resources.emailer; }
      }
    },
    user: {
      controllers: {
        get emailer() { return cfg.controllers.emailer; }
      },
      providers: {
        get user() { return cfg.providers.user; }
      }
    }
  },

  //a facade in front of 1 or more resources
  providers: {
    user: {
      resources: {
        get tokens() { return cfg.resources.tokens; },
        get users() { return cfg.resources.users; }
      }
    }
  },

  //raw data access
  resources: {
    http: {
      source: testing? './resources/mock-http.js' : './resources/restify.js'
    },
    tokens: {
      settings:{ host:"tokens", port:6379 },
      source: 'crap-mocks?redis'
    },
    users: {
      settings:{
        //persist:testing?'mongo.js':undefined,
        setup:'mongo_setup.js',
        max_delay:10
      },
      source: 'crap-mocks?mongo#users'
    },
    emailer: {
      source: './resources/mock-emailer.js'
      //source: testing? './resources/mock-emailer.js' : './resources/sendgrid.js'
    }
  }
};

