var os_dashboard_page = null;

head.ready('mootools-more'
, function() {
	
	var OSDashBoardPage = new Class({
		Extends: Page,
		
		/** - * */
		ON_PERIODICAL_REQUEST_TIMEOUT: 'onPeriodicalRequestTimeout',
		ON_PERIODICAL_REQUEST_FAILURE: 'onPeriodicalRequestFailure',
		ON_PERIODICAL_REQUEST_SUCCESS: 'onPeriodicalRequestSuccess',
		
		ON_HISTORICAL_REQUEST_DEFINED: 'onHistoricalRequestDefined',
		ON_HISTORICAL_REQUEST_TIMEOUT: 'onHistoricalRequestTimeout',
		ON_HISTORICAL_REQUEST_FAILURE: 'onHistoricalRequestFailure',
		ON_HISTORICAL_REQUEST_SUCCESS: 'onHistoricalRequesSuccess',
		
		server: null,
		timed_request: {},
		
		timed_request: {},
		timed_request_queue: null,
		
		historical_request: {},
		historical_request_queue: null,
		
		periodical_functions: {},
		periodical_functions_timers : {
			'page': {},
			'model':{}
		},
		
		update_model_success: [],
		/** - * */
		
		info_view: false,
		status_view: false,
		
		MODEL_UPDATED: 'modelUpdated',
		VIEWS_SUCCESS: 'viewsSuccess',
		
		options: {
			assets: {
				js: [
					{ model: "/public/apps/os/models/dashboard.js" },
					{ PouchDB: "/public/bower/pouchdb/dist/pouchdb.min.js"},
					{ sprintf: '/public/bower/sprintf/dist/sprintf.min.js'},
					{ randomcolor: '/public/bower/randomcolor/randomColor.js' },
					{ gentelella_deps: [
							//{ bootstrap: "/public/bower/gentelella/vendors/bootstrap/dist/js/bootstrap.min.js" },
							{ Chart: "/public/bower/gentelella/vendors/Chart.js/dist/Chart.min.js" },
							{ flot: "/public/bower/gentelella/vendors/Flot/jquery.flot.js" },
							{ flot_pie: "/public/bower/gentelella/vendors/Flot/jquery.flot.pie.js" },
							{ flot_time: "/public/bower/gentelella/vendors/Flot/jquery.flot.time.js" },
							{ flot_stack: "/public/bower/gentelella/vendors/Flot/jquery.flot.stack.js" },
							{ flot_resize: "/public/bower/gentelella/vendors/Flot/jquery.flot.resize.js" },
							{ flot_orderBars: "/public/bower/gentelella/production/js/flot/jquery.flot.orderBars.js" },
							{ flot_date: "/public/bower/gentelella/production/js/flot/date.js" },
							{ flot_spline: "/public/bower/gentelella/production/js/flot/jquery.flot.spline.js" },
							{ flot_curvedLines: "/public/bower/gentelella/production/js/flot/curvedLines.js" },
						]
					}
				],
				css: {
					'index_css': '/public/apps/os/css/index.css'
				},
				jsonp: {
					update_server: '/os/api/server/',
					update_primary_iface: "/os/api/networkInterfaces/primary",
				}
			},
			
			/** - * */
			requests: {
				periodical: {
					_defaults: {
						url: '?type=status&limit=1&range[start]=%d&range[end]=%d',
						//url: '?type=status&limit=1',
						method: 'get',
						initialDelay: 1000,
						delay: 5000,
						limit: 10000,
						noCache: true
					},
					
					loadavg : {
						url: '/os/api/loadavg'
					},
					freemem: {
						url: '/os/api/freemem'
					},
					cpus: {
						url: '/os/api/cpus'
					},
					uptime: {
						url: '/os/api/uptime'
					},
					primary_iface_stats: {
						url: function(){ return '/os/api/networkInterfaces/' +os_dashboard_page.primary_iface; },
						onSuccess: function(doc){
							console.log('PRIMARY IFACE myRequests.'+os_dashboard_page.primary_iface);
							console.log(doc);
							os_dashboard_page.model.networkInterfaces[os_dashboard_page.primary_iface](doc.data);
							
							return true;
						}.bind(this)
					},
					blockdevices_stats: function(){
						var blks = {};
						
						Object.each(os_dashboard_page.model.blockdevices, function(dev, name){
							blks[name] = {
								url: '/os/api/blockdevices/'+name+'/stats',
								onSuccess: function(doc){
									//console.log('myRequests.'+name+'_stats: ');
									////console.log(doc);
									
									/**
									 * save previous stats, needed to calculate times (updated stats - prev_stats)
									 * */
									//os_dashboard_page.model.blockdevices.sda._prev_stats = os_dashboard_page.model.blockdevices.sda.stats();
									
									doc.data.timestamp = doc.metadata.timestamp;
									
									os_dashboard_page.model.blockdevices[name].stats(doc.data);
									
									return true;
								}.bind(this)
							}
								
						}.bind(this));
						
						return blks;
					},
					mounts: function(){
						var mounts = {};
						
						Array.each(os_dashboard_page.model.mounts, function(mount, index){
		
							if(os_dashboard_page.model.options.list_partitions_types.test(mount.type())){
								console.log('mount.fs()');
								//console.log();
								
								mounts[mount.fs().replace(/\//g, '%2F')] = {
									//url: '/os/api/mounts/'+mount.fs().replace(/\//g, '%2F'),
									url: '/os/api/mounts/'+index,
									onSuccess: function(doc){
										console.log('/os/api/mounts/'+mount.fs().replace(/\//g, '%2F'));
										console.log(doc);
										console.log(os_dashboard_page.model.mounts[index].percentage());
										
										//doc.data.percentage.timestamp = doc.metadata.timestamp;
										os_dashboard_page.model.mounts[index].timestamp = doc.metadata.timestamp;
										os_dashboard_page.model.mounts[index].percentage(doc.data.percentage);
										
										os_dashboard_page.model._update_plot_data(mount.mount_point()+'_used', doc.data.percentage, doc.metadata.timestamp);
									}
								};
								
							}
						}.bind(this));
						
						return mounts;
					}
					//blockdevices: function(){
						//var blks = {};
						
						//Object.each(os_dashboard_page.model.blockdevices, function(dev, name){
							//blks[name] = {
								//url: '/os/api/blockdevices/'+name,
								//onSuccess: function(doc){
									//console.log('periodical myRequests.blockdevices.'+name);
									//console.log(doc);
									
									/////**
									 ////* save previous stats, needed to calculate times (updated stats - prev_stats)
									 ////* */
									//////os_dashboard_page.model.blockdevices.sda._prev_stats = os_dashboard_page.model.blockdevices.sda.stats();
									
									////doc.data.timestamp = doc.metadata.timestamp;
									//doc.data.stats.timestamp = doc.metadata.timestamp;
									//os_dashboard_page.model.blockdevices[name].stats(doc.data.stats);
									
									//return true;
								//}.bind(this)
							//}
								
						//}.bind(this));
						
						//return blks;
					//}
				},
				
				historical: {
					_defaults: {
						url: '?type=status&range[start]=%d&range[end]=%d',
						method: 'get',
					},
					loadavg : {
						url: '/os/api/loadavg',
						onSuccess: function(docs){
							var cpu = [];
							////console.log('historical.loadavg: ');
							////console.log(docs);
							
							/** docs come from lastes [0] to oldest [N-1] */
							for(var i = docs.length - 1; i >= 0; i--){
								var doc = docs[i];
								////console.log(doc.data[0].toFloat())
								
								os_dashboard_page.model._update_plot_data('loadavg', doc.data[0].toFloat(), doc.metadata.timestamp);
								
							}
								
						}
					},
					freemem: {
						url: '/os/api/freemem',
						onSuccess: function(docs){
							var cpu = [];
							////console.log('historical.freemem: ');
							////console.log(docs);
							/** docs come from lastes [0] to oldest [N-1] */
							for(var i = docs.length - 1; i >= 0; i--){
								var doc = docs[i];
								
								////console.log((((os_dashboard_page.model.totalmem() - doc.data) * 100) / os_dashboard_page.model.totalmem()).toFixed(2));
								
								
								os_dashboard_page.model._update_plot_data('freemem', (((os_dashboard_page.model.totalmem() - doc.data) * 100) / os_dashboard_page.model.totalmem()).toFixed(2), doc.metadata.timestamp);
								
							}
								
						}
					},
					cpus: {
						url: '/os/api/cpus',
						onSuccess: function(docs){
							var cpu = [];
							console.log('historical.cpus: ');
							console.log(docs);
							
							
							/** docs come from lastes [0] to oldest [N-1] */
							for(var i = docs.length - 1; i >= 0; i--){
								var doc = docs[i];
								
								var cpu_usage = os_dashboard_page.model._process_cpu_usage(doc.data);
								var percentage = os_dashboard_page.model.cpu_usage_percentage(os_dashboard_page.model.cpu_usage, cpu_usage);
								
								os_dashboard_page.model.cpu_usage = cpu_usage;
								
								os_dashboard_page.model._update_plot_data('cpus', percentage['usage'].toFloat(), doc.metadata.timestamp);
								
								
							}
							
						}
					},
					blockdevices_stats: function(){
						var blks = {};
						
						Object.each(os_dashboard_page.model.blockdevices, function(dev, name){
							blks[name] = {
								url: '/os/api/blockdevices/'+name+'/stats',
								onSuccess: function(docs){
									
									var last_doc = null;
									
									///** docs come from lastes [0] to oldest [N-1] */
									for(var i = docs.length - 1; i >= 0; i--){
										var doc = docs[i];
										doc.data.timestamp = docs[i].metadata.timestamp;
										
										
										if(last_doc){
											var percentage = os_dashboard_page.model._blockdevice_percentage_data(last_doc, doc.data);
											
											os_dashboard_page.model._update_plot_data(name+'_stats', percentage, doc.metadata.timestamp);
										}
										
										last_doc = doc.data;
										
										
										
									}
										
								}
							}
								
						}.bind(this));
						
						return blks;
					},
					mounts: function(){
						var mounts = {};
						
						Array.each(os_dashboard_page.model.mounts, function(mount, index){
		
							if(os_dashboard_page.model.options.list_partitions_types.test(mount.type())){
								console.log('mount.fs()');
								//console.log();
								
								mounts[mount.fs().replace(/\//g, '%2F')] = {
									//url: '/os/api/mounts/'+mount.fs().replace(/\//g, '%2F'),
									url: '/os/api/mounts/'+index,
									onSuccess: function(docs){
										//console.log('/os/api/mounts/'+mount.fs().replace(/\//g, '%2F'));
										//console.log(doc);
										//console.log(os_dashboard_page.model.mounts[index].percentage());
										
										//doc.data.percentage.timestamp = doc.metadata.timestamp;
										
										for(var i = docs.length - 1; i >= 0; i--){
											var doc = docs[i];
											
											os_dashboard_page.model.mounts[index].timestamp = doc.metadata.timestamp;
											os_dashboard_page.model.mounts[index].percentage(doc.data.percentage);
											
											os_dashboard_page.model._update_plot_data(mount.mount_point()+'_used', doc.data.percentage, doc.metadata.timestamp);
										}
									}
								};
								
							}
						}.bind(this));
						
						return mounts;
					}
					//blockdevices: function(){
						//var blks = {};
						
						//Object.each(os_dashboard_page.model.blockdevices, function(dev, name){
							//blks[name] = {
								//url: '/os/api/blockdevices/'+name,
								//onSuccess: function(docs){
									//console.log('historical.blockdevices: '+name);
									//console.log(docs);
									
									//var last_doc = null;
									
									/////** docs come from lastes [0] to oldest [N-1] */
									//for(var i = docs.length - 1; i >= 0; i--){
										//var doc = docs[i];
										//doc.data.stats.timestamp = docs[i].metadata.timestamp;
										
										
										//if(last_doc){
											//var percentage = os_dashboard_page.model._blockdevice_percentage_data(last_doc, doc.data.stats);
											
											//os_dashboard_page.model._update_plot_data(name+'_stats', percentage, doc.metadata.timestamp);
										//}
										
										//last_doc = doc.data.stats;
										
										
										
									//}
										
								//}
							//}
								
						//}.bind(this));
						
						//return blks;
					//}
				},
				update_model: ['/os/api', '/os/api/blockdevices', '/os/api/mounts'],
				
			},
			
			OFFSET: 1, 
			DEFAULT_HISTORICAL_START: 120, //seconds in the past
				
			docs:{
				buffer_size: 10,
				timer: 5, //seconds
			}
			/** - * */
		},
		
		initialize: function(options){
			var self = this;
			
			root_page.addEvent('beforeHide_os_dashboard', function(){
						
				this.stop_timed_requests();
				this.stop_periodical_functions();
				
			}.bind(this));
			
			root_page.addEvent('afterShow_os_dashboard', function(){
				
				this.start_timed_requests();
				this.start_periodical_functions();
				
			}.bind(this));
			
			this.addEvent(this.ON_HISTORICAL_REQUEST_DEFINED, function(key){
				this._load_plots(key);
			}.bind(this));
			
			this.addEvent(this.ON_PERIODICAL_REQUEST_SUCCESS, this._onPeriodicalSuccess.bind(this));
			this.addEvent(this.ON_HISTORICAL_REQUEST_SUCCESS, this._onHistoricalSuccess.bind(this));
							
			this.addEvent(this.JS_LOADED+'_PouchDB', function(data){
				console.log('PouchDB loaded');
				
				var InfoViewLoaded = function(){
					self.info_view = true;
					if(self.status_view == true)
						self.fireEvent(self.VIEWS_SUCCESS);
				};
				
				var StatusViewLoaded = function(){
					self.status_view = true;
					if(self.info_view == true)
						self.fireEvent(self.VIEWS_SUCCESS);
				};
				
				//PouchDB.debug.enable('*');
				PouchDB.debug.disable('*');
				//window.PouchDB = PouchDB;
				
				this.db = new PouchDB('dashboard');
				//window.PouchDB = this.db;
				
				
				//this.db.info().then(function (info) {
					//////console.log(info);
				//})
				/** check if views are in the DB */
				this.db.get('_design/info')
				.then(InfoViewLoaded)
				.catch(function (err) {
					////console.log(err);
					if (err.status == 404) {//if not found, load and insert
						
						//self.addEvent(self.JS_LOADED+'_InfoView', function(){
							//self.db.put(InfoView);
						//});
						
						//self.load_js({ InfoView : '/public/apps/os/_views/InfoView.js'});
						
						self.load_js('/public/apps/os/_views/InfoView.js', function(asset){
							console.log('INSERT InfoView');
							self.db.put(InfoView).then(InfoViewLoaded)
							.catch(function (err) {
								console.log('err');
								console.log(err);
							});
						});
					}
					// ignore if doc already exists
				});
				
				
				this.db.get('_design/status')
				.then(StatusViewLoaded)
				.catch(function (err) {
					////console.log(err);
					if (err.status == 404) {//if not found, load and insert
						
						//self.addEvent(self.JS_LOADED+'_StatusView', function(){
							//self.db.put(StatusView);
						//});
						
						//self.load_js({ StatusView : '/public/apps/os/_views/StatusView.js'});
						self.load_js('/public/apps/os/_views/StatusView.js', function(asset){
							console.log('INSERT StatusView');
							self.db.put(StatusView).then(StatusViewLoaded)
							.catch(function (err) {
								console.log('err');
								console.log(err);
							});
						});
					}
					// ignore if doc already exists
				});
				
				/** ---------------- */
				
			}.bind(this));	
					
			//this.addEvent(this.ASSETS_SUCCESS, function(){
				//console.log('os_dashboard_page.ASSETS_SUCCESS');
				//self.fireEvent(self.STARTED);
			//});
							
			
			this.addEvent(this.JSONP_LOADED+'_update_server', function(data){
				console.log('this.JSONP_LOADED_update_server');
				//console.log(OSDashboardModel);
				//console.log(PouchDB);
				
				this.server = data;
				//this._update_model(this.options.requests.update_model);
				
			}.bind(this));
			
			this.addEvent(this.JSONP_LOADED+'_update_primary_iface', function(data){
				console.log('this.JSONP_LOADED_update_primary_iface');
				console.log(data);
				
				this.primary_iface = data;
				OSDashboardModel.implement({'primary_iface': ko.observable(data)});
			}.bind(this));
			
			//this.addEvent(this.ASSETS_SUCCESS, function(){
			this.addEvent(this.VIEWS_SUCCESS, function(){
				console.log('this.VIEWS_SUCCESS');
				this._update_model(this.options.requests.update_model);
			}.bind(this));

			//this.addEvent(this.STARTED, function(){		
			this.addEvent(this.MODEL_UPDATED, function(){
						
				if(mainBodyModel.os_dashboard() == null){
					
					if(!self.model){
						self.model = new OSDashboardModel();
						
						console.log('os_dashboard binding applied');
					}
					
					mainBodyModel.os_dashboard(self.model);
					
					self._define_timed_requests(self.options.requests.periodical);
							
					self._define_historical_requests(self.options.requests.historical);
					
					//this._define_queued_requests();
					
					//this.start_timed_requests();
					ko.tasks.schedule(self.start_timed_requests.bind(self));
					
					//ko.tasks.schedule(this._load_plots.bind(this));
				
					ko.tasks.schedule(self.start_periodical_functions.bind(self));
					
				}
				else{
					self.model = mainBodyModel.os_dashboard();
				}
				
				
			});
			
			this.parent(options);
			
			
		},
		start_timed_requests: function(){
			//////console.log('start_timed_requests');
			
			
			
			Object.each(this.timed_request, function(req, key){
				//////console.log('starting.... '+key);
				
				req.startTimer();
			});
			
			//this.timed_request_queue.resume();
		},
		stop_timed_requests: function(){
			//////////console.log('stop_timed_requests');
			Object.each(this.timed_request, function(req){
				req.stopTimer();
			});
		},
		start_periodical_functions: function(){
			////console.log('start_periodical_functions');
			
			Object.each(this.periodical_functions, function(data, key){
				////console.log('starting.... '+key);
				
				if(!this.periodical_functions_timers['page'][key])
					this.periodical_functions_timers['page'][key] = data.fn.periodical(data.interval);
					
			}.bind(this));
			
			Object.each(this.model.periodical_functions, function(data, key){
				////console.log('model starting.... '+key);
				
				if(!this.periodical_functions_timers['model'][key]){
					this.periodical_functions_timers['model'][key] = data.fn.periodical(data.interval);
					////console.log('...STARTED!!!');
				}
					
			}.bind(this));
			
			
		},
		stop_periodical_functions: function(){
			////console.log('stop_periodical_functions');
			
			Object.each(this.periodical_functions_timers['page'], function(timer, key){
				////console.log('stoping.... '+key);
				
				clearInterval(timer);
				delete this.periodical_functions_timers['page'][key];
				
			}.bind(this));
			
			Object.each(this.periodical_functions_timers['model'], function(timer, key){
				////console.log('model stoping.... '+key);
				//////console.log(timer);
				
				clearInterval(timer);
				delete this.periodical_functions_timers['model'][key];
				
			}.bind(this));
			
		},
		_update_model(urls){
			var self = this;
			
			console.log('UPDATE MODEL');
			
			urls = (typeOf(urls) == 'array') ? urls : [urls];
			
			var requests = {}
			
			Array.each(urls, function(url){
				var doc_key = this._url_to_doc_path(url);
				
				console.log('DOCS');
				console.log(doc_key);
				
				var id = doc_key.split('.');//split to get last portion (ex: 'os', 'blockdevices'....)
				id = id[id.length - 1];
				
				////console.log('REQUESTS');
				////console.log(id);
				
				
				
				requests[id] = null;//store id to use it to check wich doc/request has updated the model
				
				self.db.query('info/by_path_host', {
					descending: true,
					inclusive_end: true,
					include_docs: true,
					limit: 1,
					startkey: [ doc_key, 'localhost.colo￰' ],
					endkey: [ doc_key, 'localhost.colo' ] 
				})
				.then(function (response) {
					////console.log('info/by_path_host/'+doc_key);
					////console.log(response);
					
					//////console.log(response.rows[0].doc);
					if(response.rows[0]){//there is a doc, update model with this data
						OSDashboardModel.implement_data(response.rows[0].doc, id);
						
						self.update_model_success.push(id);
						/**
						 * compare the every key of "request" with "success_request", return true when all keys (request) are found
						 * 
						 * */
						var all_success = Object.keys(requests).every(function(req){
							return (self.update_model_success.indexOf(req) >= 0) ? true : false;
						});
						
						
						if(all_success){
							////console.log('doc.ALLonSuccess');
							self.fireEvent(self.MODEL_UPDATED);
						}
					}
					else{
						throw new Error('no doc');
					}
					
				})
				.catch(function (err) {
					////console.log('err');
					////console.log(err);
					
					requests[id] = new Request.JSON({
						method: 'get',
						secure: true,
						url: self.server+url+'?type=info',
						onSuccess: function(server_data){
							////console.log('onSuccess to apply');
							////console.log(server_data);
							
							doc = Object.clone(server_data);
							delete doc._rev;
							
							/** insert on local db, so we can avoid this request next time */
							self.db.put(doc).catch(function (err) {
								////console.log('err');
								////console.log(err);
							});
						
							//console.log(OSDashboardModel);
							OSDashboardModel.implement_data(server_data, id);
							
							self.update_model_success.push(id);
							/**
							 * compare the every key of "request" with "success_request", return true when all keys (request) are found
							 * 
							 * */
							var all_success = Object.keys(requests).every(function(req){
								//return (success_request.indexOf(req) >= 0) ? true : false;
								return (self.update_model_success.indexOf(req) >= 0) ? true : false;
							});
							
							
							if(all_success){
								////console.log('req.ALLonSuccess');
								self.fireEvent(self.MODEL_UPDATED);
							}
							
						}.bind(this)
					});
					
					requests[id].send();
					
				});
				
				
				
			}.bind(this));
			
		},
		/** 
		 * calculate real path based on the req.url 
		 * */
		_url_to_doc_path: function(url){
			var doc_path = url.replace('/api', '');
			doc_path = doc_path.replace(/\//g, '.');
			return doc_path.replace('.', '');
		},
		_load_plots: function(key){
			////console.log('loading plot...'+key);
			
			if(!key || !this.historical_request[key]){
				Object.each(this.historical_request, function(req, key){
					req.send();
				});
			}
			else{
				this.historical_request[key].send();
			}
		},
		_onPeriodicalSuccess: function(doc, doc_path, key){
			console.log('PERIODICAL myRequests.'+key);
			console.log(doc.data);
			
			var self = this;
			
			
			delete doc._rev;
			
			//doc.data.timestamp = doc.metadata.timestamp;
			
			if(typeOf(self.model[key]) == 'function'){
				try{
					var timestamp_key = key+'_timestamp';//we may use this property to know when was the last time we updated this key
					self.model[timestamp_key] = doc.metadata.timestamp;
					
					if(typeOf(self.model[key]()) == typeOf(doc.data)){//if typeOf data match
						self.model[key](doc.data);
					}
					
					//console.log(key);
					//console.log(self.model[timestamp_key]);
				}
				catch(e){
					//console.log(e);
					//console.log(key);
				}
			}
			
			var old_path = doc.metadata.path;
			doc.metadata.path = doc_path;
			doc._id = doc._id.replace(old_path+'@', doc_path+'@');
				
			//console.log('DOC TO SAVE....');
			//console.log(doc_path);
			////console.log(doc.metadata.path);
			
			if((self['docs']['buffer'].length < self.options.docs.buffer_size) &&
			 (self['docs']['timer'] > Date.now().getTime()))
			{
				self['docs']['buffer'].push(doc);
			}
			else{
				//console.log('bulkDocs');
				//console.log(self['docs']['buffer'].length);
				//console.log(self['docs']['buffer']);
				
				self.db.bulkDocs(self['docs']['buffer'])
				.then(function(response){
					//console.log('bulkDocs resp...');
					//console.log(response);
				})
				.catch(function (err) {
					//console.log('DB PUT ERR myRequests.'+key);
					//console.log(err);
				});
				
				self['docs'] = {
					'buffer': [],
					'timer': (Date.now().getTime() + (self.options.docs.timer * 1000)),
				};
			}
			
			return true;
		},
		_define_timed_requests: function(requests){
			var self = this;
			
			//////console.log('_define_timed_requests');
			
			Object.each(requests, function(req, key){
				
				if(typeOf(req) == 'function'){
					////console.log('FUNCTION....');
					////console.log(key);
					//////console.log(req());
					var new_requests = req();
					Object.each(new_requests, function(req, name){
						new_requests[key+'_'+name] = req;
						delete new_requests[name];
					});
					
					////console.log(new_requests);
					this._define_timed_requests(new_requests);
					
				}
				else if(key.charAt(0) != '_'){//defaults
					
					/** calculate real path based on the req.url */
					var doc_path = this._url_to_doc_path( (typeOf(req.url) == 'function') ? req.url() : req.url );
					
								
					var default_req = Object.merge(
						{
							onSuccess: function(doc){
								//console.log('PERIODICAL myRequests.'+key);
								self.fireEvent(self.ON_PERIODICAL_REQUEST_SUCCESS, [doc, doc_path, key]);
							},
							onFailure: function(){
								//////console.log('onFailure');
								self.fireEvent(self.ON_PERIODICAL_REQUEST_FAILURE);
							},
							onTimeout: function(){
								//////console.log('onTimeout');
								self.fireEvent(self.ON_PERIODICAL_REQUEST_TIMEOUT);
							}
						},
						this.options.requests.periodical._defaults
					);
					
					default_req.url = sprintf(default_req.url, -(10000 + (this.options.OFFSET * 1000)), 0 - (this.options.OFFSET * 1000));
			
					//////console.log('KEY '+key);
					
					if(typeOf(req.url) == 'function')
						req.url = req.url();
						
					req.url = this.server + req.url + default_req.url;
					
					var onSuccess = function(doc){
						default_req.onSuccess.attempt(doc, this);
						if(req.onSuccess){
							req.onSuccess.attempt(doc, this);
						}
					};
					
					this.timed_request[key] = new Request.JSON(
						Object.merge(
							Object.clone(default_req),
							req,
							{'onSuccess': onSuccess.bind(this)}
						)
					);
				}
			}.bind(this));
			

		}.protect(),
		_onHistoricalSuccess: function(docs, doc_key, key){
			console.log('DEFAULT REQ onSuccess');
			console.log(key);
			////console.log(docs);
			
			var self = this;
			
			if(docs.length > 0){
				Array.each(docs, function(doc){
					delete doc._rev;
					var old_path = doc.metadata.path;
					doc.metadata.path = doc_key;
					doc._id = doc._id.replace(old_path+'@', doc_key+'@');
				});
				
				self.db.bulkDocs(docs)
				.catch(function (err) {
					//console.log(err);
				});
				
			}
		},
		_define_historical_requests: function(requests){
			var now = new Date();
			var start_range = now.getTime() - ((this.options.DEFAULT_HISTORICAL_START * 1000) + (this.options.OFFSET * 1000));
			var end_range = now.getTime() - (this.options.OFFSET * 1000);
			
			var self = this;
			
			Object.each(requests, function(req, key){
				if(typeOf(req) == 'function'){
					//console.log('FUNCTION....');
					//console.log(key);
					////console.log(req());
					var new_requests = req();
					Object.each(new_requests, function(req, name){
						new_requests[key+'_'+name] = req;
						delete new_requests[name];
					});
					
					//console.log(new_requests);
					this._define_historical_requests(new_requests);
					
				}
				else if(key.charAt(0) != '_'){//defaults
					
					/** calculate real path based on the req.url */
					var doc_key = this._url_to_doc_path( (typeOf(req.url) == 'function') ? req.url() : req.url );
					
					var prepare_requests = function(){
						////console.log('preparing requests....');
						/**
					 * */
						var default_req = Object.append(
							{
								onSuccess: function(docs){
									self.fireEvent(self.ON_HISTORICAL_REQUEST_SUCCESS, [docs, doc_key, key]);
								},
								onFailure: function(){
									self.fireEvent(self.ON_HISTORICAL_REQUEST_FAILURE);
								},
								onTimeout: function(){
									self.fireEvent(self.ON_HISTORICAL_REQUEST_TIMEOUT);
								}
							},
							self.options.requests.historical._defaults
						);
						
						default_req.url = sprintf(default_req.url, start_range, end_range);
						
						//console.log('REQUEST RANGE');
						//console.log(default_req.url);
						
						
						if(typeOf(req.url) == 'function')
							req.url = req.url();
							
						req.url = self.server + req.url + default_req.url;
						
						/** 'attemp' method needs [] for passing and array, or it will take 'docs' as multiple params */
						var onSuccess = function(docs){
							default_req.onSuccess.attempt([docs], self);
							if(req.onSuccess)
								req.onSuccess.attempt([docs], self);
						};
						
						self.historical_request[key] = new Request.JSON(
							Object.merge(
								Object.clone(default_req),
								req,
								{'onSuccess': onSuccess.bind(self)}
							)
						);
						/**
						 * */
						 
						self.fireEvent(self.ON_HISTORICAL_REQUEST_DEFINED, key);
					}.bind(this);
					
					
					
					//self.db.query('status/by_path_host', {
						//descending: true,
						//inclusive_end: true,
						//include_docs: true,
						////limit: 1,
						//startkey: [ doc_key, 'localhost.colo￰', end_range],
						//endkey: [ doc_key, 'localhost.colo', start_range] 
						////startkey: [ doc_key, 'localhost.colo￰'],
						////endkey: [ doc_key, 'localhost.colo'] 
					//})
					self.db.allDocs({//it's suppose to be faster than query
						descending: true,
						inclusive_end: true,
						include_docs: true,
						//limit: 1,
						startkey: 'localhost.colo.'+doc_key+'@'+end_range+'\uffff',
						endkey: 'localhost.colo.'+doc_key+'@'+start_range
						//startkey: 'localhost.colo.'+doc_key+'\uffff',
						//endkey: 'localhost.colo.'+doc_key
					})
					.then(function (response) {
						//console.log('status/by_path_host/'+doc_key);
						//console.log(response);
						
						
						if(response.rows[0]){//there is a doc
							/**
							 * first doc, always has the bigest timestamp, so the Request will start from here
							 * */
							start_range = response.rows[0].doc.metadata.timestamp;
							
							var docs = [];
							//for(var i = response.rows.length - 1; i>= 0; i--){
								//docs.push(response.rows[i].doc);
							//}
							Array.each(response.rows, function(row){
								docs.push(row.doc);
							});
							
							////console.log(docs);
							
							req.onSuccess.attempt([docs], self);
							
						}
						
						prepare_requests();
						//else{
							//throw new Error('no doc');
						//}
						
					})
					.catch(function (err) {
						//console.log(err);
						prepare_requests();
						
					}.bind(this));
					
					
				}
				
			}.bind(this));
		},
		//_define_queued_requests: function(){
			
			////var requests = {};
			////requests = Object.merge(requests, this.timed_request);
			
			//this.timed_request_queue = new Request.Queue({
				//requests: this.timed_request,
				//stopOnFailure: false,
				////concurrent: 10,
				//onComplete: function(name, instance, text, xml){
						//////////////console.log('queue: ' + name + ' response: ', text, xml);
				//}
			//});
			
			//this.historical_request_queue = new Request.Queue({
				//requests: this.historical_request,
				//stopOnFailure: false,
				////concurrent: 10,
				//onComplete: function(name, instance, text, xml){
						//////////////console.log('queue: ' + name + ' response: ', text, xml);
				//}
			//});
			
		//}.protect(),
		
	});

	if(mainBodyModel){
		console.log('mainBodyModel');
		os_dashboard_page = new OSDashBoardPage();
	}
	else{
		console.log('no mainBodyModel');
		
		root_page.addEvent(root_page.STARTED, function(){									
			os_dashboard_page = new OSDashBoardPage();
		});
	}	
	
	
});
