var map;
var basemap;
var parkingLayer;
var highlightedFeature;
var parkingFacilityType = {
		"Commercial Truck Stop" : {'color':'blue','imgsrc':'js/img/ic_launcher_blue.png'},
		"Truck Rest Area" : {'color':'orange','imgsrc':'js/img/ic_launcher_orange.png'},
		"Turnpike Service Area" : {'color':'purple','imgsrc':'js/img/ic_launcher_purple.png'},
		"AC Expressway Service Area" : {'color':'red','imgsrc':'js/img/ic_launcher_red.png'}
}

var panorama = null; 
var parkingJson = {} 

function init()
{
	
var baseurl = "/geoserver/highways/wms";
var urlParkingJsonFormation = "/geoserver/highways/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=highways:Truck_Parking_Inventory&maxFeatures=50&outputFormat=application/json"

/** Start of ARC GIS Basemap and Tiled WMS data Layers for points**/
	
	var attribution = new ol.Attribution({
	  	  html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
	  	      'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'}); 
	
	var arcGISbg = new ol.layer.Tile({
	              source: new ol.source.XYZ({
	                attributions: [attribution],
	                url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
	                    'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
	              })
	            });
	
	var tileParkingSource = new ol.source.TileWMS({
		  url: baseurl,
		  params: {'LAYERS': 'highways:Truck_Parking_Inventory'},
		  serverType: 'geoserver'
		});
	
	var tileParkingLayer = new ol.layer.Tile({
		title:"Parking spots",
		source: tileParkingSource,
		style: styleGen
		});

/**End of ARC GIS Basemap and Tiled WMS data Layers for points**/


/** Start of OSM Basemap and Json based data Layer for points **/
	
	$.get(urlParkingJsonFormation,function(data){
		parkingJson = data
	},'json').fail(function(e){
		alert("Failed to fetch parking lot information")
	});
	
	
	var osmbg = new ol.layer.Tile({
		source: new ol.source.OSM()
	});
	
	var jsonParkingSource = new ol.source.GeoJSON({
	    projection: 'EPSG:3857',
	    url: urlParkingJsonFormation
	  });
	
	var styleGen = function (feature,resolution){
		var emptyStyle = new ol.style.Style({});
		var iconStyle = new ol.style.Style({
			  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
				    anchor: [0.5, 46],
				    anchorXUnits: 'fraction',
				    anchorYUnits: 'pixels',
				    opacity: 0.99,
				    src: parkingFacilityType[feature.get("Type_of_Fa")].imgsrc
				  }))
				}); 
		if(feature.get('hide'))
			{return emptyStyle}
		
		return [iconStyle];
	}
	var jsonParkingVector = new ol.layer.Vector({
		title: "Parking Spots",
		source: jsonParkingSource,
		style:styleGen
	});

/** End of OSM Basemap and Json based data Layer for points **/


/** Start of Dummy Layer to save intermediate points on map**/

	var vectorSrc = new ol.source.Vector({
	    features: []
	  })
	var vectorLayer = new ol.layer.Vector({
	  source: vectorSrc
	});

/** End  of Dummy Layer to save intermediate points on map**/


