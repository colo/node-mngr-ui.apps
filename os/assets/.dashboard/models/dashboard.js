var OSDashboardModel = new Class({
	Implements: [Options, Events],
	
	/** - */
	GB: (1024 * 1024 * 1024),
	MB: (1024 * 1024 ),
	KB: 1024,
	
	D: (60 * 60 * 24),//day
	W: (60 * 60 * 24 * 7),//week
	
	cpu_usage_prev_percentage: 0,
	cpu_usage: {
		user: 0,
		nice: 0,
		sys: 0,
		idle: 0
	},
	//started: 0, //timestamp updated on index.js
	
	plot: null,
	plot_data: [],
	plot_data_order: [
		'cpus',
		'loadavg',
		'freemem',
		function(){
			console.log('plot_data_order.blockdevices');
			//console.log(this);
			var stats = [];
			
			Object.each(this.blockdevices, function(dev, name){
				//console.log(name+'_stats');
				stats.push(name+'_stats');
			}.bind(this));
			
			return stats;
			//return ['sda_stats'];
		},
		function(){
			var mounts = [];
			Array.each(this.mounts, function(mount, index){
				
				if(this.options.list_partitions_types.test(mount.type())){
					mounts.push(this.mounts[index].mount_point()+'_used');
				}
			}.bind(this));
			
			return mounts;
		}
	],
	//plot_data_order: ko.observableArray(['cpus', 'loadavg', 'freemem']),
	//plot_data_last_update: 0,
	//plot_data_update: 0,
	
	periodical_functions: {
		'plot_update':{
			'fn': null,
			'interval': 0
		},
	},
	periodical_functions_timers : {},
	
	options : {
		current_size_base: 'GB',
		current_time_base: 'D',
		list_partitions_types: /ext|xfs/,
		
		blockdevice_chart: {
			type: 'doughnut',
			tooltipFillColor: "rgba(51, 51, 51, 0.55)",
			data: {
				labels: [],
				datasets: [{
					data: [],
					backgroundColor: [
						"#BDC3C7",//aero
						"#9B59B6",//purple
						"#E74C3C",//red
						"#26B99A",//green
						"#3498DB"//blue
					],
					hoverBackgroundColor: [
						"#CFD4D8",
						"#B370CF",
						"#E95E4F",
						"#36CAAB",
						"#49A9EA"
					]
				}]
			},
			options: {
				legend: false,
				responsive: false
			}
		},
		timed_plot: {
			_defaults: {
				//series: {
					//lines: {
						//show: false,
						//fill: true
					//},
					//splines: {
						//show: true,
						//tension: 0.4,
						//lineWidth: 1,
						//fill: 0.4
					//},
					//points: {
						//radius: 0,
						//show: true
					//},
					//shadowSize: 2
				//},
				series: {
					lines: {
						show: true,
						fill: false
					},
					splines: {
						show: false,
						tension: 0.4,
						lineWidth: 1,
						fill: 0.4
					},
					points: {
						radius: 0,
						show: true
					},
					shadowSize: 0
				},
				grid: {
					verticalLines: true,
					hoverable: true,
					clickable: true,
					tickColor: "#d5d5d5",
					borderWidth: 1,
					color: '#fff'
				},
				colors: ["rgba(38, 185, 154, 0.38)", "rgba(3, 88, 106, 0.38)", "rgba(215, 96, 139, 0.2)", "rgba(223, 129, 46, 0.4)"],
				xaxis: {
					tickColor: "rgba(51, 51, 51, 0.06)",
					mode: "time",
					tickSize: [1, "minute"],
					//minTickSize: [1, "second"],
					//tickLength: 10,
					axisLabel: "Date",
					axisLabelUseCanvas: true,
					axisLabelFontSizePixels: 12,
					axisLabelFontFamily: 'Verdana, Arial',
					axisLabelPadding: 10
				},
				yaxis: {
					max: 100,
					ticks: 10,
					tickColor: "rgba(51, 51, 51, 0.06)",
				},
				tooltip: false
			},
			
			update_interval: 1000,
		}
		
	},
	
	/** - */
	initialize: function(options){
		var self = this;
		
		this.setOptions(options);
		
		this.plot_resources = ko.observableArray();
		this.add_plot_resources(this.plot_data_order);
		
		this.header = ko.pureComputed(function(){
			return this.hostname()+' ['+this.type() +' '+this.release()+' '+this.arch()+']';
		}.bind(this));
		
		this.user_friendly_cpus = ko.pureComputed(function(){
			return this.cpus()[0].model+' @ '+this.cpus()[0].speed;
		}.bind(this));
		
		//this.user_friendly_uptime = {
			//icon: 'fa-clock-o',
			//title: 'Uptime (days)',
			
		//};
			
		/**
		 * tile_stats_count
		 * */
		this.tile_stats_count_uptime = ko.pureComputed(function(){
			
			return {
				icon: 'fa-clock-o',
				title: 'Uptime (days)',
				value: (this.uptime() / this[this.options.current_time_base]).toFixed(0),
				bottom: {
					value: 'Max uptime: ?'
				}
			};
			
		}.bind(this));
		
		this.tile_stats_count_cpus_usage = ko.pureComputed(function(){
			var cpu_usage = this._process_cpu_usage(this.cpus());
			
			var percentage = this.cpu_usage_percentage(this.cpu_usage, cpu_usage);
			
			//this.cpu_usage = cpu_usage;
			
			return {
				icon: 'fa-clock-o',
				title: 'CPU Usage',
				value: percentage.usage,
				bottom: {
					value: percentage.user+' | '+percentage.nice+' | '+percentage.sys
				}
			};
			
		}.bind(this));
		
		this.tile_stats_count_primary_iface = ko.pureComputed(function(){
			//console.log('this.primary_iface()');
			//console.log(this.primary_iface());
			
			return {
				icon: 'fa-cog',
				title: this.primary_iface() +' IFace',
				value: this.primary_iface_out(),
				bottom: {
					value: this.primary_iface_in(),
				}
			};
			
		}.bind(this));
		
		this.tile_stats_count_memory = ko.pureComputed(function(){
			
			return {
				icon: 'fa-cog',
				title: 'Free Memory (GB)',
				value: this.user_friendly_freemem(),
				bottom: {
					value: 'Total: '+this.user_friendly_totalmem()
				}
			};
			
		}.bind(this));
		
		this.tile_stats_count_loadavg = ko.pureComputed(function(){
			var arr = [];
			
			Array.each(this.loadavg(), function(item, index){
				arr[index] = item.toFixed(2);
			}.bind(this));
			
			
			return {
				icon: 'fa-clock-o',
				title: 'Load Average',
				value: arr[0],
				bottom: {
					value: arr[1]+' | '+arr[2]
				}
			};
			
		}.bind(this));
		/**
		 * tile_stats_count
		 * */
		 
		this.user_friendly_uptime = ko.pureComputed(function(){
			return (this.uptime() / this[this.options.current_time_base]).toFixed(0);
		}.bind(this));
		
		
		
		this.user_friendly_cpus_usage = ko.pureComputed(function(){
			var cpu_usage = this._process_cpu_usage(this.cpus());
			
			var percentage = this.cpu_usage_percentage(this.cpu_usage, cpu_usage);
			
			this.cpu_usage = cpu_usage;
			return percentage;
			
		}.bind(this));
		
		
		this.primary_iface_out = ko.pureComputed(function(){
			return (this.networkInterfaces[this.primary_iface()]().transmited.bytes / this[this.options.current_size_base]).toFixed(2);
		}.bind(this));
		
		this.primary_iface_in = ko.pureComputed(function(){
			return (this.networkInterfaces[this.primary_iface()]().recived.bytes / this[this.options.current_size_base]).toFixed(2);
		}.bind(this));
		
		
		
		this.user_friendly_totalmem = ko.pureComputed(function(){
			return (this.totalmem() / this[this.options.current_size_base]).toFixed(2);
		}.bind(this));
		
		this.user_friendly_freemem = ko.pureComputed(function(){
			return (this.freemem() / this[this.options.current_size_base]).toFixed(2);
		}.bind(this));
		
		this.user_friendly_loadavg = ko.pureComputed(function(){
			var arr = [];
			
			Array.each(this.loadavg(), function(item, index){
				arr[index] = item.toFixed(2);
			}.bind(this));
			
			return arr;
			
		}.bind(this));
		
		this.list_blk_dev = ko.pureComputed(function(){
			
			var arr = [];
			
			var colors=["aero", "purple", "red", "green",  "blue"];//class="fa fa-square $color", has to match Chart order
			
			Object.each(this.blockdevices, function(dev, name){
				////console.log(dev);
				
				var info = {};
				
				info.name = name;
				info.size = dev.size();
				
				info.partitions = [];
				//info.partitions = dev[info.name].partitions();
				var index = 0;
				Object.each(dev.partitions(), function(part, key){
					
					var part_info = {};
					part_info.name = key;
					part_info.size = part.size;
					part_info.percentage = (part_info.size * 100 / info.size).toFixed(2);
					
					part_info.color = colors[index];
					
					info.partitions.push(part_info);
					index++;
				}.bind(this));
				
				arr.push(info);
				//arr.append(Object.keys(dev));
			}.bind(this));
			
			
			return arr;
		}.bind(this));
		
		this.list_mounts = ko.pureComputed(function(){
			
			var mounts = [];
			Array.each(this.mounts, function(mount){
				
				if(this.options.list_partitions_types.test(mount.type())){
					var info = {};
					info.percentage = mount.percentage();
					info.point = mount.mount_point();
					info.fs = mount.fs();
					info.size = '?';
					
					//////console.log(info.fs);
					
					Array.each(this.list_blk_dev(), function(dev){
						var name = Object.keys(dev)[0];
						Array.each(dev.partitions, function(part){
							////////console.log('PART');
							////////console.log(part);
							
							if(new RegExp(part.name).test(info.fs)){//if mount point is on listed partitions, we can get szie in bytes
								info.size = (part.size / this[this.options.current_size_base]).toFixed(0)+ "GB";
							}
							
						}.bind(this));
					}.bind(this));
					
					mounts.push(info);
				}
			}.bind(this));
			
			//////console.log(mounts);
			return mounts;
			
		}.bind(this));
		
		
		ko.bindingHandlers.load_chart = {
			init: function(element, valueAccessor) {
					var name = ko.unwrap(valueAccessor()); // Get the current value of the current property we're bound to
					
					var dev = self.blockdevices[name];
					
					var size = dev.size();
					
					var blockdevice_chart = Object.clone(self.options.blockdevice_chart);
					
					blockdevice_chart.data.labels = Object.keys(dev.partitions());
					
					Object.each(dev.partitions(), function(part, key){
						
						var percentage = (part.size * 100 / size).toFixed(2);
						blockdevice_chart.data.datasets[0].data.push(percentage);
						
					})
					new Chart(element, blockdevice_chart)
					
			},
			update: function(element, valueAccessor, allBindings) {
					// Leave as before
			}
		};
		
		//head.ready("flot_curvedLines", function(){
			////////console.log('_load_plot');
			//this._load_plot();
		//}.bind(this));
		var handle = ko.tasks.schedule(function () {
				console.log('my microtask');
				
				this._load_plot();
				
				//////console.log(ko.isObservable(this.blockdevices.sda.stats));
				
				this.user_friendly_cpus_usage.subscribe( function(oldValue){
					//console.log('this.user_friendly_cpus_usage.beforeChange');
					//console.log(oldValue);
					this.cpu_usage_prev_percentage = oldValue;
					
				}.bind(this), null, "beforeChange");
				
				//this.cpus.subscribe(function(oldValue) {
					//console.log('this.cpus().subscribe.beforeChange');
					////if(!oldValue.timestamp)
						////oldValue.timestamp = this.blockdevices.timestamp;
					
					//this.cpu_usage = oldValue;
						
				//}.bind(this), null, "beforeChange");
					
				this.user_friendly_cpus_usage.subscribe( function(value){
					//console.log('this.user_friendly_cpus_usage.subscribe');
					//console.log(this['cpus_timestamp'] || this.timestamp);
					//console.log(Date.now().getTime());
					//console.log(this.cpu_usage);
					
					var timestamp = this['cpus_timestamp'] || this.timestamp;
					this._update_plot_data('cpus', value['usage'].toFloat(), timestamp);
					
				}.bind(this) );
				
				//this.freemem.subscribe(function(){
				this.user_friendly_freemem.subscribe(function(){
					this._update_plot_data('freemem', (((this.totalmem() - this.freemem()) * 100) / this.totalmem()).toFixed(2));
				}.bind(this));
				
				this.user_friendly_loadavg.subscribe(function(value){
					this._update_plot_data('loadavg', value[0].toFloat());
				}.bind(this));
				
				Object.each(this.blockdevices, function(dev, name){
					//this.blockdevices[name].partitions.subscribe(function(oldValue) {
						//console.log('this.blockdevices[name].partitions.subscribe');
						//console.log(oldValue);
					//}.bind(this), null, "beforeChange");
					
					this.blockdevices[name].stats.subscribe(function(oldValue) {
							
							if(!oldValue.timestamp)
								oldValue.timestamp = this.blockdevices.timestamp;
							
							this.blockdevices[name]._prev_stats = oldValue;
							
					}.bind(this), null, "beforeChange");
					
					this.blockdevices[name].stats.subscribe( function(value){
						//console.log('this.blockdevices['+name+'].stats.subscribe');
						//console.log(value);
						/**
						 * each messure spent on IO, is 100% of the disk at full IO speed (at least, available for the procs),
						 * so, as we are graphing on 1 second X, milliseconds spent on IO, would be % of that second (eg: 500ms = 50% IO)
						 * 
						 * */
						var data = this._blockdevice_percentage_data(this.blockdevices[name]._prev_stats, value);
						
						this._update_plot_data(name+'_stats', data, value.timestamp);
						
						
					}.bind(this) );
				
				}.bind(this));
				
				//Array.each(this.mounts, function(mount, index){
				
					//if(this.options.list_partitions_types.test(mount.type())){
						////console.log('this.mounts[index].percentage.subscribe');
						
						////this.mounts[index].percentage.subscribe( function(oldValue){
							////console.log('this.mounts[index].percentage.beforeChange');
							////console.lg(mount.mount_point());
							////console.log(oldValue);
							////console.log(this.mounts.timestamp);
							
						////}.bind(this), null, "beforeChange");
						
						//this.mounts[index].percentage.subscribe( function(value){
							//console.log('this.mounts[index].percentage.subscribe');
							//console.log(this.mounts[index].mount_point());
							//console.log(this.mounts[index]);
							//console.log(value);
							
							//this._update_plot_data(this.mounts[index].mount_point()+'_used', value, this.mounts[index].timestamp);
							
						//}.bind(this) );
						
					//}
				//}.bind(this));
				


				
		}.bind(this));
		
		this.periodical_functions['plot_update']['fn'] = function(){
			//console.log('update_plot');
			
			var last_minutes = Date.now().getTime() - 120000;
			var old_data = this.plot.getData();
			
			
			Array.each(old_data, function(data, index){
				
				var new_data = [];
				var raw_data = data.data;
				for(var i = 0; i < raw_data.length; i++){
					
					if(raw_data[i][0] >= last_minutes){//if timestamp >= max time window to show
						new_data.push(raw_data[i]);
					}
				}
				
				this.plot_data[index] = new_data;
			}.bind(this));
			
			
			this.plot = $.plot($("#canvas_dahs"),
				//raw_data
				this.plot_data,
				this.options.timed_plot._defaults
			);
		}.bind(this);
		
		this.periodical_functions['plot_update']['interval'] = this.options.timed_plot.update_interval;
	},
	resource_to_plot: function(name){
		
		var resource = {};
		index = this.plot_resources().length;
		resource.name = name;
		
		if(!this.options.timed_plot._defaults.colors[index])
			this.options.timed_plot._defaults.colors[index] = randomColor({
				 luminosity: 'dark',
				  hue: 'orange',
				 format: 'rgba'
			});
				
		resource.rgba = this.options.timed_plot._defaults.colors[index];//if not rgba, should generate one
		
		return resource;
		//this.plot_resources().push(resource);
		//console.log('add resource to plot');
		//console.log(resource);
		//console.log(this.plot_resources());
	},
	add_plot_resources: function(resources){
		Array.each(resources, function(resource){
			
			if(typeOf(resource) == 'function'){//function should return an array
				this.add_plot_resources(resource.attempt(null, this));
			}
			else{
				this.plot_resources().push( this.resource_to_plot(resource) );
			}
			
		}.bind(this));
	},
	cpu_usage_percentage: function(old_data, new_data){
		
		var new_info = {
			user: 0,
			nice: 0,
			sys: 0,
			idle: 0
		};
		
		//var last = this.cpu_usage.length -1;
		
		var user = new_data.user - old_data.user;
		var nice = new_data.nice - old_data.nice;
		var sys = new_data.sys - old_data.sys;
		var idle = new_data.idle - old_data.idle;
		
		//console.log('cpu_usage_percentage');
		//console.log(old_data);
		//console.log(new_data);
		/**
		 * may result on 0 if there are no new docs on database and the data we get if always from last doc
		 * 
		* */
		//new_info.user = (user <= 0) ? old_data.user : user;
		//new_info.nice = (nice <= 0) ? old_data.nice : nice;
		//new_info.sys =  (sys <= 0)  ? old_data.sys : sys;
		//new_info.idle = (idle <= 0) ? old_data.idle : idle;
		
		new_info.user = (user <= 0) ? 0 : user;
		new_info.nice = (nice <= 0) ? 0 : nice;
		new_info.sys =  (sys <= 0)  ? 0 : sys;
		new_info.idle = (idle <= 0) ? 0 : idle;
		
		//////console.log('new_info');
		//////console.log(new_info);
		
		var total_usage = 0;
		var total_time = 0;
		Object.each(new_info, function(value, key){
			if(key != 'idle'){
				total_usage += value;
			}
			total_time += value;
		});
		
		
		var percentage = {
			user: 0,
			nice: 0,
			sys: 0,
			idle: 0,
			usage: 0
		};
		
		if(total_time > 0){
			percentage = {
				user: ((new_info.user * 100) / total_time).toFixed(2),
				nice: ((new_info.nice * 100) / total_time).toFixed(2),
				sys: ((new_info.sys * 100) / total_time).toFixed(2),
				idle: ((new_info.idle * 100) / total_time).toFixed(2),
				usage: ((total_usage * 100) / total_time).toFixed(2)
			};
		}
		
		return percentage;
	},
	_process_cpu_usage: function(cpus){
		var cpu_usage = {
			user: 0,
			nice: 0,
			sys: 0,
			idle: 0
		};
		
		Array.each(cpus, function(cpu){
				
			cpu_usage.user += cpu.times.user;
			cpu_usage.nice += cpu.times.nice;
			cpu_usage.sys += cpu.times.sys;
			cpu_usage.idle += cpu.times.idle;

		}.bind(this));
		
		return cpu_usage;
	},
	_blockdevice_percentage_data(oldValue, newValue){
		//oldValue.timestamp = oldValue.timestamp || newValue.timestamp - 5000; //last doc.timestamp - prev.doc.timestamp (aproximate value, polling time)
		
		var time_diff = newValue.timestamp - oldValue.timestamp;
		var io_ticks = newValue.io_ticks - oldValue.io_ticks;//milliseconds, can't be greater than time_diff
		
		
		var data = 0;
		
		if(io_ticks == 0 && time_diff == 0){
			data = 0;
		}
		else if(io_ticks >= time_diff){
			data = 100; //busy all the time, 100%
		}
		else{
			data = ((io_ticks * 100) / time_diff).toFloat().toFixed(2);
		}
		
		//console.log('sda_stats percentage');
		//console.log(data);
					
		return data;
	},
	_load_plot: function(){
					
		Array.each(this.plot_resources(), function(type){//add an empty array for each data type to plot
			this.plot_data.push([]);
		}.bind(this));
		
		this.plot = $.plot($("#canvas_dahs"), this.plot_data, this.options.timed_plot._defaults);
		
		
	},
	_update_plot_data: function(type, new_data, timestamp){
		var timestamp_key = type+'_timestamp';
		var timestamp = timestamp || (this[timestamp_key] || this.timestamp);
		
		//this.plot_data_last_update = this.plot_data_update;
		//var now = Date.now().getTime();
		
		//if(!timestamp){
			//console.log({type: type, data: new_data});
			////throw new Error({type: type, data: new_data});
		//}
		
		//timestamp = timestamp || now;
		
		//console.log('_update_plot_data: '+type);
		////if(type == 'freemem'){
			//console.log('_update_plot_data timestamp: '+new Date(timestamp).toString());
			//console.log('_update_plot_data data: '+new_data);
		////}
		
		//var index = this.plot_resources().indexOf(type);
		
		var index = -1;
		
		Array.each(this.plot_resources(), function(res, i){
			if(type == res.name)
				index = i;
		});
		
		
		if(index >= 0 && this.plot && this.plot.getData()){
			
			
			var old_data = this.plot.getData();
			var raw_data = [];
			
			raw_data = old_data[index].data;
			
			if(typeOf(new_data) == 'array'){
				for(var i = 0; i < new_data.length; i++ ){
					raw_data.push([timestamp, new_data[i] ]);
				}
			}
			else{
				raw_data.push([timestamp, new_data ]);
			}
			
			this.plot_data[index] = raw_data;
			
		}
	},

});

