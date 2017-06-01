/**
 * db2geojson: A library to query databases with geographical information 
 * @author Juan Camilo Ibarra
 * @version 1.0.0
 * @date June 2017
 */

/**
 * Module requires 
 */
var pool = require("./db2geojson_pool.js");

var config = {
	'type' : 'default',
	'host' : 'localhost',
	'user' : 'anonymous',
	'password' : '',
	'database' : ''
};


var connector = function(config)
{
	if(config.type)
	{
		if(config.type == 'postgresql')
		{
			pool.create(config);		
		}
		else
		{
			throw "The database type is not yet implemented: " + config.type;
		}
	}
	else
	{
		throw "There is no database type";
	}
	
}

connector.prototype.query = function(query, callback)
{
	pool.query(query, [], function(err, res){
		if(err)
			callback({success : false, err : err})
		else
			callback({success : true, rows : res.rows})
	});	
}

connector.prototype.geoquery = function(queryParams, callback)
{
	var columns = [];
	if(queryParams.properties != undefined )
	{
		if(queryParams.properties.constructor === Array){
			for (prop in queryParams.properties){
				columns.push(queryParams.properties[prop]);	
			}
		}else if(queryParams.properties == 'all' ){
			columns.push('*');
		}
		
	} 
	var query;
	if (queryParams.string) {
		
		if(queryParams.forced != undefined)
		{
			query = queryParams.string;
		}
		else if(queryParams.string.indexOf(';') != -1)
		{
			console.log("ERROR: Possible code injection: " + queryParams.string);
		}
		else
		{
			query = queryParams.string;
		}
	}
	else
	{
		query = 'SELECT ';
		for (col in columns) {
			query += columns[col];
			query += ', ';
		}
		
		query += ' ST_AsText(' + queryParams.geom_col + ') AS wkt ';

		query += ' FROM ' + queryParams.table;
		if(queryParams.dateColumn != undefined && queryParams.dateRange != undefined){ 
		query += ' WHERE ' + queryParams.dateColumn + ' BETWEEN ' + queryParams.dateRange;
		if (queryParams.where != undefined) {
			query += ' AND '+queryParams.where;
		}
		}else if (queryParams.where != undefined) {
				query += ' WHERE ' + queryParams.where;
		}
		if(queryParams.order != undefined){
			query += ' ORDER BY ' + queryParams.order;
		}
		if(queryParams.limit != undefined){
			query += ' LIMIT ' + queryParams.limit;
		}
		query += ';';
	}


	pool.query(query, [], function(err, result){
		if(err)
			callback({success : false, err : err})
		else
		{
			//Process the result to create geojson
			var geojson = {
				"type" : "FeatureCollection",
				"features" : []
			};
			if(queryParams.properties == 'all')
			{
				for(field in result.fields){
					var name = result.fields[field].name;
					if (name != queryParams.geometry && name != 'wkt')
						columns.push(result.fields[field].name);
				}
			}
			for (each in result.rows) {
				var properties = {};
				for(i in columns){
					var col = columns[i];
					properties[col] = result.rows[each][col];
				}
				var Terraformer = require('terraformer');
				var WKT = require('terraformer-wkt-parser');			
				var geometry = WKT.parse(result.rows[each].wkt);
				var feature = {
					"type" : "Feature",
					"geometry" : geometry,
					"properties" : properties
				};
				geojson.features.push(feature);
			}
			callback({success : true, json : geojson})
		}
			
	});	
}

module.exports = {
	connector : connector
}
