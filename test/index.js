'use strict'

var App = require('node-express-app'),
	path = require('path');
	


module.exports = new Class({
  Extends: App,
  
  app: null,
  logger: null,
  authorization:null,
  authentication: null,
  
  options: {
	  
	  layout:{
			name: 'Test',
			description: 'Test App',
			menu : {
				available: true,
				icon: 'fa-cog'
			},
			content: {
				available: true,
			}
		},
		
		id: 'test',
		path: '/test',
		
		/*authentication: {
			users : [
					{ id: 1, username: 'lbueno' , role: 'admin', password: '40bd001563085fc35165329ea1ff5c5ecbdbbeef'}, //sha-1 hash
					{ id: 2, username: 'test' , role: 'user', password: '123'}
			],
		},*/
		
		authorization: {
			init: false,
			config: path.join(__dirname,'./config/rbac.json'),
		},
		
		params: {
			service_action: /start|stop/,
		},
		
		routes: {
			
			get: [
				{
					path: '/:service_action',
					callbacks: ['check_authentication', 'get'],
				},
			],
			post: [
				{
				path: '',
				callbacks: ['check_authentication', 'post']
				},
			],
			all: [
				{
				path: '',
				callbacks: ['get']
				},
			]
		},
		
		api: {
			
			version: '1.0.0',
			
			routes: {
				get: [
					/*{
					path: '',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					//version: '1.0.1',
					},*/
					{
					path: ':service_action',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					version: '2.0.0',
					},
					{
					path: ':service_action',
					callbacks: ['get_api'],
					content_type: /^application\/(?:x-www-form-urlencoded|x-.*\+json|json)(?:[\s;]|$)/,
					version: '1.0.1',
					},
				],
				post: [
					{
					path: '',
					callbacks: ['check_authentication', 'post'],
					},
				],
				all: [
					{
					path: '',
					callbacks: ['get_no_version_available'],
					version: '',
					},
				]
			},
			
		},
  },
  
  get_api: function(req, res, next){
		
		if(Object.getLength(req.params) == 0){
			res.json({ title: 'test API', version: req.version, content_type: req.get('content-type') });
		}
		else if(req.params.service_action){
			res.json({ title: 'test API', param: req.params, version: req.version, content_type: req.get('content-type') });
		}
		else{
			next();
		}
		
  },
  get_no_version_available: function(req, res, next){
		
		res.status(404).json({ message: 'No API version available' });
		
  },
  
  get: function(req, res, next){
		if(!req.isAuthenticated()){
			res.status(403).redirect('/');
		}
		else{
			var view = Object.clone(this.express().get('default_view'));
			view.tile = "Test";
			
			view.apps.each(function(value, index){
				if(value.id == this.options.id){
					
					//value.role = 'start';
					view.apps[index]['role'] = 'start';
				}
				else{
					view.apps[index]['role'] = null;
				}
			}.bind(this));
			
			view.body_scripts.push('/public/apps/test/index.js');
			
				
			res.render(path.join(__dirname, '/assets/index'), view);
		}
  },
  //get: function(req, res, next){
		////console.log('test get');
		////console.log('req.isAuthenticated');
		////console.log(req.isAuthenticated());
		
		////console.log('isAuthorized');
		////console.log(this.isAuthorized({ op: 'view', res: 'abm'}));
		////console.log(this.getSession().getRole().getID());

		
		//if(Object.getLength(req.params) == 0){
			//res.json({ title: 'test app', content_type: req.get('content-type') });
		//}
		//else if(req.params.service_action){
			//res.json({ title: 'test app', param: req.params, content_type: req.get('content-type') });
		//}
		//else{
			//////console.log({ title: 'test app', param: req.params });
			//next();
		//}
		
  //},
  
  post: function(req, res, next){
	  
		//console.log('test post');
		////console.log(req.headers);
		res.json({ title: 'test app POST' });
		
  },
  
  initialize: function(options){
		this.profile('test_init');//start profiling
		
		
		
		this.parent(options);//override default options
		
		/*------------------------------------------*/
		if(this.authorization){
			// 	authorization.addEvent(authorization.SET_SESSION, this.logAuthorizationSession.bind(this));
			// 	authorization.addEvent(authorization.IS_AUTHORIZED, this.logAuthorization.bind(this));
			// 	authentication.addEvent(authentication.ON_AUTH, this.logAuthentication.bind(this));
			this.authorization.addEvent(this.authorization.NEW_SESSION, function(obj){
	  
			//   //console.log('event');
			//   //console.log(obj);
			  
			  if(!obj.error){
				
			// 	web.authorization.processRules({
			// 	  "subjects":[
			// 		{
			// 		  "id": "lbueno",
			// 		  "roles":["admin"]
			// 		},
			// 		{
			// 		  "id": "test",
			// 		  "roles":["user"]
			// 		},
			// 	  ],
			// 	});

				this.authorization.processRules({
				  "subjects": function(){
					  if(obj.getID() == "test")
						return [{ "id": "test", "roles":["user"]}];
					  
					  if(obj.getID() == "lbueno")
						return [{ "id": "lbueno", "roles":["admin"]}];
				  },
				});
			  }
			  
			}.bind(this));
		}
		
		this.profile('test_init');//end profiling
		
		this.log('test', 'info', 'test started');
  },
	
});

