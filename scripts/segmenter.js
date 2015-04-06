/*
 * Segmenter: to demarcate areas in images, add-on to CASK microscopy viewer
 * Written 2015 by Paul Gobee, dept. of Anatomy & Embryology, Leiden University Medical Center, the Netherlands, Contact: o--dot--p--dot--gobee--at--lumc--dot--nl
 * See also: http://www.caskanatomy.info/microscopy and www.caskanatomy.info/products/caskviewer
 * You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 
 * This notification should be kept intact, also in minified versions of the code. 
 * Dependencies: svg-x.x.x.js
 *
 */

//temp
var displayCalc="";
var svgCanvas, svgShapes, shapeObjects, settings, text= Array(); 
var idSvgContainer = "svgContainer"; //id of element that is to contain the svg
var widthHeightRatio; 
//avg Dimension = average of width and height. heightToAverageDimensionFactor = factor to multiply height with to get the avg dimension. 
//is used for getting equally far distributed points in traildrawing in x and y direction
var widthToAverageDimensionFactor, heightToAverageDimensionFactor; 

/*
 * checks whether x lies between a and b, indifferent whether a>b or a<b and of pos or neg numbers
 * http://codegolf.stackexchange.com/questions/8649/shortest-code-to-check-if-a-number-is-in-a-range-in-javascript
 */
function isInRange(x,a,b)
{
	return ( ((x-a)*(x-b)) < 0 );
}




jQ( document ).ready(function() {
	
	//test
	function clearnamepanel()
	{
		document.getElementById('namePanel').innerHTML= "";	
	}
	//setInterval(clearnamepanel, 4000)
	//end test


	if (SVG.supported) 
	{
		/////////////////////////////////////////////////////////
		// Initialize svg canvas
		/////////////////////////////////////////////////////////
		
		//svgCanvas is about the real svg shapes, it is the area where the  svg shapes will be drawn. 
		svgCanvas = SVG(idSvgContainer);
		svgCanvas.attr("style", "border: 1px solid #ff0000;");
		//svgShapes = group that will contain all svg shapes and will be scaled
		svgShapes = svgCanvas.group(); 	
		//shapeObjects are the JavaScript objects that hold and steer the svg shapes
		shapeObjects = Array(); //will contain the JavaScript objects HandlePoint, Polygon etc (Note: these objects in turn contain the svg shapes)
		shapeObjects.activeTool = null;
		shapeObjects.activeHandlePoint = null;
		shapeObjects.activePolygon = null;
		shapeObjects.polygonUnderConstruction = null;
		settings = {"drawMethod" : "clickDraw"}
		setTimeout("ZoomSvg()",100); //temp workaround because at document ready the initialization of the tiles is not yet ready so the size is not yet known. timeout can be removed when svg area is made on demand of wanting to draw something
		
		//turns off any drawing
		shapeObjects.setStateNormal = function ()
		{
			shapeObjects.activeTool = null;
		}
		
		//draw mode
		shapeObjects.setStateDrawPolygon = function ()
		{
			shapeObjects.activeTool = "drawPolygon";
		}
		
		//starts new polygon
		shapeObjects.newPolygon = function ()
		{
			var newPolygon = new Polygon();	
		   	shapeObjects.push(newPolygon);
		   	shapeObjects.registerPolygonUnderConstruction(newPolygon);	
		}
		
		shapeObjects.getToolState = function()
		{
			return shapeObjects.activeTool;
		}

		shapeObjects.registerActiveHandlePoint = function(handlePoint)
		{
			shapeObjects.activeHandlePoint = handlePoint;
		}

		shapeObjects.unregisterActiveHandlePoint = function()
		{
			shapeObjects.activeHandlePoint = null;
		}
		
		/*
		 * Unregisters active handlePoint AND deactivates the point iself. 
		 * Is used to deactivate previous active point when clicking other or new point or clicking outside polygon
		 */
		shapeObjects.deactivateActiveHandlePoint = function()
		{
			if(shapeObjects.activeHandlePoint != null)
			{
				shapeObjects.activeHandlePoint.deactivate();	
				shapeObjects.unregisterActiveHandlePoint();
			}
		}
		
		//deletes a handlePoint, its svg and updates dependent polygon
		shapeObjects.deleteActiveHandlePoint = function ()
		{
			if(	shapeObjects.activeHandlePoint != null)
			{
				shapeObjects.activeHandlePoint.remove(); //calls remove() on the active HandlePoint - removes the internal svgshape, and downstream: removes from the polygon
				delete shapeObjects.activeHandlePoint; //delete the object refered to in shapeObjects.activeHandlePoint, shapeObjects.activeHandlePoint will become undefined
				shapeObjects.activeHandlePoint = null; //reset to null
				ToolButton.deactivateButtonDeleteHandlePoint(); //reset handlepointdelete button to inactive
			}
		}
		
		shapeObjects.registerActivePolygon = function(polygon)
		{
			shapeObjects.activePolygon = polygon;
		}

		shapeObjects.unregisterActivePolygon = function()
		{
			shapeObjects.activePolygon = null;
		}
	
		shapeObjects.registerPolygonUnderConstruction = function(polygon)
		{
			shapeObjects.polygonUnderConstruction = polygon;
		}

		shapeObjects.unregisterPolygonUnderConstruction = function()
		{
			shapeObjects.polygonUnderConstruction = null;
		}
		
		shapeObjects.hasPolygonUnderConstruction = function()
		{
			return (shapeObjects.polygonUnderConstruction != null)? true : false;
		}
		
		/*
		 * Unregisters active polygon AND deactivates the polygon iself. 
		 * Is used to deactivate previous active Polygon when clicking other or new Polygon or clicking outside polygon
		 */
		shapeObjects.deactivateActivePolygon = function()
		{
			if(shapeObjects.activePolygon != null)
			{
				shapeObjects.activePolygon.deactivate();	
				shapeObjects.unregisterActivePolygon();
			}
		}
		
		//deletes a Polygon, its handlePoints and all svg 
		shapeObjects.deleteActivePolygon = function ()
		{
			if(	shapeObjects.activePolygon != null)
			{
				shapeObjects.activePolygon.remove(); //calls remove() on the active Polygon - removes Polygon, its handlePoints and all svg
				delete shapeObjects.activePolygon; //delete the object refered to in shapeObjects.activePolygon, shapeObjects.activePolygon will become undefined
				shapeObjects.activePolygon = null; //reset to null
				ToolButton.deactivateButtonDeletePolygon(); //reset handlepointdelete button to inactive
			}
		}
		
		shapeObjects.getCountShapes = function()
		{
			return shapeObjects.length;
		}
		
	} 
	else 
	{
		alert('Your browser unfortunately does not support SVG, the technique used for segmenting.\nPlease switch to one of the following browsers to allow segmenting:\n\nDESKTOP:\n  Firefox 3+\n  Chrome 4+\n  Safari 3.2+\n  Opera 9+\n  Internet Explorer 9+\n\nMOBILE:\n  iOS Safari 3.2+\n  Android Browser 3+\n  Opera Mobile 10+\n  Chrome for Android 18+\n  Firefox for Android 15+');
	}
	//setTimeout("createPoly()",100);


	///////////////////////////////////////
	//Toolpanel
	///////////////////////////////////////
	
	text["normalMode"] = "Normal mode";
	text["start1"] = "Push button 'New Shape' to start a new drawing.";
	text["start2"] = "Push button 'Draw mode' to continue drawing the shape.";
	text["start3"] = "Push button 'Draw mode' to edit any existing shapes, or push button 'New Shape' to start a new drawing.";
	text["drawMode"] = "Draw mode";
	text["drawModeInfo1"] = "'Click around' a structure to outline it.";
	text["drawModeInfo2"] = "You can interrupt drawing to move or zoom the slide by pushing 'Normal mode'. To insert a point between existing points, click just inside shape border.";
	text["drawModeInfo3"] = "Click a shape or point to edit it. To insert a point between existing points, click just inside shape border.";
	text["newDrawing"] = "New Shape";
	text["newDrawingInfo"] = "Push button 'New Shape' to start a new drawing, or button 'Normal mode' to stop drawing.";
	text["deletePoint"] = "Delete Point";
	text["deleteShape"] = "Delete Shape";
	text["confirmDeleteShape"] = "Are you sure you want to delete the selected (red) shape?";
	text["hideShapes"] = "Hide Shapes";
	text["showShapes"] = "Show Shapes";
	text["trailDraw"] = "Trail Drawing";
	text["clickDraw"] = "Click Drawing";
		
	//create and insert the toolpanel at the bottom
	jQ( "body" ).append( '<div id="drawToolPanel">'
			+'<button id="btNormalMode" class="down">'+ text["normalMode"] +'</button>'
			+'<button id="btDrawMode">'+ text["drawMode"] +'</button>'
			+'<button id="btNewDrawing">'+ text["newDrawing"] +'</button>'
			+'<button id="btDeletePoint" class="nonActive">'+ text["deletePoint"] +'</button>'
			+'<button id="btDeletePolygon" class="nonActive">'+text["deleteShape"]+'</button>'
			+'<button id="btShowHideShapes">'+text["hideShapes"]+'</button>'
			+'<button id="btDrawMethod">'+text["clickDraw"]+'</button>'
			+'<div id="toolBarInfo">'+text["start1"]+'</div>'
			+'</div>' );
	
	// button events
	
	// button 'Normal mode' - action
	jQ('button#btNormalMode').click(function(){
		ToolButton.normalMode();
	});
	
	// button 'Draw mode' - action
	jQ('button#btDrawMode').click(function(){
		ToolButton.drawMode();
	});
	
	// button 'Draw mode' - action
	jQ('button#btNewDrawing').click(function(){
		ToolButton.newDrawing();
	});
	
	// button 'Delete handlepoint' - action
	jQ('button#btDeletePoint').click(function(){
		ToolButton.deleteHandlePoint();
	});
	
	// button 'Delete handlepoint' - action
	jQ('button#btDeletePolygon').click(function(){
		ToolButton.deletePolygon();		
	});
	
	// button 'Show/hide shapes' - action
	jQ('button#btShowHideShapes').click(function(){
		ToolButton.toggleShowHideShapes();
	});
	
	// button 'drawmethod' - action
	jQ('button#btDrawMethod').click(function(){
		ToolButton.toggleDrawMethod();
	});

	//////////////////////////////////////////////// 
	// End toolpanel
	////////////////////////////////////////////////
	
}); //end document ready



