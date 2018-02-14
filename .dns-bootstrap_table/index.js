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
			name: 'DNS',
			description: 'DNS',
			menu : {
				available: true,
				icon: 'fa-cog'
			},
			content: {
				available: true,
			}
		},
		
		id: 'dns',
		path: '/dns',
		
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
			//service_action: /start|stop/,
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
			
			version: '1.0.0',
			
			path: '/api',
			
			routes: {
				
				all: [
					{
						path: 'server',
						callbacks: ['server'],
						version: '',
					},
				]
			},
			
		},
  },
  
  //get_no_version_available: function(req, res, next){
		
		//res.status(404).json({ message: 'No API version available' });
		
  //},
  server: function(req, res, next){
		res.jsonp("http://"+req.hostname+":8081");
	},
  render: function(req, res, next){
		
		//console.log('DNS render');
		
		if(!req.isAuthenticated()){
			res.status(403).redirect('/');
		}
		else{
			var view = Object.clone(this.express().get('default_view'));
			view.tile = "DNS";
			
			view.apps.each(function(value, index){
				if(value.id == this.options.id){
					
					//value.role = 'start';
					view.apps[index]['role'] = 'start';
				}
				else{
					view.apps[index]['role'] = null;
				}
			}.bind(this));
			
			//view.body_scripts.push('"/dns/api/server/?callback=update_view",');
			view.body_scripts.push('/public/apps/dns/index.js');
			
			//view.body_script.push("var dns_server = 'http://"+req.hostname+":8081';\n");
			//view.css.push('/public/apps/dns/index.css');
			
			res.render(path.join(__dirname, '/assets/index'), view);
		}
  },
  
  initialize: function(options){
		this.profile('dns_init');//start profiling
		
		this.parent(options);//override default options
		
		this.profile('dns_init');//end profiling
		
		this.log('dns', 'info', 'dns started');
  },
	
});

