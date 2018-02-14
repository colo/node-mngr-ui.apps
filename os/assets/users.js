var os_users_page = null;

/** Datatables JS */
//head.load('/public/bower/gentelella/vendors/datatables.net/js/jquery.dataTables.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-bs/js/dataTables.bootstrap.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons/js/dataTables.buttons.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons-bs/js/buttons.bootstrap.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons/js/buttons.flash.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons/js/buttons.html5.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons/js/buttons.print.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-fixedheader/js/dataTables.fixedHeader.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-keytable/js/dataTables.keyTable.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-responsive/js/dataTables.responsive.min.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-responsive-bs/js/responsive.bootstrap.js');
//head.load('/public/bower/gentelella/vendors/datatables.net-scroller/js/dataTables.scroller.min.js');
//head.load('/public/bower/gentelella/vendors/jszip/dist/jszip.min.js');
//head.load('/public/bower/gentelella/vendors/pdfmake/build/pdfmake.min.js');
//head.load('/public/bower/gentelella/vendors/pdfmake/build/vfs_fonts.js');

head.ready('mootools-more'
, function() {
	
	//head.js({ model: "/public/apps/os/models/users.js" }, function(){
		
		var OSUsersPage = new Class({
			Extends: Page,
			
			server: null,
			
			options: {
				assets: {
					html: {
						x_panel: {
							url: '/public/views/ko/x_panel.html',
							append: document.id("main-body"),
							ko_template: true
						},
						users_x_panel_content: {
							url: '/public/apps/os/templates/users_x_panel_content.html',
							append: document.id("main-body"),
							ko_template: true
						},
					},
					js: [
						{ model: "/public/apps/os/models/users.js" },
					//{ 'jq' : '/public/bower/gentelella/vendors/jquery/dist/jquery.min.js'},
					//{ 'bs': '/public/bower/gentelella/vendors/bootstrap/dist/js/bootstrap.min.js'},
					//{ 'fst_cl' : '/public/bower/gentelella/vendors/fastclick/lib/fastclick.js'},
					//{ 'nprog' : '/public/bower/gentelella/vendors/nprogress/nprogress.js'},
						{ datatables_deps: [
							{ 'dt': '/public/bower/gentelella/vendors/datatables.net/js/jquery.dataTables.min.js'},
							{ 'dt_bs_js': '/public/bower/gentelella/vendors/datatables.net-bs/js/dataTables.bootstrap.min.js'},
							{ 'dt_bttn_js': '/public/bower/gentelella/vendors/datatables.net-buttons/js/dataTables.buttons.min.js'},
							{ 'dt_bs_bttn_js': '/public/bower/gentelella/vendors/datatables.net-buttons-bs/js/buttons.bootstrap.min.js'},
							{ 'dt_bs_bttn_html5_js': '/public/bower/gentelella/vendors/datatables.net-buttons/js/buttons.html5.min.js'},
							{ 'dt_bs_bttn_print_js': '/public/bower/gentelella/vendors/datatables.net-buttons/js/buttons.print.min.js'},
							{ 'dt_fx_hd_js': '/public/bower/gentelella/vendors/datatables.net-fixedheader/js/dataTables.fixedHeader.min.js'},
							{ 'dt_kT_js' : '/public/bower/gentelella/vendors/datatables.net-keytable/js/dataTables.keyTable.min.js'},
							{ 'dt_resp_js': '/public/bower/gentelella/vendors/datatables.net-responsive/js/dataTables.responsive.min.js'},
							{ 'resp_bs_js': '/public/bower/gentelella/vendors/datatables.net-responsive-bs/js/responsive.bootstrap.js'},
							{ 'dt_scroll_sj': '/public/bower/gentelella/vendors/datatables.net-scroller/js/dataTables.scroller.min.js'},
							]
						}
					],
					css: {
						'index_css': '/public/apps/os/css/index.css',
						'dt_bs': '/public/bower/gentelella/vendors/datatables.net-bs/css/dataTables.bootstrap.min.css',
						'dt_bs_bttn': '/public/bower/gentelella/vendors/datatables.net-buttons-bs/css/buttons.bootstrap.min.css',
						'dt_bs_fxHd': '/public/bower/gentelella/vendors/datatables.net-fixedheader-bs/css/fixedHeader.bootstrap.min.css',
						'dt_bs_resp': '/public/bower/gentelella/vendors/datatables.net-responsive-bs/css/responsive.bootstrap.min.css',
						'dt_bs_scroll': '/public/bower/gentelella/vendors/datatables.net-scroller-bs/css/scroller.bootstrap.min.css'
					},
					jsonp: {
						update_server: '/os/api/server/'
					}
				},
			},
			
			initialize: function(options){
				var self = this;
								
				this.addEvent(this.JSONP_LOADED+'_update_server', function(data){
					this.server = data;
					
					//this._update_model(this.options.requests.update_model);
					
				}.bind(this));
				
				this.addEvent(this.ASSETS_SUCCESS, function(){
					console.log('os_users_page.ASSETS_SUCCESS');
					self.fireEvent(self.STARTED);
				});
				
				this.addEvent(this.STARTED, function(){
						
					if(mainBodyModel.os_users() == null){
						
						if(!self.model){
							self.model = new OSUsersModel();
							
							console.log('os_users binding applied');
						}
						
						mainBodyModel.os_users(self.model);
						
						//ko.tasks.schedule(this.start_timed_requests.bind(this));
						
					}
					else{
						self.model = mainBodyModel.os_users();
					}
					
					
				});
				
				this.parent(options);
			}
			
		});
											
		

	
	//});//model
	
	if(mainBodyModel){
		console.log('mainBodyModel');
		os_users_page = new OSUsersPage();
	}
	else{
		console.log('no mainBodyModel');
		
		root_page.addEvent(root_page.STARTED, function(){									
			os_users_page = new OSUsersPage();
		});
	}
	
	//os_users_page = new OSUsersPage();
	
	
});