/*
 * stores all button actions
 */
var ToolButton = 
{

	normalMode: function ()
	{
		//set to normal state
		shapeObjects.setStateNormal();
		shapeObjects.deactivateActivePolygon();
		shapeObjects.deactivateActiveHandlePoint();
		jQ('button#btNormalMode').addClass("down");
		jQ('button#btDrawMode').removeClass("down");
		jQ('button#btDrawMode').css("color","#808080");
		if( !shapeObjects.hasPolygonUnderConstruction())
		{
			ToolButton.normalizeButtonNewDrawing();
		}
		var startText = (shapeObjects.getCountShapes == 0)? text["start1"] : (shapeObjects.hasPolygonUnderConstruction())? text["start2"] : text["start3"];
		jQ('div#toolBarInfo').html(startText);

	},	

	drawMode: function (param)
	{
	 	//set to draw state
		shapeObjects.setStateDrawPolygon();
		//returns to a polygon that is still under construction (but no need to activate a new polygon that has just been activated) 
		if(param != "justStartedNew" && shapeObjects.hasPolygonUnderConstruction())
		{
			shapeObjects.polygonUnderConstruction.activate();			
		}
		jQ('button#btNormalMode').removeClass("down");
		jQ('button#btDrawMode').addClass("down");
		jQ('button#btDrawMode').css("color","#000000");
		ToolButton.toggleShowHideShapes("show");
		var drawModeText = (shapeObjects.getCountShapes() == 0)?  text["start1"]: (param == "justStartedNew")? text["drawModeInfo1"] : (shapeObjects.hasPolygonUnderConstruction())? text["drawModeInfo2"] : text["drawModeInfo3"];
		jQ('div#toolBarInfo').html(drawModeText);

	},
	
	newDrawing: function ()
	{
		if( !shapeObjects.hasPolygonUnderConstruction() )
		{
			//shapeObjects.deactivateActiveHandlePoint();
			shapeObjects.newPolygon();
			//switch to drawMode automatically
			ToolButton.drawMode("justStartedNew");
			ToolButton.deactivateButtonNewDrawing();
		}
	},
	
	activateButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('nonActive').addClass('active');
		jQ('div#toolBarInfo').html(text["newDrawingInfo"]);

	},
	
	normalizeButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('active').removeClass('nonActive');

	},
	
	deactivateButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('active').addClass('nonActive');

	},
	
	//sets the style on button 'delete active handle point' that indicates that there is a handlepoint active, thus may be deleted
	activateButtonDeleteHandlePoint: function()
	{
		jQ('button#btDeletePoint').removeClass('nonActive').addClass('active');
	},

	//sets the style on button 'delete active handle point' that indicates that there is no handlepoint active, thus none can be deleted
	deactivateButtonDeleteHandlePoint:function()
	{
		jQ('button#btDeletePoint').removeClass('active').addClass('nonActive');
	},
	
	deleteHandlePoint: function()
	{
		shapeObjects.deleteActiveHandlePoint();
	},
	
	//sets the style on button 'delete active handle Polygon' that indicates that there is a handlePolygon active, thus may be deleted
	activateButtonDeletePolygon: function()
	{
		jQ('button#btDeletePolygon').removeClass('nonActive').addClass('active');
	},

	//sets the style on button 'delete active handle Polygon' that indicates that there is no handlePolygon active, thus none can be deleted
	deactivateButtonDeletePolygon: function()
	{
		jQ('button#btDeletePolygon').removeClass('active').addClass('nonActive');
	},
	
	deletePolygon: function()
	{
		if (confirm( text["confirmDeleteShape"] ) == true) 
		{
			shapeObjects.deleteActivePolygon();
	    } 
	},
		
	/*
	 * normal it toggles, but can also be steered directly with param "show" or "hide"
	 */
	toggleShowHideShapes: function(param)
	{
		param = (typeof param != "undefined")? param : null;
		
		if( param == "hide" || ( !param && jQ('#'+idSvgContainer).css("visibility") == "visible" ) )
		{
			jQ('#'+idSvgContainer).css("visibility", "hidden");
			jQ('button#btShowHideShapes').html(text["showShapes"]);	
			ToolButton.normalMode();
			jQ('div#toolBarInfo').html("");
			
		}
		else if(param == "show" || ( !param && jQ('#'+idSvgContainer).css("visibility") == "hidden") )
		{
			jQ('#'+idSvgContainer).css("visibility", "visible");
			jQ('button#btShowHideShapes').html(text["hideShapes"]);
		}
	},
	
	toggleDrawMethod: function()
	{
		if(settings.drawMethod == "clickDraw")
		{
			settings.drawMethod = "trailDraw";
			jQ('button#btDrawMethod').html(text["trailDraw"]);
			initTrailDraw();
		}
		else
		{
			settings.drawMethod = "clickDraw";
			jQ('button#btDrawMethod').html(text["clickDraw"]);
		}		
	}
};


