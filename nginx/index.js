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
			name: 'Nginx',
			description: 'Nginx',
			menu : {
				available: false,
				icon: 'fa-cog'
			},
			content: {
				available: false,
			},
			
			hidden: true,
		},
		
		id: 'nginx',
		path: '/nginx',
		
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
  render: function(req, res, next){
		
		if(req.isAuthenticated()){
				res.status(403).redirect('/');
		}
		else{
			
			res.render(path.join(__dirname, '/assets/index'), {layout: false});
		
		}
  },
  initialize: function(options){
		this.profile('nginx_init');//start profiling
		
		this.parent(options);//override default options
		
		this.profile('nginx_init');//end profiling
		
		this.log('nginx', 'info', 'nginx started');
  },
  
});
