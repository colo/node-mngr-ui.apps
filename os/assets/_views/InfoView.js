var InfoView = {
  _id: '_design/info',
  views: {
		by_date: {
      map: function info(doc) {
				if (doc.metadata.type == 'info') {
					//var id = doc._id.split('@');//get host.path | timestamp
					//var host = doc.metadata.domain +'.'+doc.metadata.host;
					//var date = parseInt(id[1]);
					//var date = new Date();
					//date.setTime(id[1]);
					
					//var date_arr = [
						//date.getFullYear(),
						//date.getMonth() + 1,
						//date.getDate(),
						//date.getHours(),
						//date.getMinutes(),
						//date.getSeconds()
					//];
					var host = doc.metadata.domain +'.'+doc.metadata.host;
					var date = 0;
					
					if(!doc.metadata.timestamp){
						var id = doc._id.split('@');//get host.path | timestamp
						date = parseInt(id[1]);
					}
					else{
						date = parseInt(doc.metadata.timestamp);
					}
					
					emit([date, host], null);
				}
      }.toString()
    },
    by_host: {
      map: function info(doc) {
				if (doc.metadata.type == 'info') {
					//var id = doc._id.split('@');//get host.path | timestamp
					//var host = id[0];
					//var date = parseInt(id[1]);
					var host = doc.metadata.domain +'.'+doc.metadata.host;
					var date = 0;
					
					if(!doc.metadata.timestamp){
						var id = doc._id.split('@');//get host.path | timestamp
						date = parseInt(id[1]);
					}
					else{
						date = parseInt(doc.metadata.timestamp);
					}
					
					emit([host, date], null);
				}
      }.toString()
    },
    by_path_host: {
      map: function info(doc) {
				if (doc.metadata.type == 'info') {
					//var id = doc._id.split('@');//get host.path | timestamp
					//var host = id[0];
					//var date = parseInt(id[1]);
					var host = doc.metadata.domain +'.'+doc.metadata.host;
					var date = 0;
					
					if(!doc.metadata.timestamp){
						var id = doc._id.split('@');//get host.path | timestamp
						date = parseInt(id[1]);
					}
					else{
						date = parseInt(doc.metadata.timestamp);
					}
					
					emit([doc.metadata.path, host, date], null);
				}
      }.toString()
    }
  }
}



/**
 * http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
 * 
 * */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = InfoView;
}
else {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			return InfoView;
		});
	}
	else {
		window.InfoView = InfoView;
	}
}