/////////////////////////////////////////////////////////////////////
// extend Event handlers on window of basic cask microscopy viewer
//////////////////////////////////////////////////////////////////////
//http://stackoverflow.com/questions/4578424/javascript-extend-a-function


var old_handleMouseDown = handleMouseDown;
handleMouseDown = function(event) 
{
	var imgFractionCoords= getImgCoords(cursorX,cursorY);	
	
	//document.getElementById("namePanel").innerHTML= "mousedown";
	if(!shapeObjects.hasPolygonUnderConstruction() && !event.isInPolygon)
	{
		shapeObjects.deactivateActivePolygon();		
	}
	shapeObjects.deactivateActiveHandlePoint();
	
	if(shapeObjects.getToolState() == "drawPolygon" && shapeObjects.polygonUnderConstruction != null) 
	{
		if(settings.drawMethod == "trailDraw")
		{
			startTrailDrawing(event);
		}
		else //clickDrawing
		{
			shapeObjects.polygonUnderConstruction.addPoint({"event":event,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y, "enableDirectDrag":true});    		  			
		}
	}
	else
	{
		old_handleMouseDown.apply(this, arguments);		
	}
	
};


//////////////////////////////////////////////////////////////////////////////////////////////
// Traildrawing
//////////////////////////////////////////////////////////////////////////////////////////////


var originalHandleMouseMove, originalHandleMouseUp;

function initTrailDraw()
{	
	//store original mousemove and mouseup handlers
	originalHandleMouseMove = handleMouseMove;
	originalHandleMouseUp = handleMouseUp;
}

var lastAddedPoint, slope, distance; //will store the last dropped/added point (in traildrawing)

function startTrailDrawing(event)
{
	outerDiv.style.cursor = "crosshair";
	var imgFractionCoords= getImgCoords(event.clientX,event.clientY);	
	lastAddedPoint = shapeObjects.polygonUnderConstruction.addPoint({"event":event,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y});
	lastAddedPoint.deactivate();
	//alert(lastAddedPoint);
	// replace original mousemove and mouseup handlers by handlers for traildrawing
	outerDiv.onmousemove = trailDraw; 
	outerDiv.onmouseup = endTrailDrawing;

}


var thresholdTrailDropMinDistance = 0.010; //safety initial value, will be overwritten by setter
var thresholdTrailDropMaxDistance = 0.025; //safety initial value, will be overwritten by setter
var startAngle;

function trailDraw(event)
{
	var imgFractionCoords= getImgCoords(event.clientX,event.clientY);
	var lastPointX = lastAddedPoint.getImgFractionX();
	var lastPointY = lastAddedPoint.getImgFractionY();
	var distance = calculateDistance(lastPointX, lastPointY, imgFractionCoords.x, imgFractionCoords.y);
	var angle = calculateAngleRadian(lastPointX, lastPointY, imgFractionCoords.x, imgFractionCoords.y);
	var slope = calculateSlope(lastPointX, lastPointY, imgFractionCoords.x, imgFractionCoords.y);
	document.getElementById('namePanel').innerHTML = "trail: x: " + imgFractionCoords.x + ", y: " + imgFractionCoords.y +", distance:" + distance + ", angle:" + angle + ", slope:" + slope +", thresholdTrailDropMaxDistance:" +thresholdTrailDropMaxDistance;	
	//drop a new point
	if(distance > thresholdTrailDropMinDistance)
	{
		
		if(distance > thresholdTrailDropMaxDistance)
		{
			//enableDirectDrag = false because the draggability of a point must be turned off by mouseup on point and this doesn't occur on traildraw. Else all handlepoints give errors on all mouseups on window
			lastAddedPoint = shapeObjects.polygonUnderConstruction.addPoint({"event":event,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y,"enableDirectDrag":false});
			lastAddedPoint.deactivate();
		}
	}
	
}

/*
 * calculates min distance to drop a new point in trail drawing, dependent on present zoom
 * returns a distance expressed in imgfraction
 */
function setThresholdTrailDropMinDistance()
{
	var minPixelThreshold = 10;
	thresholdTrailDropMinDistance = minPixelThreshold * Math.pow(2,(gTierCount-now.zoom-1))/ imgWidthMaxZoom;	
}


/*
 * calculates max distance to drop a new point in trail drawing, dependent on present zoom
 * returns a distance expressed in imgfraction
 */
function setThresholdTrailDropMaxDistance()
{
	var maxPixelThreshold = 30;
	thresholdTrailDropMaxDistance = maxPixelThreshold * Math.pow(2,(gTierCount-now.zoom-1))/ imgWidthMaxZoom;
}

function calculateDistance(x1,y1,x2,y2)
{
	/*
	 * Basis: Pythagoras
	 * Corrections for widthHeightRatio: 
	 * 1. x and y lengths are made equally weighing by multiplying x length by widthHeightRatio
	 * 2. calculated hypothenusa is divided by widthHeightRatio to equalize distances over images with different widthHeightRatio 
	 */
	
	return ( Math.sqrt( Math.pow(((x2-x1) * widthHeightRatio),2) + Math.pow(((y2-y1) ),2) )  / Math.sqrt(2) ) / widthHeightRatio; 
}

function calculateSlope(x1,y1,x2,y2)
{
/*	
 * var dy = y2-y1;
	var dx = x2-x1
	var corrdx = dx * widthHeightRatio;
	document.getElementById('namePanel').innerHTML = "x1: " + x1 + ", x2: " + x2 + ", y1: " + y1 + ", y2: " + y2 +", Dx:" + dx + ", corrDx:" + corrdx +", Dy:" + dy + ", slope:" + slope ;	
*/
	/*
	 * Corrections for widthHeightRatio: 
	 * 1. x and y lengths are made equally weighing by multiplying x length by widthHeightRatio
	 */
	var slope = (y2-y1)/((x2-x1) * widthHeightRatio);
	return slope;
}