/**
	 * implemenets data (CouchDb/PouchDB) on Model
	 * */
OSDashboardModel.implement_data = function(data, id){
					
	delete data._id;
	delete data._rev;
	var timestamp = data.metadata.timestamp;
	//delete data.metadata;
	
	if(data.data)
		data = data.data;
	
	
	
	//var obj = ko.observable({});
	var obj = {};
	
	if(typeOf(data) == 'array'){	
		obj[id] = [];
		
		Array.each(data, function(value, key){
			//////////console.log(this.implementable_object(value, key)[key]);
			obj[id].push( Object.merge({ timestamp: timestamp}, OSDashboardModel.implementable_object(value, key)[key]));
			
			if(obj[id].length == Object.getLength(data)){
				
				//////console.log('IMPLEMENTING...');
				//////console.log(obj);
				
				OSDashboardModel.implement(obj);
			}
			
		});

	}
	else{
		obj[id] = {};
						
		Object.each(data, function(value, key){
			
			if(id != 'os'){
			
				//obj[id].push(this.implementable_object(value, key));
				//obj[id][key] = {};
				obj[id] = Object.merge(obj[id], OSDashboardModel.implementable_object(value, key));
				
				//if(obj[id].length == Object.getLength(data)){
				
				if(Object.getLength(obj[id]) == Object.getLength(data)){
					obj[id]['timestamp'] = timestamp;
					OSDashboardModel.implement(obj);
				}
				
			}
			else{
				OSDashboardModel.implement({timestamp : timestamp});
				
				OSDashboardModel.implement(OSDashboardModel.implementable_object(value, key));
			}
			
		});
	}
};

/**
 * return an {} for Model.implement({})
 * */
OSDashboardModel.implementable_object = function(value, key){
	var obj = {};

	if(typeof(value) == 'object'){
		
		if(value[0]){//is array, not object
			obj[key] = ko.observableArray();
			Object.each(value, function(item, index){
				obj[key].push(item);
			});
		}
		else{
			obj[key] = {};
			Object.each(value, function(item, internal_key){
				obj[key][internal_key] = ko.observable(item);
			});

		}
		
		
		
	}
	else{
		//var obj = {};
		obj[key] = ko.observable(value);
		//OSDashboardModel.implement(obj);
	}
	
	return obj;
};

/**
 * http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
 * 
 * */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = OSDashboardModel;
}
else {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			return OSDashboardModel;
		});
	}
	else {
		window.OSDashboardModel = OSDashboardModel;
	}
}
