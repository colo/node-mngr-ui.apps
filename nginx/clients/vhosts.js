'use strict'

var http_client = require('node-app-http-client');

module.exports = new Class({
  Extends: http_client,
  
  options: {
	  
	  //scheme: 'http',
	  //url:'127.0.0.1',
	  //port: 8081,
	  
	  logs: { 
			path: './logs' 
		},
		
	  /*requests : {
			info: [
				{ api: { get: {uri: ''} } },
			],
			status: [
				{ api: { get: {uri: ''} } },
			],
			
		},*/
		
		routes: {
		},
		
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Cache-Control": "no-cache, no-store, must-revalidate"
		},
		
		jar: true,
		
		/*authentication: {
			username: 'lbueno',
			password: '123',
			sendImmediately: true,
		},
		
		authorization: {
			config: path.join(__dirname,'./config/rbac.json'),
		},*/
		
		
		api: {
			
			version: '1.0.0',
			
			path: '/nginx/vhosts/',
			
			routes: {
				get: [
					/**
					 * enabled vhosts only
					 * */
					{
						path: '/enabled',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: '/enabled/:uri',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: '/enabled/:uri/:prop_or_index',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: '/enabled/:uri/:prop_or_index/:prop',
						//callbacks: ['get'],
						version: '',
					},
					/**
					 * all vhosts
					 * */
					{
						path: ':uri',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: ':uri/:prop_or_index',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: ':uri/:prop_or_index/:prop',
						//callbacks: ['get'],
						version: '',
					},
					{
						path: '',
						//callbacks: ['get'],
						version: '',
					},
				],
				all: [
					{
						path: '',
						callbacks: ['get'],
						version: '',
					},
				]
			},
			
		},
  },
  
  /*get: function (err, resp, body, req){
		console.log('NGINX VHOSTS get');
		
		console.log('error');
		console.log(err);
		
		//console.log('resp');
		//console.log(resp);
		
		console.log('body');
		console.log(body);
  },*/
  initialize: function(options){
		
		this.parent(options);//override default options
		
		this.log('nginx-vhosts', 'info', 'nginx-vhosts started');
  },
});