var twoPi=Math.PI*2;
var pi=Math.PI;

function calculateAngleDegrees(x1,y1,x2,y2)
{
	/*
	 * Corrections for widthHeightRatio: 
	 * 1. x and y lengths are made equally weighing by multiplying x length by widthHeightRatio
	 * Math.atan gives radians. Radians to degrees: http://stackoverflow.com/questions/9705123/how-can-i-get-sin-cos-and-tan-to-use-degrees-instead-of-radians
	 */
	var slope = (y2-y1)/((x2-x1) * widthHeightRatio);
	var angle = Math.atan(slope) * 180/Math.PI;	
	return angle;
}

function calculateAngleRadian(x1,y1,x2,y2)
{
	/*
	 * Corrections for widthHeightRatio: 
	 * 1. x and y lengths are made equally weighing by multiplying x length by widthHeightRatio
	 * Math.atan gives radians. Radians to degrees: http://stackoverflow.com/questions/9705123/how-can-i-get-sin-cos-and-tan-to-use-degrees-instead-of-radians
	 * Also see: www.mathopenref.com/trigangle.html
	 */
	var slope = (y2-y1)/ ((x2-x1) * widthHeightRatio);
	var angle = Math.atan(slope);
	var quadrant = getQuadrant(x1,y1,x2,y2);
	
	switch(quadrant) 
	{
    case 1:
    	return -angle;
        break;
    case 2:
    case 3:
    	return pi - angle;
        break;
    case 4:
    	return twoPi - angle;
    default:
        return null;
	} 
}

function getQuadrant(x1,y1,x2,y2)
{
	var dy = y2-y1;
	var dx = x2-x1;
	if(dy<0)
	{		
		//1st Quadrant: dx:+, dy:-
		if(dx>=0)
		{
			return 1;
		}
		//2nd Quadrant: dx:-, dy:-
		else //dx<0
		{
			return 2;
		}
	}
	else //dy>=0
	{
		//3rd Quadrant: dx:-, dy:+
		if(dx<0)
		{
			return 3;
		}
		//4th Quadrant: dx:+, dy:+
		else //dx>0
		{
			return 4;
		}		
	}
}

function calculateAngleChange(angle1, angle2)
{
	
}

function endTrailDrawing()
{
	outerDiv.style.cursor = "default";
	// reconnect original mousemove and mouseup handlers
	outerDiv.onmousemove = originalHandleMouseMove; 
	outerDiv.onmouseup = originalHandleMouseUp;
	shapeObjects.polygonUnderConstruction.closePolygon();
}


/////////////////////////////
//Constructors
/////////////////////////////

//only testing
function createPoly()
{
	//alert('create poly')
	var polygon = svgCanvas.polygon('4992,5888 4512,6336 4320,7648 4928,8480 5824,8416 7072,7424 6560,7584 6176,7072 5120,6784').fill('#0000ff').opacity(0.5).stroke({ width: 50 })
	svgShapes.add(polygon);
}

