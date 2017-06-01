//Tester

var db = require('./db2geojson.js');

var myConnector = new db.connector({
	//type : 'postgresql',
	type : 'mysql',
	database : 'IndicadoresCamacolDB',
	user : 'camacol',
	password : 'c4m4c0l',
	debug : false
});
 
myConnector.geoquery({
		properties : 'all',
		geom_col : 'geom',
		table : 'municipios'
	}, function(rows){
		console.log(rows.json);
	}
)