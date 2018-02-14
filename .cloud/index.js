'use strict'

var App = require('node-express-app'),
	path = require('path'),
	libvirt = require('node-libvirt'),
	Q = require('q');
	


module.exports = new Class({
  Extends: App,
  
  app: null,
  logger: null,
  authorization:null,
  authentication: null,
  
  options: {
	  
	  hypervisors: [
			{'host':'kvm01', 'ip': '192.168.0.254'},
			{'host':'kvm02', 'ip': '192.168.0.253'},
			{'host':'kvm03', 'ip': '192.168.0.252'},
			{'host':'kvm04', 'ip': '192.168.0.251'},
			{'host':'kvm05', 'ip': '192.168.0.250'}
	  ],
	  pools: [
			'default',
			'rbd',
	  ],
	  
	  ceph_rest_api_port:'5000',
	  
	  layout:{
			name: 'Cloud',
			description: 'Cloud',
			menu : {
				available: true,
				icon: 'fa-cog'
			},
			content: {
				available: true,
			}
		},
		
		id: 'cloud',
		path: '/cloud',
		
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
						path: 'hypervisors/:hv',
						callbacks: ['hv'],
						version: '',
					},
					{
						path: 'hypervisors',
						callbacks: ['hypervisors'],
						version: '',
					},
					{
						path: '/',
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
		res.jsonp("http://"+req.hostname+":8080");
	},
	hypervisors: function(req, res, next){
		var self = this;
		var hvs = this.options.hypervisors;
		
		var check_server = function(server){
			var deferred = Q.defer();
			server.hv.connect(function(err) {
				if (!err){
					server.connected = true;
					
					//server.hv.listActiveDomains(function(err, info) {  
						////console.log(server.hv); 
						////console.log(info); 
					//});
					
					server.hv.disconnect(function(err){
						if(!err)
							console.log('disconnected: '+server.ip);
					});
				}
				else{
					server.connected = false;
				}
				
				deferred.resolve(server);
			});
			
			return deferred.promise;
		};
		
		var check_servers = function(servers){
			var deferred = Q.defer();
			
			for(var index = 0; index < hvs.length; index++){
				check_server(hvs[index]).then(function(server){
					//console.log(server);
					//hvs[index] = server;
					
				}).done(
					//deferred.resolve(hvs)
				);
			};
			
			
			
			return deferred.promise;
		}
		
		check_servers(hvs).then(function(hvs){
			console.log(hvs);
			
		}).done(function(){
			res.json(
				hvs
			);
			}
		);
		//for(var index = 0; index < hvs.length; index++){
			//check_server(hvs[index]).then(function(server){
				//console.log(server);
			//});
		//}
			//var server = hvs[index];
			//console.log(server.hv);
			//function(done) {
				//server.hv.connect(function(err) {  
					//done();
				//});
			//}
			
			////server.hv.listActiveDomains(function(err, info) {  
					////console.log(info); 
				////});
			//////hvs[index].hv = new libvirt.Hypervisor('qemu+tcp://'+hvs[index].ip+'/system');
			////var hv = null;
			////hv = new libvirt.Hypervisor('qemu+tcp://'+hvs[index].ip+'/system').connect(function(err, status, hv) { 
				////console.log(hv);
					//////hv.listActiveDomains(function(err, info) {  
						//////console.log(info); 
					//////});
			////});
		//};
		
		//for(var index = 0; index < hvs.length; index++){
			
			//var hv = hvs[index].hv;
			//console.log(hv);
			//hv.connect(function(err) {  
					//hv.listActiveDomains(function(err, info) {  
						//console.log(info); 
					//});
			//});
		//};
		
		////hvs[index].hv.connect(function(err) {
				
			////console.log(index);	
			////console.log(server.hv);
					//////if (!err) {
						
						////////hvs[index].status = true;
						//////console.log("I'm connected!"); 
						//////server.hv.lookupStoragePoolByName('rbd', function(err, pool) {  
								//////pool.isActive(function(err, active) {
									//////if (!err) {
										//////if (active)
											//////console.log("pool active");
										
										//////pool.start(function(err, started) {
											//////if (!err) {
												//////console.log("pool started");
											//////}
											//////else{
											//////}console.log("ERROR: pool start");
											
										//////});
									//////}
									//////else{
										//////console.log("ERROR: pool active");
									//////}

								//////});
						//////});
					//////}
					
					
					
			////});
		//});
		
		
		//hvs[0].hv.connect(function(err) {  
				//hvs[0].hv.listActiveDomains(function(err, info) {  
					//console.log(info); 
				//});
		//});
		//hvs[4].hv.connect(function(err) {  
				//hvs[4].hv.listActiveDomains(function(err, info) {  
					//console.log(info); 
				//});
		//});
		
	},
	hv: function(req, res, next){
		console.log('req.params');
		console.log(req.params);
		res.json([
			{},
		]);
	},
  render: function(req, res, next){
		
		//console.log('Cloud render');
		
		if(!req.isAuthenticated()){
			res.status(403).redirect('/');
		}
		else{
			var view = Object.clone(this.express().get('default_view'));
			view.tile = "Cloud";
			
			view.apps.each(function(value, index){
				if(value.id == this.options.id){
					
					//value.role = 'start';
					view.apps[index]['role'] = 'start';
				}
				else{
					view.apps[index]['role'] = null;
				}
			}.bind(this));
			
			//view.body_scripts.push('"/cloud/api/server/?callback=update_view",');
			view.body_scripts.push('/public/apps/cloud/index.js');
			
			//view.body_script.push("var cloud_server = 'http://"+req.hostname+":8081';\n");
			//view.css.push('/public/apps/cloud/index.css');
			
			res.render(path.join(__dirname, '/assets/index'), view);
		}
  },
  
  initialize: function(options){
		this.profile('cloud_init');//start profiling
		
		this.parent(options);//override default options
		
		Array.each(this.options.hypervisors, function(server, index){
			server.hv = new libvirt.Hypervisor('qemu+tcp://'+server.ip+'/system');
		});
		
		this.profile('cloud_init');//end profiling
		
		this.log('cloud', 'info', 'cloud started');
  },
	
});