/* @param params can contain:
 * "event" = event object
 * "imgFractionX" = number 0-1 x position expressed in image fraction
 * "imgFractionY" = number 0-1 y position expressed in image fraction
 * "indexSectionToAddPoint" = integer: index of the section of the polygon into which the point should be added (optional)
 * "enableDirectDrag" = true/false (optional)
*/
function HandlePoint(params)
{	
	if(typeof params == "undefined") {return;}
	var event = params["event"];
	var enableDirectDrag = params["enableDirectDrag"];

	this.imgFractionX =  params["imgFractionX"]; //location on image, expressed in image fraction (0-1)
	this.imgFractionY =  params["imgFractionY"]; //location on image, expressed in image fraction (0-1)

	this.parentObject = null; //reference to a shape object (e.g. polygon object) that contains this handlepoint
	this.isActive = false; //whether it can be dragged etc.
	this.isShownAsStartPoint = false; //startpoint will be shown more prominent

	var fullImgX = this.imgFractionX * imgWidthMaxZoom; //location on image of max image size, expressed in pixels
	var fullImgY = this.imgFractionY * imgHeightMaxZoom;



	//sets this handlePoint to active state. 
	this.activate = function() 
	{
		//deactivate any other handlepoint that may previously be activated
		shapeObjects.deactivateActiveHandlePoint();
		this.isActive = true;
		//register as shapeObjects activePoint
		shapeObjects.registerActiveHandlePoint(this);	
		//styling
		this.showAsActive();
		//also activate any larger shpae it may be in
		if(this.parentObject)
		{
			this.parentObject.activate();
		}
		ToolButton.activateButtonDeleteHandlePoint();
	}

	//sets this handlePoint to inactive state. 
	this.deactivate = function() 
	{
		if(this.isActive)
		{
			this.isActive = false;
			shapeObjects.unregisterActiveHandlePoint();
			//styling
			this.showAsInactive();
			ToolButton.deactivateButtonDeleteHandlePoint();			
		}
	}
	
	//apply 'active' style to this handlePoint
	this.showAsActive = function()
	{
		this.svgCircle.addClass('activePoint');
	}
	
	//remove 'active' style from this handlePoint
	this.showAsInactive = function()
	{
		this.svgCircle.removeClass('activePoint');
	}

	this.showAsStartPoint = function()
	{
		this.isShownAsStartPoint = true;
		this.formatDisplayToZoom();	//real adaptation happens here, based on boolean isShownAsStartPoint	
	}

	this.unshowAsStartPoint = function()
	{
		this.isShownAsStartPoint = false;
		this.formatDisplayToZoom();
	}
		
	//set reference to possible shapeobject that contains this handlePoint
	this.setParentObject = function(parentObject)
	{
		this.parentObject = parentObject;
	}
	
	//returns the x position of this handlePoint, expressed in image fraction (0-1)
	this.getImgFractionX = function()
	{
		return this.imgFractionX;
	}

	//returns the y position of this handlePoint, expressed in image fraction (0-1)
	this.getImgFractionY = function()
	{
		return this.imgFractionY;
	}
	
	/*
	 * formats sizes of elements so they look good at the current zoom level
	 */
	this.formatDisplayToZoom = function()
	{
		var strokeFactor = (this.isShownAsStartPoint)? 3 : 1;
		var radiusFactor = (this.isShownAsStartPoint)? 1.3 : 1;
		
		//adapt to zoom level
		this.svgCircle.style({'stroke-width' : strokeFactor * HandlePoint.getCurrentStrokeWidth()});
		this.svgCircle.radius((radiusFactor * HandlePoint.getCurrentRadius())/2); //division factor 2 empirically determined
	}
	
	//////////////////////////////////////////////////////
	// Create new svgcircle
	//////////////////////////////////////////////////////
	
	//create the svg circle shape and attach it to the containingObject HandlePoint (=this)
	this.svgCircle = svgCanvas.circle(HandlePoint.getCurrentRadius()).center(fullImgX,fullImgY).addClass('handlePoint').style({'stroke-width' : HandlePoint.getCurrentStrokeWidth()});
	//add shape to the group
	svgShapes.add(this.svgCircle);
	//create reference from the svg shape to the containingObject HandlePoint (this)
	this.svgCircle.parentObject = this;
	//a new created handlePoint is activated
	this.activate();


	/////////////////////////////////////////
	// remove handlePoint
	/////////////////////////////////////////
	/*
	 * removes this handlepoint from the polygon and removes the internal svgcircle
	 */
	this.remove = function()
	{
		//deactivates in case it is an active handlePoint - used if handlepoint is removed as consequence of removal of polygon
		this.deactivate();
		//remove from any parentshape (such as polygon) that may hold it 
		if(this.parentObject) 
		{
			this.parentObject.removeHandlePoint(this);
		}
		//remove svg circle from the svgCanvas
		this.svgCircle.remove();
	}
	
	///////////////////////////////////////////////////////
	// Event handlers HandlePoint
	///////////////////////////////////////////////////////
	
	this.svgCircle.mousedown( function(event)
	{
		if(shapeObjects.getToolState() == "drawPolygon")
		{
			event.stopPropagation();
			var thisHandlePoint = this.parentObject;
			thisHandlePoint.activate();
			//transfer event to handlePoint
			thisHandlePoint.mouseDownInObject(event);
		}
	});
	
	this.svgCircle.dragstart = function(event)
	{
		if(this.isActive)
		{			
			//set dragspeed according to zoom level
			this.svgCircle.startPosition.zoom /= Math.pow(2,(gTierCount-now.zoom-1));
			this.startImgFractionX = this.imgFractionX; //expressed in image fraction (0-1)
			this.startImgFractionY = this.imgFractionY;
		}
	}.bind(this); //bind(this) : JavaScript cookbook ch 16.12 p383 and http://javascriptissexy.com/javascript-apply-call-and-bind-methods-are-essential-for-javascript-professionals/
	
	this.svgCircle.dragmove = function(delta, event) 
	{
		if(this.isActive)
		{
			var imgFractionDeltaX = getImgFractionDeltaX(delta.x);//expressed in image fraction (0-1)
			var imgFractionDeltaY = getImgFractionDeltaY(delta.y);
			this.imgFractionX = this.startImgFractionX + imgFractionDeltaX; //expressed in image fraction (0-1)
			this.imgFractionY = this.startImgFractionY + imgFractionDeltaY;
			//this was for testing: document.getElementById('namePanel').innerHTML='x='+ this.imgFractionX + ', y=' + this.imgFractionY + ', deltax=' + imgFractionDeltaX + ', deltay=' + imgFractionDeltaY;		 
		}
	}.bind(this); 

	/*
	 * 'object mousedown'= artificial mousedown = method on the HandlePoint object. Note: HandlePoint = JavaScript object, not HTML or svg element
	 * This method is called in conjuction with a real mousedown event on a HTML/svg element: the svgCircle
	 */
	this.mouseDownInObject = function(event)
	{
		//connect reference to this handlePoint object in the event
		event.targetObject = this;
		
		//transfer event to any containing shapeObject
		if(this.parentObject && this.parentObject.mouseDownInObject)
		{
			this.parentObject.mouseDownInObject(event);
		}
	}
	
	/////////////////////////////////////////////////////
	// End event handlers HandlePoint
	/////////////////////////////////////////////////////
	
	
	//Enable dragging of the handlePoint. Note: must be called after setting of the event handlers, else dragging speed will not be adapted to actual scale
	//constraint function is used to switch dragging on and off
	var dragConstraintFunction = function dragOnOff(x,y)
	{
		return (this.isActive)? {x:x,y:y} : false;
	}.bind(this);
	
	this.svgCircle.draggable(dragConstraintFunction);
	
	if(enableDirectDrag)
	{
		//enable immediate dragging with mouse still down from the point creation. 	
		this.svgCircle.draggable.triggerStart(event);
	}
		

} //EOF HandlePoint

/////////////////////////////////////////////////
//HandlePoint static properties and methods
/////////////////////////////////////////////////

/*
 * returns a strokeWidth in svg units (pixels) that looks good at the present zoom level
 */
HandlePoint.baseStrokeWidth = 1;
HandlePoint.getCurrentStrokeWidth = function()
{
	return HandlePoint.baseStrokeWidth * Math.pow(2,(gTierCount - 1 - now.zoom));
}

HandlePoint.baseRadius = 9;
HandlePoint.getCurrentRadius = function()
{
	var factor= Math.pow(2,(gTierCount - 1 - now.zoom));
	//alert('calculate baseradius multiplication factor:'+factor);
	return HandlePoint.baseRadius * (Math.pow(2,(gTierCount - 1 - now.zoom)));
}




////////////////////////////////////////////////////////////////////////////
// Polygon
////////////////////////////////////////////////////////////////////////////

var thresholdDistanceFromPolygonLineToAddPoint = 0.01; //initial

