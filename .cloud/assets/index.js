var cloud_page = null;

/** Datatables CSS */
//head.load('/public/bower/gentelella/vendors/datatables.net-bs/css/dataTables.bootstrap.min.css');
//head.load('/public/bower/gentelella/vendors/datatables.net-bs/css/dataTables.bootstrap.min.css');
//head.load('/public/bower/gentelella/vendors/datatables.net-buttons-bs/css/buttons.bootstrap.min.css');
//head.load('/public/bower/gentelella/vendors/datatables.net-fixedheader-bs/css/fixedHeader.bootstrap.min.css');
//head.load('/public/bower/gentelella/vendors/datatables.net-responsive-bs/css/responsive.bootstrap.min.css');
//head.load('/public/bower/gentelella/vendors/datatables.net-scroller-bs/css/scroller.bootstrap.min.css');

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

//var CloudBodyModel = {};

//head.load([
	//{ ko: "/public/bower/knockoutjs/dist/knockout.js" },//no dependencies
	//{ resilient: "/public/apps/login/bower/resilient/resilient.min.js" }//no dependencies
//], function() {

function getURLParameter(name, URI) {
	URI = URI || location.search;
	
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(URI)||[,""])[1].replace(/\+/g, '%20'))||null;
}

var cloud_server = null;
//var update_server = function (data){
	//cloud_server = data;
//}

//head.load({ jsonp: "/cloud/api/server/?callback=update_server" });

//head.load({ li: "/public/bower/li/lib/index.js" });//parse Link header

//head.ready('jsonp', function(){
	head.ready('mootools-more',
	function() {
			 
		//console.log(mainBodyModel.cloud());
		
		//if(mainBodyModel.cloud() == null){
			
			//mainBodyModel.cloud(new CloudModel());

			//console.log('Cloud binding applied');
			
			////$('#datatable-responsive').DataTable();
		//}
		var CloudPage = new Class({
			Extends: Page,
			
			options: {
				assets: {
					html: {
						x_panel: {
							url: '/public/views/ko/x_panel.html',
							append: document.id("main-body"),
							ko_template: true
						},
						hypervisors_x_panel_content: {
							url: '/public/apps/cloud/templates/hypervisors_x_panel_content.html',
							append: document.id("main-body"),
							ko_template: true
						},
					},
					js: [
						{ model: "/public/apps/cloud/models/index.js" },
						{ li: "/public/bower/li/lib/index.js" },
						{ resilient: "/public/bower/resilient/resilient.min.js" },
						
						/** bootstarp-table */
						{ bootstrap_tb: "/public/bower/bootstrap-table/dist/bootstrap-table.min.js" },
						/** bootstarp-table */
					],
					css: {
						cloud_css: '/public/apps/cloud/index.css',
						green_css: '/public/bower/gentelella/vendors/iCheck/skins/flat/green.css',
						/** datatable mockup */
						//'dt_bs': '/public/bower/gentelella/vendors/datatables.net-bs/css/dataTables.bootstrap.min.css',
						//'dt_bs_bttn': '/public/bower/gentelella/vendors/datatables.net-buttons-bs/css/buttons.bootstrap.min.css',
						//'dt_bs_fxHd': '/public/bower/gentelella/vendors/datatables.net-fixedheader-bs/css/fixedHeader.bootstrap.min.css',
						//'dt_bs_resp': '/public/bower/gentelella/vendors/datatables.net-responsive-bs/css/responsive.bootstrap.min.css',
						//'dt_bs_scroll': '/public/bower/gentelella/vendors/datatables.net-scroller-bs/css/scroller.bootstrap.min.css'
						/** datatable mockup */
						
						/** bootstarp-table */
						bootstrap_tb_css: "/public/bower/bootstrap-table/dist/bootstrap-table.min.css",
						/** bootstarp-table */
					},
					jsonp: {
						update_server: '/cloud/api/'
					}
				}
			},
			
			initialize: function(options){
				var self = this;
				
				this.addEvent(this.JSONP_LOADED+'_update_server', function(data){
					//this.server = data;
					
					//this._update_model(this.options.requests.update_model);
					cloud_server = data;
					
				}.bind(this));
				
				this.addEvent(this.ASSETS_SUCCESS, function(){
					console.log('cloud_page.ASSETS_SUCCESS');
					self.fireEvent(self.STARTED);
				});
								
				this.addEvent(this.STARTED, function(){
						
					if(!mainBodyModel.cloud()){
						
						if(!self.model){
							self.model = new CloudModel();
							
							console.log('cloud binding applied');
						}
						
						//mainBodyModel.addEvent(mainBodyModel.ON_MODEL+'_cloud', function(){
							//console.log('mainBodyModel.ON_MODEL_cloud');
							//console.log(document.id('data_chkbox'));
							//self.model.pagination.set_main_checkbox(document.getElementById('data_chkbox'));
						//});
		
						mainBodyModel.cloud(self.model);
						
						//$('#hypervisors-table').bootstrapTable();
					}
					else{
						self.model = mainBodyModel.cloud();
					}
					
					
				});
				
				this.parent(options);
				
				
			}
			
		});

		if(mainBodyModel){
			console.log('mainBodyModel');
			cloud_page = new CloudPage();
		}
		else{
			console.log('no mainBodyModel');
			
			root_page.addEvent(root_page.STARTED, function(){									
				cloud_page = new CloudPage();
			});
		}	
		
			
	});
//});


