'use strict'

var App = require('node-express-app'),
	path = require('path'),
	util = require('util'),
	li = require('li'),
	vhosts_client = require('./clients/vhosts');
	


module.exports = new Class({
  Extends: App,
  
  app: null,
  logger: null,
  authorization:null,
  authentication: null,
  
  client: null,
  //hidden: true,//don't show on views (nav_bar, content, etc)
  
  
  options: {
		
		/**
		 * @todo req.query sanitizer as req.params
		 *
		 * query: {
		 * rows: /^(0|[1-9][0-9]*)$/,
		 * page: /^(0|[1-9][0-9]*)$/
		 * },
		*/
		
	  //session: {
			pagination: {
				page: 1,
				rows: 10,
				sort: 'uri',
				descending: false
				//prev: null,
				//next: null
			},
			content_range: {
				start: 0,
				end: 0,
				total: 0
			},
		//},
		
	  client: {scheme: 'http', url:'127.0.0.1', port: 8081},
	  
	  
	  layout:{
			name: 'Nginx Vhosts',
			description: 'Nginx Vhosts',
			menu : {
				available: false,
				icon: 'fa-cog'
			},
			content: {
				available: false,
			},
			
			hidden: true,
		},
		
		id: 'nginx-vhosts',
		path: '/nginx/vhosts',
		
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
				get: [
					/**
					 * all vhosts
					 * */
					{
						path: ':uri',
						callbacks: ['get_vhost'],
						version: '',
					},
					{
						path: ':uri/:prop_or_index',
						callbacks: ['get_vhost'],
						version: '',
					},
					{
						path: '',
						callbacks: ['get_page'],
						version: '',
					},
				],
				all: [
					{
						path: '',
						callbacks: ['get_page'],
						version: '',
					},
				]
			},
			
		},
  },
  get_vhost: function(req, res, next){
		console.log('---get_vhost---');
		console.log(req.params);
		
		const uri = req.params.uri;
		const index = req.params.prop_or_index;
		
		console.log(index)
		this.client.api.get({uri: uri+'/'+index.toInt()+'?comments=false'}, function(err, client_res, body, client_req){
			
			if(err){
				res.status(500).json(err)
			}
			else{
				console.log(JSON.decode(body));
				res.json(JSON.decode(body));
			}
		});
		
		
	},
  get_page: function(req, res, next){
		//req.query = req.query || {};
		
		var sent = false;
		
		console.log(this.session);
		
		req.session.pagination = req.session.pagination || this.options.pagination;
		req.session.content_range = req.session.content_range || this.options.content_range;
		
		req.session.pagination = {
			sort : req.query.sort || req.session.pagination.sort,
			//descending : (req.query.descending == "true") ? true : this.options.session.pagination.descending,
			descending : (req.query.descending) ? JSON.parse(req.query.descending) : req.session.pagination.descending,
			page : req.query.page || req.session.pagination.page,
			rows : req.query.rows || req.session.pagination.rows,
			search: req.query.search || ''
		};
		
		const page_uri = this.get_page_uri(req.session);
		
		
		console.log('---link: '+page_uri);
		
		this.client.api.get({uri: page_uri}, function(err, client_res, body, client_req){
			
			if(err){
				res.status(500).json(err)
			}
			else{
				const items = [];
				const search = req.session.pagination.search;
				var uris = [];
				var total = 0;
				
				if(search != ''){
					//total = JSON.decode(body).length;
					
					Array.each(JSON.decode(body), function(uri){
						if(uri.match(new RegExp(search, 'gi'))) uris.push(uri)
					});
					
					req.session.content_range.total = total = uris.length;
				}
				else{
					uris = JSON.decode(body);
					total = uris.length;
					
					if(client_res.headers['content-range']){
						req.session.content_range.total = client_res.headers['content-range'].split('/')[1].toInt();
					}
					//req.session.content_range.start = client_res.headers['content-range'].split('/')[0].split('-')[0].toInt();
					//req.session.content_range.end = client_res.headers['content-range'].split('/')[0].split('-')[1].toInt();
				}
				
				
				if(req.session.pagination.descending === true)
					uris.reverse();
					
				console.log(uris);
				
				//req.session.pagination.prev = new String(li.parse(client_res.headers.link).prev.match(new RegExp(/\/[^\/]+$/g))).replace('/', '');
				//req.session.pagination.next = new String(li.parse(client_res.headers.link).next.match(new RegExp(/\/[^\/]+$/g))).replace('/', '');
				////console.log(next);
				
				if(uris.length == 0){
					//UI should handle 404
					res.status(404).json({total: 0, items: []})
					//res.json({total: 0, items: []})
				}
				else{
					this.client.api.get({uri: 'enabled'}, function(err, client_res, body, client_req){
						//console.log('---enabled---');
						
						if(err){
							res.status(500).json(err)
						}
						else{
							
							////console.log(body);
							
							const enabled_uris = JSON.decode(body)
							
							Array.each(uris, function (uri, index){
								
								
								//get vhost properties
								this.client.api.get({uri: uri}, function(err, client_res, body, client_req){
									//console.log('---properties---');
									
									if(err){
										res.status(500).json(err)
									}
									else{
										
										const data = JSON.decode(body)
										////console.log(data);
										const vhost = {}
										
										if(data instanceof Array){//uri has more than 1 vhost
											//total += data.length - 1
											
											
											vhost.id = uri;
											vhost.uri = uri;
											vhost.sub_items = [];
											
											Array.each(data, function(tmp_item, tmp_index){
													const sub_vhost = {}
													sub_vhost.id = uri +'_'+tmp_index
													sub_vhost.uri = uri
													
													var tmp_listen = tmp_item.listen.split(":")
													if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
														tmp_listen = tmp_listen = tmp_listen[tmp_listen.length - 1]
													
													////console.log(tmp_listen)
													
													tmp_listen = tmp_listen.split(' ')
													if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
														tmp_listen = tmp_listen[0]
													
													sub_vhost.port = tmp_listen
													
													if(enabled_uris.contains(sub_vhost.uri)){
														
														this.client.api.get({uri: 'enabled/'+uri}, function(err, client_res, body, client_req){
															//console.log('---enabled/'+uri);
															
															if(err){
																res.status(500).json(err)
															}
															else{
																const enabled_data = JSON.decode(body);
															
																if(enabled_data instanceof Array){
																	Array.each(enabled_data, function(enabled_data_item, index){
																		if(sub_vhost.enabled !== true)
																			sub_vhost.enabled = (tmp_item.listen == enabled_data_item.listen) ? true : false
																			
																	})
																}
																else{
																	sub_vhost.enabled = (tmp_item.listen == enabled_data.listen) ? true : false
																}
																
															}
															
														}.bind(this));
														
														sub_vhost.enabled = true;
													}
													
													if(items.length < req.session.pagination.rows)
														vhost.sub_items.push(sub_vhost);
													
											}.bind(this))
											
											
										}
										else{
											////console.log(data)
											
											//const vhost = {}
											vhost.id = uri
											vhost.uri = uri
											
											////console.log(data.listen)
											
											if(typeof(data.listen) == 'string'){
												var tmp_listen = data.listen.split(":")
												
												if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
													tmp_listen = tmp_listen = tmp_listen[tmp_listen.length - 1]
												
												tmp_listen = tmp_listen.split(' ')
												if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
													tmp_listen = tmp_listen[0]
													
												vhost.port = tmp_listen
												
											}
											else{//array
												var port = ''
												Array.each(data.listen, function(listen, listen_index){
													var tmp_listen = listen.split(":")
													
													if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
														tmp_listen = tmp_listen[tmp_listen.length - 1]
													
													////console.log('-----tmp_listen----')
													////console.log(tmp_listen)
													tmp_listen = tmp_listen.split(' ')
													if(tmp_listen instanceof Array || typeof(tmp_listen) == 'array')
														tmp_listen = tmp_listen[0]
													
													port += tmp_listen
													if(listen_index < data.listen.length - 1)
														port += ' : '
												})
												
												vhost.port = port
											}
											
											if(enabled_uris.contains(vhost.uri))
												vhost.enabled = true
											
											//if(items.length < req.session.pagination.rows)
												//items.push(vhost);
											
										}
										
										if(items.length < req.session.pagination.rows)
											items.push(vhost);
												
										//uri_counter++;
										
										console.log('---total---')
										console.log(total)
										console.log(items.length)
										
										//if(items.length == total){
										
										/**
										 * We select N rows of URIs, but one URI may have more than one vhost associated.
										 * We must return only req.session.pagination.rows number of vhosts,
										 * and save the remaining one for next page.
										 * */
										if((items.length == req.session.pagination.rows || items.length == total) && sent === false){
											
											
											if(req.session.content_range.total != 0)
												total = req.session.content_range.total;
											
											res.json({total: total, items: items});
											sent = true;
										}
										
										
									}
									
								}.bind(this));
								
							
							}.bind(this));
						
						
						}	
					}.bind(this));
				}
				
			}
		}.bind(this));
		
		
	},
	get_page_uri: function(session){
		var uri = '';
		const page = session.pagination.page - 1;
		const rows = session.pagination.rows;
		const search = session.pagination.search;
		const total = session.content_range.total;
		
		console.log('---search---');
		console.log(search);
		
		if(search == ''){
			if(session.pagination.descending === true){
				if(total == 0){
					uri = '?last='+rows;
				}
				else{
					const end = (total - (page * rows)) - 1;
					const start = (end - (rows - 1)) > 0 ? end - (rows - 1) : 0;
					uri = '?start='+start+'&end='+end;
				}
				
				
			}
			else{
				
				const start = page * rows;
				const end = start + (rows - 1);
				uri = '?start='+start+'&end='+end;
			}
		}
		return uri;
	},
  render: function(req, res, next){
		
		if(req.isAuthenticated()){
				res.status(403).redirect('/');
		}
		else{
			
			res.render(path.join(__dirname, '/assets/vhosts'), {layout: false});
		
		}
  },
  initialize: function(options){
		this.profile('nginx-vhosts_init');//start profiling
		
		this.parent(options);//override default options
		
		this.client = new vhosts_client(this.options.client);
			
		this.profile('nginx-vhosts_init');//end profiling
		
		this.log('nginx-vhosts', 'info', 'nginx-vhosts started');
  },
  
});