function Polygon()
{
	
	this.points= Array();
	this.isActive = false;
	this.isClosed = false; //is true when polygon has been closed
	this.leftMostCoordinate = null; //copies of coordinates to speed up determining if this shape is in view
	this.rightMostCoordinate = null;
	this.topMostCoordinate = null;
	this.bottomMostCoordinate = null;
	
	//sets this polygon to active state. 
	this.activate = function() 
	{
		//alert('poly activated')
		//deactivate any other polygon that may previously be activated
		shapeObjects.deactivateActivePolygon(); 
		this.isActive = true;
		//register as shapeObjects activePolygon
		shapeObjects.registerActivePolygon(this);	
		//styling
		this.showAsActive();
		//switch on button delete polygon only after first point is added
		if(this.points.length > 0)
		{
			ToolButton.activateButtonDeletePolygon();			
		}
	}

	//sets this handlePoint to inactive state. 
	this.deactivate = function() 
	{
		this.isActive = false;
		shapeObjects.unregisterActivePolygon();
		//styling
		this.showAsInactive();
		ToolButton.deactivateButtonDeletePolygon();
	}
	
	//apply 'active' style to this polygon
	this.showAsActive = function()
	{
		if(this.svgPolyline)
		{
			this.svgPolyline.addClass('activePolygon');
		}
		if(this.svgPolygon)
		{
			this.svgPolygon.addClass('activePolygon');
		}
	}
	
	//remove 'active' style from this polygon
	this.showAsInactive = function()
	{
		if(this.svgPolyline)
		{
			this.svgPolyline.removeClass('activePolygon');
		}
		if(this.svgPolygon)
		{
			this.svgPolygon.removeClass('activePolygon');
		}
	}
	
	
	
	/*
	 * Reads the handlePoints of the polygon and gets an array of coordinates from the points
	 * @mode = 'asImgFractions' to get the coordinates expressed in image fraction (0-1) //default
	 * 			'asFullImgCoordinates'  to get the coordinates expressed in pixels on the full size image (=maximally enlarged)
	 * @return array of x-y-coord-arrays, eg: [[0,0], [0.4,0.22], [0.153,0.77], [0.73,0.2]]
	 */
	this.getCoordinates = function(mode)
	{
		var multiplierX = (mode == 'asFullImgCoordinates')? imgWidthMaxZoom : 1;  //default = 'asImgFractions' (then no multiplying)
		var multiplierY = (mode == 'asFullImgCoordinates')? imgHeightMaxZoom : 1; //default = 'asImgFractions' (then no multiplying)
		
		var point = {};
		var coordinates = [];
		var nrPoints= this.points.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			point.imgCoordX = this.points[i].getImgFractionX() * multiplierX; //expressed in image fraction (0-1) if mode = asImgFractions, expressed in pixels of full image if mode = 'asFullImgCoordinates'
			point.imgCoordY = this.points[i].getImgFractionY() * multiplierY;
			coordinates.push([point.imgCoordX,point.imgCoordY]);
		}
		return coordinates;
	}
	
	/*
	 * Updates the polygon or polyline shape dependent on the present handlePoints positions
	 */
	this.update = function()
	{
		var coordinates = this.getCoordinates('asFullImgCoordinates');
		//update the polyline or polygon
		this.svgPolyObject.plot(coordinates);
		
		//update the limits coordinates of the polygon
		var nrPoints= coordinates.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			this.leftMostCoordinate = (coordinates[i][0] < this.leftMostCoordinate)? coordinates[i][0] : this.leftMostCoordinate;
			this.rightMostCoordinate = (coordinates[i][0] > this.rightMostCoordinate)? coordinates[i][0] : this.rightMostCoordinate;
			this.topMostCoordinate = (coordinates[i][1] < this.topMostCoordinate)? coordinates[i][0] : this.topMostCoordinate;
			this.bottomMostCoordinate = (coordinates[i][1] > this.bottomMostCoordinate)? coordinates[i][0] : this.bottomMostCoordinate;
		}
	}
	
	
	/*
	 * formats sizes of elements so they look good at the current zoom level
	 */
	this.formatDisplayToZoom = function()
	{
		//adapt strokewidth to zoom level
		this.svgPolyObject.stroke({"width":Polygon.getCurrentStrokeWidth()});
		//also adapt all points of the poly
		var nrPoints= this.points.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			this.points[i].formatDisplayToZoom();
		}
	}	
	
	////////////////////////////////////////////////////
	// Create new Polygon
	////////////////////////////////////////////////////
	
	//During the initial drawing phase, when polygon is not yet closed we'll use a polyline
	//create the svg polyline shape and attach it to the containingObject Polygon (=this)
	this.svgPolyline = svgCanvas.polyline().fill('#0000ff').opacity(0.5).stroke({ width: Polygon.getCurrentStrokeWidth() })
	//add shape to the group
	svgShapes.add(this.svgPolyline);
	//create reference from the svg shape to the containingObject Polygon (=this)
	this.svgPolyline.parentObject = this;
	//As soon as the polygon is closed, we'll use a proper polygon. It is created here already, without points, but ready to be used.
	this.svgPolygon = svgCanvas.polygon().fill('#0000ff').opacity(0.5).stroke({ width: Polygon.getCurrentStrokeWidth() })
	//add shape to the group
	svgShapes.add(this.svgPolygon);
	//create reference from the svg shape to the containingObject Polygon (=this)
	this.svgPolygon.parentObject = this;
	//this.svgPolyObject holds a reference to the object that presently represents the polygon. During initial drawing (poly not yet closed) this is the polyline, after closing the poly, it is a polygon.
	this.svgPolyObject =  this.svgPolyline; 
	//activate new Polygon
	this.activate();
	
	////////////////////////////////////////////////////
	// End of create new Polygon
	////////////////////////////////////////////////////

	/////////////////////////////////////////
	// remove complete Polygon
	/////////////////////////////////////////
	/*
	 * removes Polygon and all its handlepoints
	 */
	this.remove = function()
	{
		//remove all its handlePoints: this also removes the svg in them
		var nrPoints= this.points.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			//removing handlePoint via via calls Polygon.removeHandlePoint(), this directly updates the points array, thus the points array becomes shorter each cycle, therefor we need to remove point[0], not point[i].
			this.points[0].remove();
		}		
		//remove svg shape from the svgCanvas
		if(this.svgPolyline)
		{
			this.svgPolyline.remove();
		}
		if(this.svgPolygon)
		{
			this.svgPolygon.remove();
		}
	}	
	
	
	////////////////////////////////////////////////////
	// Adding and removing handlePoints to the Polygon
	////////////////////////////////////////////////////
	
	/*
	 * @param params can contain:
	 * "event" = event object
	 * "imgFractionX" = number 0-1 x position expressed in image fraction
	 * "imgFractionY" = number 0-1 y position expressed in image fraction
	 * "indexSectionToAddPoint" = integer: index of the section of the polygon into which the point should be added (optional)
	 * "enableDirectDrag" = true/false (optional)
	 */
	this.addPoint = function(params)
	{
		//alert('in add point')
		if(typeof params == "undefined") {return;}
		var event = params["event"];
		//var imgFractionX =  params["imgFractionX"];
		//var imgFractionY =  params["imgFractionY"];
		var indexSectionToAddPoint = params["indexSectionToAddPoint"];
		
		var newPoint = new HandlePoint(params);
		//alert(newPoint)
		
		//create reference in the handlePoint to this Polygon object
		newPoint.setParentObject(this);
		
		//add method to the HandlePoint that allows it to report whether it is Polygon's startpoint
		newPoint.isPolygonStartPoint = function()
		{
			return (this === this.parentObject.points[0]);
		}
		
		//extend the dragmove handler to also update this polygon when the point is moved
		var old_dragmove = newPoint.svgCircle.dragmove;
		newPoint.svgCircle.dragmove = function(e)
		{
			if(this.isActive)
			{
				this.update();									
			}
			old_dragmove.apply(newPoint, arguments);				
		}.bind(this)		
		
		//add the new point to the points array at the correct place
		if(typeof indexSectionToAddPoint == "undefined")
		{ 	//add the point to the end of the array
			this.points.push(newPoint);
		}	
		else
		{	//insert the point into a specific section
			this.points.splice(indexSectionToAddPoint+1,0,newPoint);
		}
		this.update();
		
		//some special things if it is the first point of a polygon
		if(newPoint.isPolygonStartPoint())
		{
			newPoint.showAsStartPoint();
			ToolButton.activateButtonDeletePolygon();
			jQ('div#toolBarInfo').html(text["drawModeInfo2"]);
		}

		return newPoint;
	}


	
	/*
	 * This function will test a clicked point (x,y) 
	 *  1) to see if it is close enough to a section of the polygon so click can be considered as command to add a point
	 *  2) if so, to determine to which section of the polygon the point should be added.
	 * In order to this it loops all sections between the handlePoints of the poly 
	 * and determine if the passed point is near enough to any of these line sections to be considered to lie on this line section
	 * If so, the index of that section (section nearest to point) is returned, else null is returned
	 */
	this.findSectionWherePointIs = function(pointX, pointY)
	{
		var minDistancePointFromLine = 10; 
		var distancePointFromLine = 10;
		
		var indexNearestSection = null;
		var pointX, pointY;
		var nrPoints= this.points.length;
		//loop all line sections between the handlepoints and find line section where point to investigate is nearest to
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			//get coordinates of the handlePoints at the begin (head) and end (foot) of a line section
			lineHeadX = this.points[i].getImgFractionX();
			lineHeadY = this.points[i].getImgFractionY();
			if( i < nrPoints - 1)
			{
				lineFootX = this.points[ i + 1 ].getImgFractionX();
				lineFootY = this.points[ i + 1 ].getImgFractionY();		
			}
			else //if last handlepoint reached, take the start handlepoint as foot
			{
				lineFootX = this.points[ 0 ].getImgFractionX();
				lineFootY = this.points[ 0 ].getImgFractionY();		
			}
			distancePointFromLine = this.getDistancePointFromLine(pointX,pointY,lineHeadX,lineHeadY,lineFootX,lineFootY);
			//get index of section with smallest deviation to point
			if(distancePointFromLine != null && distancePointFromLine < minDistancePointFromLine)
			{
				indexNearestSection = i;
				minDistancePointFromLine = distancePointFromLine;
			}
		}
		
		//if deviation of point from nearest found section is below threshold, the point is considered to lie on the line section, 
		//then return section index, else return null (meaning: point is not near enough to any section to be considered lying on a section line
		return (minDistancePointFromLine < thresholdDistanceFromPolygonLineToAddPoint)? indexNearestSection : null;
	}

	/*
	 * calculates distance from point to a line, support function for method 'findSectionWherePointIs'
	 * The line is the line between points lineHead and lineFoot
	 * The distance is measured perpendicular to the line, between the point and the intersection of the line and its perpendicular line through the point
	 * The intersection must lie between lineHead and lineFoot
	 * The distance is expressed in y imgFractions, corrected such that 0,1 is equal length on screen in y direction as in x direction
	 */
	this.getDistancePointFromLine = function(pointX,pointY,lineHeadX,lineHeadY,lineFootX,lineFootY)
	{
		var sectionIsHorizontal = (lineHeadY == lineFootY);
		var sectionIsVertical   = (lineHeadX == lineFootX);
		//calc rico (slope) of line section | a = dy/dx
		var slopeSection =  (lineFootY - lineHeadY) / (lineFootX - lineHeadX);
		//perpendicular slope = negative inverse slope; we need to correct for widthHeightRatio: real lengths of x and y as x and y imgFractions are not equally long
		//var widthHeightRatio = imgWidthMaxZoom/imgHeightMaxZoom;
		var perpendicularSlope = ( -1 / slopeSection ) * Math.pow((widthHeightRatio),2);
		//determine section formula, determine y=ax+b --> calc b = y-ax
		var bSection =  lineHeadY - (slopeSection * lineHeadX);
		//determine formula of line through point, perpendicular to section, determine y=ax+b --> calc b = y-ax
		var bLineThroughPoint = pointY - (perpendicularSlope * pointX);
		if (sectionIsHorizontal)
		{
			var intersectionX = pointX;
			var intersectionY = lineHeadY;			
		}
		else if(sectionIsVertical)
		{
			var intersectionX = lineHeadX;
			var intersectionY = pointY;
		}
		else
		{
			//calc intersection point of line through point and section line: 
			//slopeSection*x + bSection = perpendicularSlope*x + bLineThroughPoint ==>
			//slopeSection*x - perpendicularSlope*x = bLineThroughPoint - bSection
			//x = (bLineThroughPoint - bSection) / (slopeSection - perpendicularSlope)==>
			var intersectionX = (bLineThroughPoint - bSection) / (slopeSection - perpendicularSlope);			
			//calc yIntersection
			var intersectionY = (perpendicularSlope * intersectionX) + bLineThroughPoint;
		}
			
		//intersection should lie between the points that border the line
		if(isInRange(intersectionX,lineHeadX,lineFootX) && isInRange(intersectionY,lineHeadY,lineFootY) )
		{
			//calc distance point to sectionline = distance to intersection point; expressed in y imgFractions, corrected such that 0,1 is equal length on screen in y direction as in x direction
			//we need to correct for widthHeightRatio: real lengths of x and y as x and y imgFractions are not equally long
			var distancePointFromLine = Math.sqrt( Math.pow( ((pointX - intersectionX) * widthHeightRatio), 2) + Math.pow( (pointY - intersectionY), 2) );//Pythagoras
		}
		else
		{
			var distancePointFromLine= null;		
		}
		//displayCalc+= "pointX="+pointX+", pointY="+pointY+", lineHeadX="+lineHeadX+", lineHeadY="+lineHeadY+", lineFootX="+lineFootX+",lineFootY="+lineFootY+", widthHeightRatio="+widthHeightRatio+", slopeSection="+slopeSection+", perpendicularSlope="+perpendicularSlope+", bSection="+bSection+", bLineThroughPoint="+bLineThroughPoint+", intersectionX="+intersectionX+", intersectionY="+intersectionY+", distancePointFromLine="+distancePointFromLine+"\n\n"; 
		return distancePointFromLine;
		
	}
	
	this.closePolygon = function()
	{
		this.isClosed = true;
		//from now on we'll use the polygon instead of the polyline
		this.svgPolyObject = this.svgPolygon;
		//polygon is ready. Note: it is still active until deactivated by clicking new polygon or clicking outside polygon
		shapeObjects.unregisterPolygonUnderConstruction();
		//change display of startpoint to a regular point
		this.points[0].unshowAsStartPoint();
		//adapt shape to present point positions
		this.update();
		//we have switched to polygon, this must also be adapted to look good
		this.formatDisplayToZoom(); 
		//clean up
		this.svgPolyline.remove();
		//make button 'New drawing' prominent
		ToolButton.activateButtonNewDrawing();
	}
	
	
	this.removeHandlePoint = function(handlePoint)
	{
		var nrPoints= this.points.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			if(this.points[i] === handlePoint)
			{
				this.points.splice(i,1);
				break;
			};
		}
		this.update();
	}
	


	///////////////////////////////////////////////////////
	// Event handlers Polygon
	///////////////////////////////////////////////////////
	
	// Adding Point to some section of polygon
	//this.svgPolyline.mousedown(handleMouseDownOnPoly); //doesn't work - why?
	//this.svgPolygon.mousedown(handleMouseDownOnPoly);
	this.svgPolyline.on("mousedown",function(event)
	{
		this.parentObject.handleMouseDownOnPoly(event);	
	});

	this.svgPolygon.on("mousedown",function(event)
	{
		this.parentObject.handleMouseDownOnPoly(event);	
	});
	
	this.handleMouseDownOnPoly = function(event)
	{
		if(shapeObjects.getToolState() == "drawPolygon")
		{			
			//in case the polygon is not active, activate it
			this.activate();
			//test if we need to add point to the polygon
			var imgFractionCoords= getImgCoords(cursorX,cursorY);
			var indexSectionToAddPoint = this.findSectionWherePointIs(imgFractionCoords.x,imgFractionCoords.y);
			//document.getElementById("namePanel").innerHTML= 'mousedown on section '+indexSectionToAddPoint;
			if(indexSectionToAddPoint != null)
			{
				this.addPoint({"event":event,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y,"indexSectionToAddPoint":indexSectionToAddPoint, "enableDirectDrag":true});					
				event.stopPropagation();			
			}
			//attach custom flag to event, which will enable the window mousedown handler to know it should not deactivate the polygon
			event.isInPolygon = true;
		}
	};

	// Closing Polygon
	/*
	 * 'object mousedown'= artificial mousedown = method on the Polygon object. Note: Polygon = JavaScript object, not HTML or svg element
	 * This method is called in conjuction with a real mousedown event on a HTML/svg element
	 */
	this.mouseDownInObject = function(event)
	{
		//if the mousedown originated from a handlePoint of the polygon and that handlePoint was the start HandlePoint...
		if(event.targetObject && event.targetObject instanceof HandlePoint && event.targetObject.isPolygonStartPoint() && !this.isClosed)
		{
			this.closePolygon();
		}
	}
	
	/////////////////////////////////////////////////////
	// End event handlers Polygon
	/////////////////////////////////////////////////////

} //EOF Polygon

