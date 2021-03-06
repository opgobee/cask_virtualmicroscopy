/*
* Segmenter: to demarcate areas in images
* Dependencies: svg-x.x.x..min.js
*
*/

//temp
var displayCalc="";




var svgCanvas, svgShapes, ButtonDeleteActiveHandlePoint; 

/*
 * checks whether x lies between a and b, indifferent whether a>b or a<b and of pos or neg numbers
 * http://codegolf.stackexchange.com/questions/8649/shortest-code-to-check-if-a-number-is-in-a-range-in-javascript
 */
function isInRange(x,a,b)
{
	return ( ((x-a)*(x-b)) < 0 );
}

//initialize svg canvas
jQ( document ).ready(function() {
	
	//test
	function clearnamepanel()
	{
		document.getElementById('namePanel').innerHTML= "";	
	}

	setInterval(clearnamepanel, 4000)

	//end test
	
	if (SVG.supported) 
	{
		svgCanvas = SVG('svgContainer');
		svgCanvas.attr("style", "border: 1px solid #ff0000;");
		svgShapes = svgCanvas.group(); //group that will contain all svg shapes and will be scaled
		svgCanvas.shapeObjects = Array(); //will contain the JavaScript objects HandlePoint, Polygon etc (Note: these objects in turn contain the svg shapes)
		svgCanvas.activeHandlePoint = null;
		svgCanvas.activePolygon = null;
		svgCanvas.activeTool = null;
		setTimeout("ZoomSvg()",100); //temp workaround because at document ready the initialization of the tiles is not yet ready so the size is not yet known. timeout can be removed when svg area is made on demand of wanting to draw something
		
		//creates a new polygon and starts drawmode of it, or returns to drawmode of a polygon that is still under construction 
		svgCanvas.shapeObjects.drawPolygon = function ()
		{
			svgCanvas.activeTool = "drawPolygon";
			if(svgCanvas.activePolygon == null)
			{
			   	var newPolygon = new Polygon();	
			   	svgCanvas.shapeObjects.push(newPolygon);
		    	svgCanvas.activePolygon = newPolygon;	
			}	
		}
		
		//deletes a handlePoint, its svg and updates dependent polygon
		svgCanvas.shapeObjects.deleteActiveHandlePoint = function ()
		{
			if(	svgCanvas.activeHandlePoint != null)
			{
				svgCanvas.activeHandlePoint.remove(); //calls remove() on the active HandlePoint - removes the internal svgshape, and downstream: removes from the polygon
				delete svgCanvas.activeHandlePoint; //delete the object refered to in svgCanvas.activeHandlePoint, svgCanvas.activeHandlePoint will become undefined
				svgCanvas.activeHandlePoint = null; //reset to null
				ButtonDeleteActiveHandlePoint.unsetDeleteActive(); //reset handlepointdelete button to inactive
			}
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
	
	//create and insert the toolpanel at the bottom
	jQ( "body" ).append( '<div id="drawToolPanel">'
			+'<button class="down" id="btNormal">Pan/zoom slide</button>'
			+'<button id="btDrawPolygon">Draw outline</button>'
			+'<button id="btDeletePoint">Delete Point</button>'
			+'</div>' );
	
	// button events
	// button 'Normal usage' - action
	jQ('button#btNormal').click(function(){
	    jQ(this).addClass("down");
	    jQ('button#btDrawPolygon').removeClass("down");
	    svgCanvas.activeTool = null;
	});
	
	// button 'Draw polygon' - action
	jQ('button#btDrawPolygon').click(function(){
		jQ(this).addClass("down");
		jQ('button#btNormal').removeClass("down");
		svgCanvas.shapeObjects.drawPolygon();
	});
	
	// button 'Delete handlepoint' - action
	jQ('button#btDeletePoint').click(function(){
		svgCanvas.shapeObjects.deleteActiveHandlePoint();
	});
	
	// buttons dynamic styling
	ButtonDeleteActiveHandlePoint = {};
	
	//sets the style on button 'delete active handle point' that indicates that there is a handlepoint active, thus may be deleted
	ButtonDeleteActiveHandlePoint.setDeleteActive = function()
	{
		jQ('button#btDeletePoint').addClass('deleteActive');
	}

	//sets the style on button 'delete active handle point' that indicates that there is no handlepoint active, thus none can be deleted
	ButtonDeleteActiveHandlePoint.unsetDeleteActive = function()
	{
		jQ('button#btDeletePoint').removeClass('deleteActive');
	}
	
	//////////////////////////////////////////////// end toolpanel
	
}); //end document ready

/////////////////////////////
//extend events of basic cask microscopy viewer
/////////////////////////////
//http://stackoverflow.com/questions/4578424/javascript-extend-a-function

var old_handleMouseDown = handleMouseDown;
handleMouseDown = function(e) 
{
	//alert('body')
	//alert(svgCanvas.activeTool);
	var imgFractionCoords= getImgCoords(cursorX,cursorY);	
	
	//document.getElementById("namePanel").innerHTML= "mousedown";
	
	HandlePoint.deselectActiveHandlePoint();
	
	switch(svgCanvas.activeTool) {
    case "createPoint":
    	var newHandlePoint = new HandlePoint(imgFractionCoords.x,imgFractionCoords.y,e);
    	svgCanvas.shapeObjects.push(newHandlePoint);
    	return;
        break;
    case "drawPolygon":
    	if(svgCanvas.activePolygon != null)
   		{
    		//alert('going to add point')
    		svgCanvas.activePolygon.addPoint({"event":e,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y});    		
   		}
    	return;
    	break;
    	
    default:
        
	}
	old_handleMouseDown.apply(this, arguments);
	
};






/////////////////////////////
//Constructors
/////////////////////////////

function createPoly()
{
	//alert('create poly')
	var polygon = svgCanvas.polygon('4992,5888 4512,6336 4320,7648 4928,8480 5824,8416 7072,7424 6560,7584 6176,7072 5120,6784').fill('#0000ff').opacity(0.5).stroke({ width: 50 })
	svgShapes.add(polygon);
}


function HandlePoint(imgFractionX,imgFractionY,e)
{	
	this.parentObject = null; //reference to a shape object (e.g. polygon object) that contains this handlepoint
	this.imgFractionX = imgFractionX; //location on image, expressed in image fraction (0-1)
	this.imgFractionY = imgFractionY; //location on image, expressed in image fraction (0-1)
	var fullImgX = imgFractionX * imgWidthMaxZoom; //location on image of max image size, expressed in pixels
	var fullImgY = imgFractionY * imgHeightMaxZoom;
	
	//returns the x position of this handlePoint, expressed in imgage fraction (0-1)
	this.getImgFractionX = function()
	{
		return this.imgFractionX;
	}

	//returns the y position of this handlePoint, expressed in imgage fraction (0-1)
	this.getImgFractionY = function()
	{
		return this.imgFractionY;
	}
	
	//activates this handlePoint and sets it as the active shape in svgCanvas. 
	this.activate = function(e) 
	{
		
		HandlePoint.deselectActiveHandlePoint();
		svgCanvas.activeHandlePoint = this;
		this.enableDrag(e); 
		svgCanvas.activeHandlePoint.showAsActive();
		ButtonDeleteActiveHandlePoint.setDeleteActive();
	}

	this.deactivate = function()
	{	
		this.disableDrag();
		this.showAsInactive();	
	}
	
	this.enableDrag = function(event)
	{
		document.getElementById('namePanel').innerHTML += "enableDrag "+event.type;
		this.svgCircle.draggable();
		this.svgCircle.draggable.triggerStart(event); //note custom addition inside svg.draggable.js...		
	}

	this.disableDrag = function()
	{
		//make undraggable
		this.svgCircle.fixed();
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

	//set reference to possible shapeobject that contains this handlePoint
	this.setParentObject = function(parentObject)
	{
		this.parentObject = parentObject;
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
	this.svgCircle.draggable();
	this.activate(e);

	
	/////////////////////////////////////////
	// remove
	/////////////////////////////////////////
	/*
	 * downstream removes this handlepoint from the polygon and removes the internal svgcircle
	 */
	this.remove = function()
	{
		//alert("remove point")
		//remove from any parentshape (such as polygon) that may hold it 
		if(this.parentObject) 
		{
			this.parentObject.removeHandlePoint(this);
		}
		//remove svg circle
		this.svgCircle.remove();
	}
	
	///////////////////////////////////////////////////////
	//event handlers
	///////////////////////////////////////////////////////
	
	this.svgCircle.mouseDownHandler = function(event)
	{
		event.stopPropagation();
		var thisHandlePoint = this.parentObject;		
		thisHandlePoint.activate(event);

		//transfer event to handlePoint
		thisHandlePoint.mouseDownInObject(event);
	}
	
	this.svgCircle.mousedown( this.svgCircle.mouseDownHandler );
	
	this.svgCircle.dragstart = function(event)
	{
		//set dragspeed according to zoom level
		this.svgCircle.startPosition.zoom /= Math.pow(2,(gTierCount-now.zoom-1));
		this.startImgFractionX = this.imgFractionX; //expressed in image fraction (0-1)
		this.startImgFractionY = this.imgFractionY;
	}.bind(this); //bind(this) : JavaScript cookbook ch 16.12 p383 and http://javascriptissexy.com/javascript-apply-call-and-bind-methods-are-essential-for-javascript-professionals/
	
	this.svgCircle.dragmove = function(delta, event) 
	{
		var imgFractionDeltaX = getImgFractionDeltaX(delta.x);//expressed in image fraction (0-1)
		var imgFractionDeltaY = getImgFractionDeltaY(delta.y);
		this.imgFractionX = this.startImgFractionX + imgFractionDeltaX; //expressed in image fraction (0-1)
		this.imgFractionY = this.startImgFractionY + imgFractionDeltaY;
		//this was for testing: document.getElementById('namePanel').innerHTML='x='+ this.imgFractionX + ', y=' + this.imgFractionY + ', deltax=' + imgFractionDeltaX + ', deltay=' + imgFractionDeltaY;		 
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
	
	//start the dragging
	//NOTE: USES A CUSTOM ADDITION ADDED INSIDE THE DRAGGABLE SCRIPT - NOT VERY NICE - HOW TO DO BETTER??
	document.getElementById('namePanel').innerHTML += "base "+e.type;
	//this.svgCircle.draggable.triggerStart(e);
	
	//ALL BELOW ATTEMPTS TO TRIGGER START WITHOUT HAVING TO CHANGE THE ORIGINAL DRAGGABLE FUNCTION, FAILED
	//	this.svgCircle.start(e); //doesnt work
	//this.svgCircle.dispatchEvent(e);
/*	this.svgCircle.triggerStart = function(e)
	{
		alert(e.type)
		this.dispatchEvent(e);
		 var triggeredEvent = new MouseEvent('mousedown', {
			'view': window,
			'bubbles': true,
			'cancelable': true
		});
		this.dispatchEvent(triggeredEvent);
		
	}
	setTimeout(this.svgCircle.triggerStart(e),1);
*/	
/*	var evt = document.createEvent('MouseEvents');
	evt.initEvent("mousedown", true, true);
	evt.pageX= e.pageX;
	evt.pageY= e.pageY;
	this.svgCircle.node.dispatchEvent(evt);
*/
	
	/*
	 * formats sizes of elements so they look good at the current zoom level
	 */
	this.formatDisplayToZoom = function()
	{
		//adapt to zoom level
		this.svgCircle.style({'stroke-width' : HandlePoint.getCurrentStrokeWidth()});
		this.svgCircle.radius((HandlePoint.getCurrentRadius())/2); //division factor 2 empirically determined
	}
	

}

//static properties and methods on HandlePoint
HandlePoint.deselectActiveHandlePoint = function()
{
	if(svgCanvas.activeHandlePoint != null)
	{		
		svgCanvas.activeHandlePoint.deactivate();
	}
	svgCanvas.activeHandlePoint = null;
	ButtonDeleteActiveHandlePoint.unsetDeleteActive();
}

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


/////////////////////////////////////////////////////////////////////////////////
//  Polygon
/////////////////////////////////////////////////////////////////////////////////



function Polygon()
{
	
	this.points= Array();
	this.isClosed = false; //is true when polygon has been closed
	this.leftMostCoordinate = null;
	this.rightMostCoordinate = null;
	this.topMostCoordinate = null;
	this.bottomMostCoordinate = null;
	
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
	
	
	//sets this polygon as the active shape in svgCanvas. 
	this.activate = function(e) 
	{
		Polygon.deselectActivePolygon();
		var nrPoints= this.points.length;
		//make all handlepoints draggable
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			this.points[i].enableDrag(e);
		}
		svgCanvas.activePolygon = this;	
		svgCanvas.activePolygon.showAsActive();
		//ButtonDeleteActiveHandlePoint.setDeleteActive();
	}

	/*
	 * Causes the handlepoints to not be draggable anymore
	 */
	this.deactivate = function()
	{
		var nrPoints= this.points.length;
		//make all handlepoints undraggable
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			this.points[i].deactivate();
		}
		this.showAsInactive();
	}
	
	//apply 'active' style to this handlePoint
	this.showAsActive = function()
	{
		this.svgPolyObject.addClass('activePolygon');
	}
	
	//remove 'active' style from this handlePoint
	this.showAsInactive = function()
	{
		this.svgPolyObject.removeClass('activePolygon');
	}
	
	/*
	 * @param params can contain:
	 * "event" = event object
	 * "imgFractionX" = number 0-1 x position expressed in image fraction
	 * "imgFractionY" = number 0-1 y position expressed in image fraction
	 * "indexSectionToAddPoint" = integer: index of the sectionof the polygon into which the point should be added (optional)
	 */
	this.addPoint = function(params)
	{
		//alert('in add point')
		if(typeof params == "undefined") {return;}
		var e = params["event"];
		var imgFractionX =  params["imgFractionX"];
		var imgFractionY =  params["imgFractionY"];
		var indexSectionToAddPoint = params["indexSectionToAddPoint"];
		var newPoint = new HandlePoint(imgFractionX,imgFractionY,e);
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
		newPoint.svgCircle.dragmove = function(delta,event)
		{
			//alert("extended")
			this.update();
			old_dragmove.call(newPoint,delta,event);

			//point is only draggable if polygon drawing is switched on, and this is the active polygon
			if(svgCanvas.activeTool == "drawPolygon" && this === svgCanvas.activePolygon)
			{
			}
		}.bind(this)		
		
		//indexSectionToAddPoint = index of the section of the polygon into which the point should be added (= optional param to addPoint method)
		if(typeof indexSectionToAddPoint == "undefined")
		{ 	//add the point to the end of the array
			this.points.push(newPoint);
		}	
		else
		{	//insert the point into a specific section
			this.points.splice(indexSectionToAddPoint+1,0,newPoint);
		}
		this.update();
	}
	
	
	/*
	 * This function will loop all sections between the handlePoints of the poly 
	 * and determine if the passed point is near enough to any of these line sections to be considered to lie on this line section
	 * If so, the index of that section (section nearest to point) is returned, else null is returned
	 */
	this.findSectionWherePointIs = function(pointX, pointY)
	{
		var minDistancePointFromLine = 10; 
		var distancePointFromLine = 10;
		var thresholdDistancePointFromLine = 0.01;
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
		
		//test temp
		//alert(displayCalc);
		//displayCalc="";
		
		//if deviation of point from nearest found section is below threshold, the point is considered to lie on the line section, 
		//then return section index, else return null (meaning: point is not near enough to any section to be considered lying on a section line
		return (minDistancePointFromLine < thresholdDistancePointFromLine)? indexNearestSection : null;
	}

	/*
	 * calculates distance from point to a line 
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
		var widthHeightRatio = imgWidthMaxZoom/imgHeightMaxZoom;
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
	
	/*
	 * gets an array of coordinates from the points
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
	 * closes the polygon, that is: replaces the polyline that is originally used by a polygon and switches off polygon drawing
	 */
	this.closePolygon = function()
	{
		this.isClosed = true;
		//from now on we'll use the polygon instead of the polyline
		this.svgPolyObject = this.svgPolygon;
		//stop with drawing of the polygon
		svgCanvas.activeTool = null;
		
		//update so it will also make a line of the last section stretch
		this.update();
		//clean up
		this.svgPolyline.remove();
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
	

	/*
	 * updates the polygon. Is called after a handlePoint of the polygon has been changed (moved, deleted, added etc)
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
	

	/*
	 * 'object mousedown'= artificial mousedown = method on the Polygon object. Note: Polygon = JavaScript object, not an HTML or svg element
	 * This method is called in conjuction with a real mousedown event on a HTML/svg element: the svgPolygon or svgPolyline, or a svgCircle in a HandlePoint
	 */
	this.mouseDownInObject = function(event)
	{
		//if the mousedown originated from a handlePoint of the polygon and that handlePoint was the start HandlePoint...
		if(event.targetObject && event.targetObject instanceof HandlePoint && event.targetObject.isPolygonStartPoint())
		{
			this.closePolygon();
		}
	}
	
	//	this.svgPolyline.mousedown(this.handleMouseDownOnPoly); //doesn't work - why?
	//	this.svgPolygon.mousedown(this.handleMouseDownOnPoly);
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
		//add point to the polygon
		var imgFractionCoords= getImgCoords(cursorX,cursorY);
		indexSectionToAddPoint = this.findSectionWherePointIs(imgFractionCoords.x,imgFractionCoords.y);
		//document.getElementById("namePanel").innerHTML= 'mousedown on section '+indexSectionToAddPoint;
		if(indexSectionToAddPoint != null)
		{
			this.addPoint({"event":event,"imgFractionX":imgFractionCoords.x,"imgFractionY":imgFractionCoords.y,"indexSectionToAddPoint":indexSectionToAddPoint});					
			event.stopPropagation();			
		}
	};
	
}
//statics
//static properties and methods on HandlePoint
Polygon.deselectActivePolygon = function()
{
	if(svgCanvas.activePolygon != null)
	{
		svgCanvas.activePolygon.deactivate(); 
	}
	svgCanvas.activePolygon = null;
//	ButtonDeleteActivePolygon.unsetDeleteActive();
}


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
		countShapeObjects = svgCanvas.shapeObjects.length;
		for(var i = 0; i <= countShapeObjects - 1; i++)
		{
			if(svgCanvas.shapeObjects[i] instanceof Polygon)
			{	
				//@TODO: first test if polygon is within view
				svgCanvas.shapeObjects[i].formatDisplayToZoom();
			}
		}
	}
	
/*	
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
}