/** Start of Map initialization code along with all layers **/

	basemap = osmbg;
	parkingLayer = jsonParkingVector
		
	var view = new ol.View({
		center: [-8304368.343558828,4913077.595090297],
		zoom:8,
		minZoom:3,
		maxZoom:20
	});
	
	var tempFunc = {}
	tempFunc.getRenderFromQueryString = function() {
		  var obj = {}, queryString = location.search.slice(1),
	      re = /([^&=]+)=([^&]*)/g, m;
	
	  while (m = re.exec(queryString)) {
	    obj[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
	  }
	  if ('renderers' in obj) {
	    return obj['renderers'].split(',');
	  } else if ('renderer' in obj) {
	    return [obj['renderer']];
	  } else {
	    return undefined;
	  }
	}
	
	var map = new ol.Map({
		  layers: [basemap,parkingLayer],
		  target: 'map',
		  renderer:tempFunc.getRenderFromQueryString(),
		  view: view
		});
	
	map.addLayer(vectorLayer);
	map.addControl(new ol.control.ScaleLine());
	map.addControl(new ol.control.ZoomSlider());

/** End of Map initialization code along with all layers **/

/** Start of code to initialize jQuery dialog box **/

	$('#parkingInfo').dialog({
		 	autoOpen: false,
		 	dialogClass:"parkingInfo no-close",
	  	position: { my: "right bottom", at: "right bottom", of: $('#map') },
	  	buttons:{"Close":function(){
	  			$('#parkingInfo').dialog('close');
	  		}}
	  }).dialogExtend({
	      "closable" : false,
	      "maximizable" : false,
	      "minimizable" : false,
	      "minimizeLocation" : 'left',
	      "collapsable" : true,
	      "dblclick" : $("#my-form [name=dblclick]:checked").val() || false,
	    });

/** End of code to initialize jQuery dialog box **/

/** Start of code to handle user generated events **/

	var highlightStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			    anchor: [0.5, 46],
			    anchorXUnits: 'fraction',
			    anchorYUnits: 'pixels',
			    opacity: 0.99,
			    src: 'js/img/ic_launcher_yellow.png'
			  }))
			}); 
	var pinStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			    anchor: [0.5, 46],
			    anchorXUnits: 'fraction',
			    anchorYUnits: 'pixels',
			    opacity: 0.99,
			    src: 'js/img/pin.png'
			  }))
			}); 
	map.on('singleclick',function(evt){
		var pixel = evt.pixel;
		var feature = map.forEachFeatureAtPixel(pixel,function(feature,layer){
			if(layer == parkingLayer)
				return feature;		
		});
		
		if (feature){
			document.getElementById('parkingname').innerHTML =  feature.get('Name');
			document.getElementById('facilitytype').innerHTML =  feature.get('Type_of_Fa');
			document.getElementById('address').innerHTML = feature.get('Address').concat(",",feature.get('Municipali'),",",feature.get('County'));
			document.getElementById('space').innerHTML = feature.get('Spaces_Ava');
			//$('#parkingInfo').dialog('open');
			$('#parkingDiv').show()
			$('#pano').show()
			if(highlightedFeature){
				highlightedFeature.setStyle(styleGen(highlightedFeature,view.getResolution()))
			}
			feature.setStyle(highlightStyle);
			coord = ol.proj.transform(feature.getGeometry().getCoordinates(),"EPSG:3857","EPSG:4326");
			panaroma_init(coord[1],coord[0]);
			highlightedFeature = feature
			vectorSrc.clear();
		}
		else
		{	
			var newStation = new ol.Feature();
			newStation.setStyle(pinStyle);
			newStation.setGeometry(new ol.geom.Point(evt.coordinate)); //(ol.proj.transform(evt.coordinate,'EPSG:4326','EPSG:3857')));
			vectorSrc.clear();
			vectorSrc.addFeature(newStation);
			coord = ol.proj.transform(evt.coordinate,"EPSG:3857","EPSG:4326");
			panaroma_init(coord[1],coord[0]);
			if(highlightedFeature){
				highlightedFeature.setStyle(styleGen(highlightedFeature,view.getResolution()))
			}
			$('#parkingDiv').hide()
		}
		view.setCenter(evt.coordinate);
		if(view.getZoom() < 10)
			view.setZoom(10);
		map.updateSize();
	});
	
$('#searchButton').click(function(e){
	console.log('search button');
	var searchText = $('#search').val();
	if(searchText == null || searchText =="")
		return false
	
	var features= parkingLayer.getSource().getFeatures();
	for (var i =0; i< features.length;i++){
		var tempString = features[i].get('Address').concat(" ",features[i].get('Municipali')," ",features[i].get('County')," ",features[i].get('Type_of_Fa')," ",features[i].get('Name')," ",features[i].get('Spaces_Ava'));
		if(tempString.toLowerCase().indexOf(searchText) == -1)
			features[0].set('hide',true)
	}
	map.renderSync();
	return false;
});

$('#clearButton').click(function(e){
	console.log('clear button');
	var features= parkingLayer.getSource().getFeatures();
	for (var i =0; i< features.length;i++){
			features[0].set('hide',false)
	}
	map.renderSync();
});

//$('#search').keypress(function(e){
//	if(e.which == 13){
//		var searchText = $('#search').val();
//		if(searchText == null || searchText =="")
//			return false
//		
//		var features= parkingLayer.getSource().getFeatures();
//		for (var i =0; i< features.length;i++){
//			var tempString = feature.get('Address').concat(" ",feature.get('Municipali')," ",feature.get('County')," ",feature.get('Type_of_Fa')," ",feature.get('Name')," ",feature.get('Spaces_Ava'));
//			if(tempString.indexOf(searchText) == -1)
//				features[0].set('hide',true)
//			break;
//		}
//		return false;
//	}
//});

/** End of code to handle user generated events **/

	map.updateSize();
/** Start of code to initialize Google Street view **/
	function panaroma_init(lat,lng){
		var fenway = new google.maps.LatLng(42.345573, -71.098326);
		var center = new google.maps.LatLng(lat,lng)
		//center = fenway;
		panaromaOptions = {
			position:center,
			pov:{
				heading: 34,
				pitch:10
			}
		};
		 panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panaromaOptions);	
	}
}

