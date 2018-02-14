'use strict'

var App = require('node-express-app'),
	path = require('path'),
	fs = require('fs'),
	os = require('os'),
	PouchDB = require('pouchdb');
	//websql = require('pouchdb/extras/websql');
	
var cradle = require('cradle-pouchdb-server');

module.exports = new Class({
  Extends: App,
  
  app: null,
  logger: null,
  authorization:null,
  authentication: null,
  
  //hidden: true,
  
  options: {
	  
	  layout:{
			name: 'OS',
			description: 'OS',
			menu : {
				available: true,
				icon: 'fa-cog'
			},
			content: {
				available: false,
			}
		},
		
	  //db: { path : path.join(__dirname,'../../../pouchdb/dashboard_read') },
	  db: 'dashboard',
	  
		id: 'os',
		path: '/os',
		
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
				
				get: [
					{
						path: 'networkInterfaces/primary',
						callbacks: ['primary_iface'],
						version: '',
					},
					{
						//content_type: '',
						path: 'server',
						callbacks: ['server'],
						version: '',
					},
					{
						path: ':module/:property/:info',
						callbacks: ['get'],
					},
					{
						path: ':module/:property',
						callbacks: ['get'],
					},
					{
						path: ':module',
						callbacks: ['get'],
					},
					{
						path: '',
						callbacks: ['get'],
					},
				]
			},
			
		},
  },
  get: function(req, res, next){
		console.log('OS API GET');
		console.log('req.params');
		console.log(req.params);
		console.log(req.query);
		
		var doc_type = req.query.type || 'info';
		var range = req.query.range || null;
		var limit = req.query.limit || 1;
		
		var module = req.params.module || null; 
		var property = req.params.property || null;
		var info = req.params.info || null;
			
		var is_os_func = false;
		
		if(module){
			try{
				Object.each(os, function(item, key){
					if(module == key){
						is_os_func = true;
						throw new Error('Found');
					}
				});
			}
			catch(e){
				//console.log(e);
			}
		}
		
		var query = {
			descending: true,
			inclusive_end: true,
			include_docs: true
		};
		
		var start_path = '';
		var end_path = '';
		
		var startkey = [];
		var endkey = [];
		
		if(is_os_func || !module){
			end_path = "os";
			start_path = end_path;
		}
		else{
			end_path = "os."+module;
			start_path = end_path+"\ufff0";
		}
		
		startkey.push(start_path);
		startkey.push("localhost.colo\ufff0");
		
		endkey.push(end_path);
		endkey.push("localhost.colo");
		
		if(range){
			console.log(range);
			if(range['end'].toInt() < 0)
				range['end'] = Date.now() + range['end'].toInt();
			
			if(range['start'].toInt() < 0)
				range['start'] = Date.now() + range['start'].toInt();
				
			console.log(range);
				
			startkey.push(range['end'].toInt());
			endkey.push(range['start'].toInt());
			
			if(req.query.limit){//we may want only a limited number of docs on range
				query['limit'] = req.query.limit;
			}
		}
		else{//put limit '1' if no range
			query['limit'] = limit;
		}
		
		query['startkey'] = startkey;
		query['endkey'] = endkey;
		
		console.log(query);
		
		this.db.view(doc_type+'/by_path_host', query, function (err, response) {
			if (err) {
				console.log(err);
				
			}
			else{
				//console.log('DOCS');
				////console.log(response);
			
			
				if(response.rows.length == 0){
					res.status(404).json({});
				}
				else{
					var result = [];
					
					Array.each(response.rows, function(row, index){
						var value = null;
						
						if(row.doc.data){
							value = row.doc.data;
							////console.log(response.rows[0].doc.data);
						}
						else{
							
							//delete row.doc.metadata;
							//delete row.doc._id;
							//delete row.doc._rev;
							
							value = Object.clone(row.doc);
						}
						
						delete value.metadata;
						delete value._id;
						delete value._rev;
							
						
						if(module){
							if(is_os_func){
								
								//result.push(value[module]);
								
								//if(property){
									//if(info){
										//if(value[module][property][info]){
											////result.push(value[property][info]);
											//result[index] = value[module][property][info];
										//}
										//else{
											////res.status(500).json({error: 'No ['+info+'] at property ['+property+'] on module '+module});
											//throw new Error('No ['+info+'] at property ['+property+'] on module '+module);
										//}
									//}
									//else if(value[module][property]){
										////result.push(value[property]);
										//result[index] = value[module][property];
									//}
									//else{
										////res.status(500).json({error: 'Bad property ['+property+'] on module '+module});
										//throw new Error('Bad property ['+property+'] on module '+module);
									//}
								//}
								//else{
									result[index] = value[module];
								//}
								
								//console.log(result);
								//throw new Error();
								
								
							}
							else{
								if(property){
									if(info){
										if(value[property][info]){
											//result.push(value[property][info]);
											result[index] = value[property][info];
										}
										else{
											//res.status(500).json({error: 'No ['+info+'] at property ['+property+'] on module '+module});
											throw new Error('No ['+info+'] at property ['+property+'] on module '+module);
										}
									}
									else if(value[property]){
										//result.push(value[property]);
										result[index] = value[property];
									}
									else{
										//res.status(500).json({error: 'Bad property ['+property+'] on module '+module});
										throw new Error('Bad property ['+property+'] on module '+module);
									}
								}
								else{
									//result.push(value);
									result[index] = value;
								}
								
							}
						}
						else{
							//result.push(value);
							result[index] = value;
						}
						
						//if(typeOf(result[index]) != 'object'){
						var data = result[index];
						delete result[index];
						result[index] = {};
						result[index]['data'] = data;
						//}
						
						result[index]['_rev'] = row.doc._rev;
						result[index]['_id'] = row.doc._id;
						result[index]['metadata'] = row.doc.metadata;
					});
					
					console.log(result);
					
					if(result.length == 1){
						res.json(result[0]);
					}
					else{
						res.json(result);
					}
					
				}
			}
		});
		
		//this.db.query(doc_type+'/by_path_host', query)
		//.then(function (response) {
			////console.log(response);
			
			
			
			//if(response.rows.length == 0){
				//res.status(404).json({});
			//}
			//else{
				//var result = [];
				
				//Array.each(response.rows, function(row, index){
					//var value = null;
					
					//if(row.doc.data){
						//value = row.doc.data;
						//////console.log(response.rows[0].doc.data);
					//}
					//else{
						
						////delete row.doc.metadata;
						////delete row.doc._id;
						////delete row.doc._rev;
						
						//value = Object.clone(row.doc);
					//}
					
					//delete value.metadata;
					//delete value._id;
					//delete value._rev;
						
					
					//if(module){
						//if(is_os_func){
							////result.push(value[module]);
							//result[index] = value[module];
							
						//}
						//else{
							//if(property){
								//if(info){
									//if(value[property][info]){
										////result.push(value[property][info]);
										//result[index] = value[property][info];
									//}
									//else{
										////res.status(500).json({error: 'No ['+info+'] at property ['+property+'] on module '+module});
										//throw new Error('No ['+info+'] at property ['+property+'] on module '+module);
									//}
								//}
								//else if(value[property]){
									////result.push(value[property]);
									//result[index] = value[property];
								//}
								//else{
									////res.status(500).json({error: 'Bad property ['+property+'] on module '+module});
									//throw new Error('Bad property ['+property+'] on module '+module);
								//}
							//}
							//else{
								////result.push(value);
								//result[index] = value;
							//}
							
						//}
					//}
					//else{
						////result.push(value);
						//result[index] = value;
					//}
					
					////if(typeOf(result[index]) != 'object'){
					//var data = result[index];
					//delete result[index];
					//result[index] = {};
					//result[index]['data'] = data;
					////}
					
					//result[index]['_rev'] = row.doc._rev;
					//result[index]['_id'] = row.doc._id;
					//result[index]['metadata'] = row.doc.metadata;
				//});
				
				//console.log(result);
				
				//if(result.length == 1){
					//res.json(result[0]);
				//}
				//else{
					//res.json(result);
				//}
				
			//}
			
		//}).catch(function (err) {
			//console.log('err');
			//console.log(err);
			//res.status(500).json({error: err.message});
		//});
		//res.json({});
	},
  primary_iface: function(req, res, next){
		res.set('Content-Type', 'application/javascript').jsonp(this.options.networkInterfaces.primary);
	},
  server: function(req, res, next){
		res.set('Content-Type', 'application/javascript').jsonp("http://"+req.hostname+":8080");
	},
  render: function(req, res, next){
		if(!req.isAuthenticated()){
			res.status(403).redirect('/');
		}
		else{
			var view = Object.clone(this.express().get('default_view'));
			view.tile = "OS";
			
			view.apps.each(function(value, index){
				if(value.id == this.options.id){
					
					//value.role = 'start';
					view.apps[index]['role'] = 'start';
				}
				else{
					view.apps[index]['role'] = null;
				}
			}.bind(this));
			
			view.body_scripts.push('/public/apps/os/index.js');
			
				
			res.render(path.join(__dirname, '/assets/index'), view);
			
			//res.redirect('/os/dashboard');
		}
  },
  
  
  initialize: function(options){
		this.profile('os_init');//start profiling
		
		options = Object.merge(options, JSON.decode(fs.readFileSync(path.join(__dirname, 'config/config.json' ), 'ascii')));
		//console.log(JSON.decode(fs.readFileSync(path.join(__dirname, 'config/config.json' ), 'ascii')));
		
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
			// 		  "id": "os",
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
		
		//this.db = new PouchDB(this.options.db.path, {db: require('sqldown')});
		this.db = new(cradle.Connection)().database(this.options.db);
		this.db.exists(function (err, exists) {
			if (err) {
				console.log('error', err);
			} else if (exists) {
				console.log('the force is with you.');
			} else {
				console.log('database does not exists.');
				this.db.create();
				/* populate design documents */
			}
		}.bind(this));
		
		//this.db.info().then(function (info) {
			//console.log(info);
		//})
		
		//dynamically create routes based on OS module (ex: /os/hostname|/os/cpus|...)
		//Object.each(os, function(item, key){
			
			
			//if(key != 'getNetworkInterfaces'){//deprecated func
				//console.log(key);
				
				//var callbacks = [];
			
				////if(key == 'networkInterfaces'){//use internal func
					////this[key] = function(req, res, next){
						////console.log('params');
						////console.log(req.params);
						
					////}
				////}
				////else{
					//this[key] = function(req, res, next){
						//console.log('params');
						//console.log(req.params);
						
						////var result = (typeof(item) == 'function') ? os[key]() : os[key];
						
						////if(req.params.prop && result[req.params.prop]){
							////res.json(result[req.params.prop]);
						////}
						////else if(req.params.prop){
							////res.status(500).json({ error: 'Bad property'});
						////}
						////else{
							////res.json(result);
						////}
					//}
				////}
				
				//this.options.api.routes.get.push({
						//path: key,
						//callbacks: [key]
				//});
				
				//this.options.api.routes.get.push({
						//path: key+'/:prop',
						//callbacks: [key]
				//});
			//}
		//}.bind(this));
		
		this.profile('os_init');//end profiling
		
		this.log('os', 'info', 'os started');
  },
	
});