/////////////////////////////////////////////////
// Polygon static properties and methods
/////////////////////////////////////////////////

/*
 * returns a strokeWidth in svg units (pixels) that looks good at the present zoom level
 */
Polygon.baseStrokeWidth = 2;
Polygon.getCurrentStrokeWidth = function()
{
	return Polygon.baseStrokeWidth * Math.pow(2,(gTierCount - 1 - now.zoom));
}



/////////////////////////////////////////////////////
//Extend Zoom functions with zooming of svg shapes
////////////////////////////////////////////////////

var old_ZoomIn = ZoomIn;
ZoomIn = function(e) 
{
	old_ZoomIn.apply(this, arguments);
	ZoomSvg(e);
}

var old_ZoomOut = ZoomOut;
ZoomOut = function(e) 
{
	old_ZoomOut.apply(this, arguments);
	ZoomSvg(e);
}

function ZoomSvg(e)
{
	
	//svg.js style
	if(typeof svgCanvas != "undefined")
	{
		
		var scale = 1 / (Math.pow(2,(gTierCount - 1 - now.zoom)));

		//HELP!
		//if this line is commented out it works in FF, if this line is present it works (kind of) in Chrome and IE
		//svgCanvas.attr("viewBox", "0 0 "+ imgWidthMaxZoom + " " + imgHeightMaxZoom);
	
		//this line works fine on ff (but notneeded) but not on chrome
		//svgCanvas.attr("viewBox", "0 0 "+ imgWidthPresentZoom + " " + imgHeightPresentZoom);
		
		//svgCanvas.scale(scale);
		//alert('going to scale with factor:'+scale)
		svgShapes.scale(scale);
		svgCanvas.attr("width", imgWidthPresentZoom);
		svgCanvas.attr("height", imgHeightPresentZoom);
		
		//adapt shapes to zoom level
		countShapeObjects = shapeObjects.length;
		for(var i = 0; i <= countShapeObjects - 1; i++)
		{
			if(shapeObjects[i] instanceof Polygon)
			{	
				//@TODO: first test if polygon is within view
				shapeObjects[i].formatDisplayToZoom();
			}
		}
	
		//we need widthHeightRatio to correct for different nr pixels width from height
		// in fact you only need to calc it once when image is loaded, but the numbers are read by init() in tiledviewer.js. Tiledviewer.js is loaded before segmenter.js, init() is called on body onload
		// if I extend init() to calc this I'm not sure how the timing of body load is related to the timing of loading segmenter.js and extending init()
		// so it seems safer to calculate it in zoom, even though that means it is calculated several times - at each zoom action- so many times unneccessary - maybe can be improved
		widthHeightRatio = imgWidthMaxZoom/imgHeightMaxZoom;

		//var averageDimension = (imgWidthMaxZoom + imgHeightMaxZoom) / 2;
		//heightToAverageDimensionFactor = averageDimension / imgHeightMaxZoom;
		//widthToAverageDimensionFactor  = averageDimension / imgWidthMaxZoom;
		//alert("imgWidthMaxZoom="+imgWidthMaxZoom+", imgHeightMaxZoom="+imgHeightMaxZoom+ "widthToAverageDimensionFactor="+widthToAverageDimensionFactor+", heightToAverageDimensionFactor="+heightToAverageDimensionFactor)

		//sets threshold distances in drawing appropriate to present zoom level
		setThresholdsToZoomLevel();
	}

}

