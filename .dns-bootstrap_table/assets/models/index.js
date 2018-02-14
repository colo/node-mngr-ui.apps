var Pagination = new Class({
	Implements: [Options, Events],
	
	total_count: 0,
	total_pages: 1,
	
	main_checkbox: null,
	url: '',
		
	disabled: {
		first: ko.observable(true),
		prev: ko.observable(true),
		next: ko.observable(false),
		last: ko.observable(false)
	},
	
	links: ko.observable({
		first: null,
		prev: null,
		next: null,
		last: null,
	}),
	
	//checked: new Array(),//array of checkbox.value checked
	checked: [],
	
	options : {
		//url: '',
		items_per_page: 0,
		main_checkbox: null,
		elements: null
	},
	
	initialize: function(options){
		var self = this;
		
		this.setOptions(options);
		
		//this._update_els();
		
		var handle = ko.tasks.schedule(function () {
			console.log('ko.tasks.schedule');
			self.main_checkbox = document.id(self.options.main_checkbox);
		});
	},
	/**
	 * don't use it to check the "toogle all" checkbox
	 * */
	check: function(el){
		var self = this;
		var checkbox = el;//input checkbox
		
		self.checked.include(checkbox.value);//pushes the passed element into the array if it's not already present (case and type sensitive).
		
		el.checked = true;
		
		//console.log('checked array');
		//console.log(self.checked);
		return true;
	},
	
	/**
	 * don't use it to uncheck the "toogle all" checkbox
	 * */
	uncheck: function(el){
		var self = this;
		var checkbox = el;//input checkbox
		
		if(self.checked.contains(checkbox.value)){
			//console.log('checkbox data');
			//console.log(checkbox.value);
			self.checked = self.checked.erase(checkbox.value);
		}
		
		el.checked = false;
		
		//console.log('checked array');
		//console.log(self.checked);
		return true;
	},
	
	toggle_all: function(el){//receives the "toogle all" element
		var self = this;
		var els = document.getElementsByName(this.options.elements);//get all labels by "name"
		
		if(el.checked){
			el.checked = true;
			
			Array.each(els, function(el){
				self.check(el);
			});
		}
		else{//uncheck all
			el.checked = false;
			
			Array.each(els, function(el){
				self.uncheck(el);
			});
		}
		return true;
	},
	
	/**
	 * don't use it to toogle the "toogle all" checkbox
	 * */
	toggle: function(el){
		var self = this;
		//console.log(el.checked);
		
		if(el.checked){
			self.check(el);
			
			var els = document.getElementsByName(this.options.elements);//get all labels->checkbox by "name"
			self._toogle_main_checkbox(els);
		}
		else{
			self.uncheck(el);
			self.check_main(false);
		}
		
		//return el.checked;
		return true;
	},
	
	/**
	 * check the checkboxs that were previously checked (made selection persistant on page change/back and forth)
	 * 
	 * */
	check_checked: function(){
		var self = this;
		console.log('check_checked');
		
		var els = document.getElementsByName(this.options.elements);
		
		Array.each(els, function(el){
			var checkbox = el;//input checkbox
			
			if(self.checked.contains(checkbox.value)){
				el.checked = true;
			}
		});
		
		self._toogle_main_checkbox(els);
	},
	//set_main_checkbox: function(el){
		//this.main_checkbox = el;
	//},
	check_main: function(bool){
		console.log('check_main');
		console.log(bool);
		
		//this.main_chkbox = document.getElementById(this.options.main_checkbox);//get "toggle all" checkbox
		
		//var self = this;
		
		if(this.main_checkbox)//may not be present on views with no checkbox
			this.main_checkbox.checked = bool;
	},
	page_url: function(){
		var self = this;
		
		var url = '?first='+self.options.items_per_page;
		
		if(getURLParameter('last') && getURLParameter('last') >= 0){
			url = '?last='+getURLParameter('last');
		}
		else if(getURLParameter('start') && getURLParameter('start') >= 0){
			url = '?start='+getURLParameter('start');
			
			if(getURLParameter('end') && getURLParameter('end') >= 0){
				
				//don't allow to set more "items per page" than configured
				if((getURLParameter('end') - getURLParameter('start')) > (self.options.items_per_page - 1)){
					var end = new Number(getURLParameter('start')) + (self.options.items_per_page - 1);
					url += '&end='+end;
				}
				else{
					url += '&end='+getURLParameter('end');
				}
			}
			else{
				var end = new Number(getURLParameter('start')) + (self.options.items_per_page - 1);
				url += '&end='+end;
			}
		}
		
		return url;
	},
	set_page: function(res){
		var self = this;
		/**
		 * @pagination
		 * 
		 * */
		self.check_main(false);
		
		if(res.status == 206){//partial content
			self.total_count = res.headers['Content-Range'].split('/')[1];
			self.total_pages = Math.ceil(self.total_count / self.options.items_per_page);
		}
		else{
			self.total_pages = 1;
			self.total_count = res.data.length;
		}
		
		if(self.total_pages > 1){
			console.log('self.url');
			console.log(self.url);
			
			if(new RegExp(/first\=/).test(self.page_url()) ||
				new RegExp(/start\=0/).test(self.page_url())){//first page of pages > 1
					
				console.log('first page');
				self.disabled.first(true);
				self.disabled.prev(true);
				self.disabled.next(false);
				self.disabled.last(false);
				
				//self.current_page = 1;
			}
			else if(new RegExp(/\?last\=/).test(self.page_url()) ||
				new RegExp('end\='+new Number(self.total_count - 1)).test(self.page_url())){//last page of pages > 1
					
				console.log('last page');
				self.disabled.first(false);
				self.disabled.prev(false);
				self.disabled.next(true);
				self.disabled.last(true);
			
				//self.current_page = pagination.options.total_pages;
				
			}
			else{
				self.disabled.first(false);
				self.disabled.prev(false);
				self.disabled.next(false);
				self.disabled.last(false);
			}
		}
		else{//no more than 1 page, disable all
			self.disabled.first(true);
			self.disabled.prev(true);
			self.disabled.next(true);
			self.disabled.last(true);
			
			//self.current_page = 1;
		}
		
		console.log('li.parse(res.headers.Link).first');
		console.log(li.parse(res.headers.Link).first);
		
		//var first = new String(
			//li.parse(res.headers.Link).first.replace(self.options.url, '')+
			//'='+self.options.items_per_page
		//).replace('/', '');
		
		var first = new String(
			
			li.parse(res.headers.Link).first.match(new RegExp(/\/[^\/]+$/g))+
			'='+self.options.items_per_page
		).replace('/', '');
		
		console.log('first');
		console.log(first);
		
		//var prev = new String(li.parse(res.headers.Link).prev.replace(self.options.url, '')).replace('/', '');
		var prev = new String(li.parse(res.headers.Link).prev.match(new RegExp(/\/[^\/]+$/g))).replace('/', '');
		
		
		console.log('prev');
		console.log(prev);
		
		//var next = new String(li.parse(res.headers.Link).next.replace(self.options.url, '')).replace('/', '');
		var next = new String(li.parse(res.headers.Link).next.match(new RegExp(/\/[^\/]+$/g))).replace('/', '');
		
		console.log('next');
		console.log(next);
		
		/**
		 * use 'start&end', 'last=N' "modifies" the number of "items per page" (not the variable)
		 * 
		 * var last_items = last_end - last_start;
		 * var last = new String(li.parse(res.headers.Link).last.replace(self.options.url, '')+'='+last_items).replace('/', '');
		 * */
		var last_start = (self.total_pages - 1) * self.options.items_per_page;
		var last_end = self.total_count - 1;
		var last = '?start='+last_start+'&end='+last_end;
		
		self.links({
			first: first,
			prev: prev,
			next: next,
			last : last
		});
		
			
		//console.log('navigate');
		//console.log(URI);
		//console.log(self.url);
		
		//componentHandler.upgradeDom();
		//this._update_els();
		
		self.check_checked();
		/**
		 * @end pagination
		 * 
		 * */
	},
	//_update_els: function(){
		//console.log('_update_els');
		//if(this.main_checkbox){
			//console.log('this.main_checkbox');
			//console.log(this.main_checkbox);
		//}
		//else{
			//console.log('NO this.main_checkbox');
			//this.main_checkbox = this.options.main_checkbox;//get "toggle all" checkbox
		//}
		
	//},
	/**
	 * @private: toggle check/uncheck the "toggle all" check box if all elements are check or not
	 * 
	 * */
	_toogle_main_checkbox: function(els){
		var self = this;
		
		//var main_chkbox = document.getElementById('data_chkbox');//get "toggle all" checkbox
		
		//if(main_chkbox){//may not be present on views with no checkbox
			
			//var els = document.getElementsByName('lbl_data_chkbox');//get all labels->checkbox by "name"
			
			try{
				Array.each(els, function(el){//if all checked, check main one
					if(!el.checked){
						throw new Error();
					}
				});
				
				self.check_main(true);
			}
			catch(e){
				self.check_main(false);
			}
			
		//}
		
		return true;
	}
});

