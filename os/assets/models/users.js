var OSUsersModel = new Class({
	Implements: [Options, Events],
	
	
	options : {
		
	},
	
	
	initialize: function(options){
		var self = this;
		
		this.setOptions(options);
		
		var handle = ko.tasks.schedule(function () {
			$('#users-datatable').DataTable({
				"pagingType": "full",
			});
		}.bind(this));
		
	},
	

});

/**
 * http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
 * 
 * */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = OSUsersModel;
}
else {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			return OSUsersModel;
		});
	}
	else {
		window.OSUsersModel = OSUsersModel;
	}
}
