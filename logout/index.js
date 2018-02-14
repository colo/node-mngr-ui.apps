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
			name: 'Logout',
			description: 'Logout',
			menu : {
				available: false,
				icon: 'fa-cog'
			},
			content: {
				available: false,
			},
			
			hidden: true,
		},
		
		id: 'logout',
		path: '/logout',
		
		//authorization: {
			////config: path.join(__dirname,'./config/rbac.json'),
		//},
		
		params: {
		},
		
		routes: {
			
			all: [
				{
				path: '',
				callbacks: ['logout']
				},
			]
		},
		
		api: {
			
			version: '1.0.0',
			
			routes: {
				all: [
					{
					path: '',
					callbacks: ['logout'],
					version: '',
					},
				]
			},
			
		},
  },
  logout: function(req, res, next){
		//console.log('logout');
		
		if (req.isAuthenticated()) {
			//console.log('logout-authenticated');
			
			this.profile('logout');//start profiling
			this.log('logout', 'info', 'logout' + util.inspect( req.user ));
			
			req.logout();
			
			this.profile('logout');//stop profiling
		}
		

		if(req.is('application/json') || req.path.indexOf('/api') == 0){
			//res.send({'status': 'success'});
			res.status(201).links({ next: req.protocol+'://'+req.hostname+':8080/'}).json({'status': 'ok'});
		}
		else{
			res.redirect('/');
		}
		
  },
  initialize: function(options){
		
		this.profile('logout_init');//start profiling
		
		this.parent(options);//override default options
		
		this.profile('logout_init');//end profiling
		
		this.log('logout', 'info', 'logout started');
  },
	
});