/*
 * sets threshold distances appropriate to present zoom level
 * Called by ZoomSvg()
 */
function setThresholdsToZoomLevel()
{
	setThresholdTrailDropMinDistance();
	setThresholdTrailDropMaxDistance();
	setThresholdDistanceFromPolygonLineToAddPoint();
}


/*
 *sets the threshold distance from a polygon section line for a point to be added to the polygon (on click on the point). Depends on present zoom level.
 */ 

function setThresholdDistanceFromPolygonLineToAddPoint()
{
	var minPixelThreshold = 30;
	thresholdDistanceFromPolygonLineToAddPoint = minPixelThreshold * Math.pow(2,(gTierCount-now.zoom-1))/ imgWidthMaxZoom;
}

/*
*test n tries
*	
 * native svg - succesful
 var svgContainer = document.getElementById("imageSegmentations");
	//alert(scale2);
	if(svgContainer)
	{
		svgContainer.setAttribute("transform","scale("+scale2+")");
		svgContainer.setAttribute("width", imgWidthPresentZoom);
		svgContainer.setAttribute("height", imgHeightPresentZoom);
	}
*/
	
/*
 * viewBox experiment - worked, but not succesful
 * var vb= document.getElementById("imageSegmentations").getAttribute("viewBox");
		
		var scale = Math.pow(2,(now.zoom - 2));
		var dims = new Array();
		dims[0] = 0;
		dims[1] = 0;
		dims[2] = imgWidthMaxZoom / scale;
		dims[3] = imgHeightMaxZoom / scale;
		
		var strDims = dims.join(" ");
		
		svgContainer.setAttribute("viewBox", strDims);
*/
	
/*	jQ( ".svg" ).each(function() {
		svgElem= $( this ).get(0);
		svgElem.setAttribute("transform","scale(2)") //does not work

	});
*/

