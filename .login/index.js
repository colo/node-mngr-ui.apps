'use strict'

var App = require('node-express-app'),
	path = require('path'),
	util = require('util');


module.exports = new Class({
  Extends: App,
  
  app: null,
  logger: null,
  authorization:null,
  authentication: null,
  
  //hidden: true,//don't show on views (nav_bar, content, etc)
  
  options: {
	  
	  layout:{
			name: 'Login',
			description: 'Login',
			menu : {
				available: false,
				icon: 'fa-cog'
			},
			content: {
				available: false,
			},
			
			hidden: true,
		},
		
		id: 'login',
		path: '/login',
		
		params: {
		},
		
		routes: {
			
			all: [
				{
				path: '',
				callbacks: ['render']
				},
			]
		},
		
		api: {
			
			path: '/api',
			
			version: '1.0.0',
			
			routes: {
				post: [
					{
					path: '',
					callbacks: ['login'],
					version: '',
					},
				],
				all: [
					{
					path: '',
					callbacks: ['doc'],
					version: '',
					},
				]
			},
			
		},
  },
  doc: function(req, res, next){
		res.json({doc: 'api doc'});
	},
  login: function(req, res, next){
		
		
		console.log('Login Request');
		console.log(req.headers);
		
		this.authenticate(req, res, next,  function(err, user, info) {
			
			this.profile('login_authenticate');
			
			if (err) {
				this.log('login', 'error', err);
				
				res.status(500).json({'error': err.message});
				//return next(err)
			}
			if (!user) {
				//console.log('info: ');
				//console.log(info);
				
				this.log('login', 'warn', 'login authenticate ' + info);
				
				res.cookie('bad', true, { maxAge: 99999999, httpOnly: false });
				
				//req.flash('error', info);
				//res.send({'status': 'error', 'error': info});
				res.status(403).json({'error': info.error});

			}
			else{
				req.logIn(user, function(err) {
					console.log('----err----');
					console.log(err);
					
					if (err) {
						this.log('login', 'error', err);
						//return next(err);
						res.status(403).json({'error': err.message});
					}
					else {
						this.log('login', 'info', 'login authenticate ' + util.inspect(user));
						
						////add subjects dinamically
				// 		this.server.authorization.processRules({
				// 		  "subjects":[
				// 			{
				// 			  "id": "lbueno",
				// 			  "roles":["admin"]
				// 			},
				// 			{
				// 			  "id": "test",
				// 			  "roles":["user"]
				// 			},
				// 		  ],
				// 		});
						res.cookie('bad', false, { maxAge: 0, httpOnly: false });
						
						//console.log(req.protocol);
						//console.log(req.hostname);
						res.status(201).links({ next: req.protocol+'://'+req.hostname+':8080/'}).json({'status': 'ok'});
					}
				}.bind(this));
			}
		}.bind(this));
	
		
  },
  render: function(req, res, next){
		
		if(req.isAuthenticated()){
			res.redirect('/');
		}
		else{
			
			var view = Object.clone(this.express().get('default_view'));
			
			view.title = "Login";
			view.base = "/login";
			view.body_class = "login";
			view.body_scripts = [
				"/public/js/index.js",
				"/public/apps/login/index.js",
			];
			
			view.body_script = [
				"var apps = "+JSON.stringify([{ id: 'login'}])+";",
			];
			
			view.css.push("https://colorlib.com/polygon/gentelella/css/animate.min.css");
			view.css.push("/public/apps/login/css/index.css");
			view.style = null;
			view.apps = [];
				
			view.layout = 'main';//no header|navbar|app loading
			
			res.render(path.join(__dirname, '/assets/index'), view);
		
		}
  },
  initialize: function(options){
		this.profile('login_init');//start profiling
		
		this.parent(options);//override default options
		
		this.profile('login_init');//end profiling
		
		this.log('login', 'info', 'login started');
  },
  
});