var DNSModel = new Class({
	Implements: [Options, Events],
	
	zones: null,
	pagination: null,
	
	options : {
		pagination: {
			items_per_page: 10,
			main_checkbox: 'data_chkbox',
			elements: 'data_chkbox',
		},
	},
	
	
	initialize: function(options){
		var self = this;
		
		this.setOptions(options);
		
		//self.zones = ko.observableArray([
		//]);
		self.zones = ko.observable({});
		
		self.zones.subscribe( function(value){
			console.log('self.zones');
			console.log(self.zones());
					
			//self.fireEvent(self.ON_MODEL+'_'+app.id, value);
			$('#zones-table').bootstrapTable('load', self.zones());
		}.bind(this) );
		
		self.pagination = new Pagination(self.options.pagination);
		
		console.log(self.pagination.options);
		//console.log('dns server');
		//console.log(dns_server);
		
		var servers = [
				dns_server
		];
		
		var client = resilient({
			 service: { 
				 basePath: '/bind',
				 headers : { "Content-Type": "application/json" }
			 }
		});
		
		client.setServers(servers);
		
		self.URI = window.location.protocol+'//'+window.location.host+window.location.pathname;
		
		load_page = function(URI, param){
			console.log('loading...');
			console.log('URI: '+URI);
			console.log('param: ');
			console.log(param);
			
			client.get('/zones/'+param, function(err, res){
				if(err){
					console.log('Error:', err);
					console.log('Response:', err.data);
				}
				else{
					console.log('Ok:', res);
					console.log('Body:', res.data);
					console.log('headers');
					console.log(res.headers);
					
					//self.zones(res.data);
					var zones = [];
					Array.each(res.data, function(zone){
						zones.push({zone: zone});
					});
					
					self.zones({
						total: res.headers['Content-Range'].split('/')[1],
						rows: zones
					});
					
					pager.navigate(URI+param);//modify browser URL to match current request 
					
					self.pagination.set_page(res);
					
				}
			});
		};
	
		//load_page(self.URI, self.pagination.page_url());
		
		var myCustomSearch = function(text){
			console.log('do remote search of text');
		};
		
		var myCustomSort = function(sortName, sortOrder) {
			console.log('do remote sort');
		};
		
		var handle = ko.tasks.schedule(function () {
			/**
			 * https://github.com/wenzhixin/bootstrap-table
			 * */
			 
			$('#zones-table').bootstrapTable({
				columns: [
					{
							field: 'id',
							title: '',
							checkbox: true
					},
					{
							field: 'zone',
							title: 'Zones',
					},
				],
				striped: true,
				pagination: true,
				sidePagination: 'server',
				search: true,
				//showColumns: true
				showRefresh: true,
				//showToggle: true,
				//showPaginationSwitch: true,
				customSearch: myCustomSearch,
				customSort: myCustomSort,
				
				maintainSelected: true,
				sortable: true,
				paginationFirstText: '|<',
				paginationLastText: '>|',
				
				onPageChange: function(number, size){
					console.log('notify page change ');
					console.log('num '+number);
					console.log('size '+size);
				}
			});
			
			load_page(self.URI, self.pagination.page_url());
		});
		//mainBodyModel.addEvent(mainBodyModel.ON_MODEL+'_dns', function(){
			//console.log('mainBodyModel.ON_MODEL_dns');
			//console.log(document.id('data_chkbox'));
			//self.pagination.set_main_checkbox(document.getElementById('data_chkbox'));
		//});
	},
	
});


/**
 * http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
 * 
 * */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = DNSModel;
}
else {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			return DNSModel;
		});
	}
	else {
		window.DNSModel = DNSModel;
	}
}
