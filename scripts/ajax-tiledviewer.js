//Written by Shawn Mikula, 2007.   Contact: brainmaps--at--gmail.com.   You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 

// Extensively modified by Paul Gobee, Leiden Univ. Med. Center, Netherlands, 2010.   Contact: o.p.gobee--at--lumc.nl. This notification should be kept intact, also in minified versions of the code.

/*
 * In the URL-query you can pass the following parameters:
 * 
 * slide: 		name of the slide to load, slideInfo will be read from a file slides.js that must be present
 * zoom: 		zoom level {values: 0-max zoomlevel for the image}
 * x: 			x coordinate (horizontal fraction of image) will be centered {values: 0-1}
 * y: 			y coordinate (vertical fraction of image) will be centered {values: 0-1}
 * showcoords: 	determines whether panel will be shown that displays the image-coordinates where the cursor is {values: 0 or 1}
 * wheelzoomindirection: determines what direction of rotation of the mousewheel causes zoom-in {values: "up" or "down"}
 * 
 * 
 */

// Keep modification list, and tests intact in full code, but may be removed in minified code
// Modifications:
// FIX BUG losing images or undefined image if dragging at low zoom levels to right or bottom (Sol: in getVisibleTiles) 
// Note: too high count at smaller zooms inside viewPort uncorrected because it slowed down responsiveness
// FIX BUG clickthumb not working on IE (Sol: call winsize after onload + catch event in clickTumb)
// FIX BUG dragging from inside thumb2 not working on FF, Chrome, IE (only worked in Mac-Saf) (Sol: Handler on Thumb0, for IE: Thumb3 - filter opacity as described in forum)
// FIX BUG not fetching tiles after thumb navigation until move mouse outside thumb (add checktiles call in clickthumb) 
// FIX BUG keypress plus not well detected. On Opera one must use + key and SHIFT - keys, and not Numeric keypad keys
// FIX BUG micrometer-character correct
// FIX BUG enclosed call of XmlHHTPRequest in a try{} because causes error on IE6 with ActiveX disabled (eg secure office/hospital environment)
// FIX BUG? removed if-clause in loadllabels which caused it not to work on ie
// FIX BUG? removed '-16' subtraction in coords calculation (now in function getCoordsImg) due to which labels were incorrectly repositioned at small zooms
// FIX BUG/CHG replaced function getVar by function getQueryArgs because getVar could misrecognize args, eg. 'jslabels' was also found as 'labels' 
// FIX ERR referencing to elements by id/name in global scope generated errors
// ADD thumb2 visibly moves while dragged (originally only jumped to drag-end position)
// ADD doubleclick zooms in, hold mouse down zooms out (with a workaround for IE)
// ADD grey background colour behind not yet loaded tiles
// ADD prevent dragging or zooming outside viewport
// ADD center map at window resize
// ADD mobile mode: click mobile icon shows up/down/left/right autopan navigation arrows, moves thumb to top-left (prevents errors with offsetted visual viewports)
// ADD styling of labels via class 'label'; 'name' in labels file was not yet used. Set it in title on label div
// ADD loadlabels as separate option, independent of presence of a stack of images
// ADD fallback for IE6 with ActiveX disabled and IE6/8 local: use iFrame to get width and height from Imgeproperties.xml (signal: grey 'I' top-right)
// ADD fallback for IE6 with ActiveX disabled: use script insert to get labels.js (signal: grey 'j' top-right) [note: requires calling as 'jslabels' instead of 'labels' and prepending:   jsLabels=    before the JSON
// ADD Informative warning messages explaining why no image is visible if no path is given or no width & height are given or retrievable
// ADD Additional credit information can be added per slide, by using credit="..path_to_credits.js_file.." in html page or query and putting extra text in credits.js file
// ADD/CHG More clear scale bar, with resizing of bar to round length numbers, display in micron, cm or mm; (more clear) bar-image instead of hr
// ADD/CHG Zoom centers around cursorposition when zooming with scrollbutton or mouseclick. Zoomcenter remains center of viewport when zooming with +/- or zoombuttons.
// CHG repositioned thumb and zoomIn and zoomOut icons and zoomInfo to upper right corner
// CHG reorganised: clustered similar code, collective functions handlemousedown, handlemouseup etc., separate into functions: centermap, getNrTiers, countTilesPerTier, getImgCoords, etc.
// CHG function name: $ to: ref, to prevent conflicts upon possible combining with other libraries
// EFFIC countTilesPerTier() performed once, not in each checkTiles
// EFFIC func processmove, call to checktiles in (if drag) to prevent checking at simple mousemove without drag
// EFFIC in loop in checktiles removed call to moveThumb2, now called once in higher level calling functs together with call of checktiles()


/* TESTED:
img= shows basic image correctly
noDims= shows image correctly even if no width and height are specified in html-page or in query (i.e. collects them from imageProperties.xml)
Labels= shows labels correctly (collected from labels.js)

						img			noDims			Labels 			Mechanism of loading of ImageProperties.xml and labels.js files
/// ONLINE /////
Firefox 3.6		  		OK			OK				OK				Standard XMLHttpRequest
IE8 ActiveX				OK			OK				OK				MS XMLHTTP
IE8 No ActiveX			OK			OK				OK				Standard XMLHttpRequest
IE6 ActiveX				OK			OK				OK				MS XMLHTTP
IE6 No ActiveX			OK			OK				OK				XML via I-Frame fallback, labels via load script fallback
Chrome 6.0				OK			OK				OK				Standard XMLHttpRequest
Safari					OK			OK				OK				Standard XMLHttpRequest
Opera					OK			OK				OK				Standard XMLHttpRequest
iPad					OK
iPhone					OK
Android					OK

/// LOCAL without server ///
Firefox 3.6 			OK			OK				OK				Standard XMLHttpRequest
IE8 ActiveX				OK			OK				OK				XML via I-Frame fallback, labels.js via MS XMLHTTP (!?)
IE8 No ActiveX 			OK?			OK?				OK?				(Untestable, no access anymore to My Computer Security settings in IE8)
IE6 ActiveX				OK			OK				OK				XML via I-Frame fallback, labels.js via MS XMLHTTP (!?)
IE6 No ActiveX			OK			OK				OK				XML via I-Frame fallback, labels via load script fallback
Chrome 6				OK			--				--				XHR doesn't work locally on Chrome 6, neither does I-frame fallback
Safari					OK			OK				OK				Standard XMLHttpRequest
Opera					OK			OK				OK				Standard XMLHttpRequest
*/

/*
Instructions for new features:

Have labels on IE6 with ActiveX disabled:
1. modify the labels.js file: prepend "jsLabels=" (without quotes) in front of JSON
2. in the query or in the html page, set "jslabels=...path to labels.js..." instead of "labels=...path to labels.js..." 

Display additional credit information:
1. create .js-file containing: credits= "...html to display...";
2. in the query or in the html page, set "credits=...path to credits.js..."
*/

//alert("load main page");
//defaults
var tileSize = 256; 
var center = 0; 
var res = 0.46; 
var resunits = "&micro;m";
var slidePointer = 0; 
var wheelmode = 0; 
var showCoordsPanel = 0; //default dont show coords panel
var zoom = 2; //start zoom level
var hideThumb = false;
var vX = vY = null;
var showLabel = null; //label that will be shown on the requested x, y spot 
var zoomCenterUnlockThreshold= 3;//nr of pixels move needed to unlock a zoomCenterLock
var wheelZoomInDirection = -1; //determines zoomin/out direction of wheel -1 = wheeldown

//image
var path = null; //may be defined in html page (then overwrites the null value set here)
var rawPath = null; //as read from html page or query
var imgPath = null; //path as used in program
var height = null, width = null; //may be defined in html page (then overwrites the null values set here)
var rawWidth = null, rawHeight = null; //as read from html page, query or xhr, but may be string
var imgWidthMaxZoom = null, imgHeightMaxZoom= null; //parsed to integer, width/height of max size image
var imgWidthPresentZoom = null, imgHeightPresentZoom= null; //integer, shortcut for gTierWidth/Height[zoom]
var loadedXML=0, getJSON=0, loadedJSON=0, JSON= null, JSONnum, JSONout; //used in xhr loading of XML and JSON files
var labelsPath=null, loadedLabels = false, oLabels, labelTimer;//oLabels= object containing the read labels
var jsLabelsPath=null; //if given, contains path to a js which is not a *raw* JSON (used on IE6-non ActiveX to load labels)
var creditsPath=null; //path to .js file with additional credits to display
var gTierCount; //nr of zoom levels
var gTierWidth = new Array(), gTierHeight = new Array(); //width and height of image at certain zoomlevel
var	gTileCountWidth = new Array(), gTileCountHeight = new Array(); //number of tiles at certain zoomlevel
var viewportWidth, viewportHeight; //dimensions in pixels of viewport
var innerDiv, innerStyle, imageTiles, imageLabels, bgDiv; //global refs to elements, bgDiv= grey background
var dragOffsetLeft, dragOffsetTop, dragging= false; //used in dragging image
var zoomOutTimer= false, autoZooming= false; //used to auto-zoomout if mouse hold down on image
var lockedZoomCenterX= null, lockedZoomCenterY= null; //if using +/- keys or zoombuttons locks the start zoomcenter until mousemove or zoom on cursor
var lockedZoomCursorX= null, lockedZoomCursorY= null; //
var cursorX, cursorY; //continuously keeps track of cursorposition to enable scrolling with centerpoint cursorposition
var downX=null,downY=null;//IE workaround for autozoomout

//controls and thumbnail
var controls0, controls1; //controls0 contains thumb and controls, controls1 contains zoom-buttons
var thumb0, thumb, thumb2, thumb3; //thumb0=container, thumb=img, thumb2=cyan box, thumb3=for catching events on IE 
var thumb0Width, thumb0Height, thumb2Width, thumb2Height; 
var thumb2DragOffsetLeft, thumb2DragOffsetTop, thumbDragging= false; //used in dragging cyan box
var tips;//contains tips shown over zoom buttons
var tipTimer=false, zoomCenterOnCursor= false;// zoomCenterOnCursor true: zooms around cursorPosition, false: zooms around ImgCenter
var zoomInTipsIndex=0; zoomInTipsShown=false;
var zoomInTips=[ 
"To ZOOM IN, you may also<br /><strong>double click</strong> the image",
"To ZOOM IN, you may also<br /><strong>press the (+) key</strong>",
"To ZOOM IN, you may also<br /><strong>scroll the mouse-wheel</strong>"
];
var zoomOutTipsIndex=0, zoomOutTipsShown=false;
var zoomOutTips=[ 
"To ZOOM OUT, you may also<br /><strong><em>press and hold down</em> the mouse</strong> on the image",
"To ZOOM OUT, you may also<br /><strong>press the (-) key</strong><br /><em>[on Opera: SHIFT plus (-) key]</em>",
"To ZOOM OUT, you may also<br /><strong>scroll the mouse-wheel</strong>"
];
//environment sniffing
var mobile=false; var panDir=false; var recheckTilesTimer= false;
var isIE= (navigator.userAgent.indexOf("MSIE") != -1)? true : false; //for IE workarounds
//var IEVersion = (isIE)? readIEVersion() : null; //not yet used
var isMobile= (navigator.userAgent.indexOf("Mobile") != -1)? true : false;
var isiPad= (navigator.userAgent.indexOf("iPad") != -1)? true : false;






//do all stuff that can be done as soon as document has loaded
function init0() 
	{
logwin=document.getElementById("log"); 
logwin.ondblclick=resetlog;

	//ih("init0");
	//create global references to DOM elements 
	innerDiv = document.getElementById("innerDiv"); 
	innerStyle= innerDiv.style; //keep ref to speed up
	imageTiles = document.getElementById("imageTiles"); 
	imageLabels = document.getElementById("imageLabels");
	bgDiv=ref('bgDiv'); //grey background div behind image
	thumb0=ref('Thumb0'); 
	thumb=ref('Thumb');  
	thumb2=ref('Thumb2');
	thumb3=ref('Thumb3');	
	controls0=ref('controls0');
 	controls1=ref('controls1');
	tips=ref('tips');
	//local references to DOM elements
	var outerDiv = document.getElementById("outerDiv"); 
	
	//get variables defined in html page
	rawPath = path;
	rawWidth = width;
	rawHeight = height;

	//get variables from query in URL
	var queryArgs= getQueryArgs();
		
	//set or adapt globals with query information
	if (queryArgs.start){ slidePointer = queryArgs.start;}
	if (queryArgs.slide) {slideName = queryArgs.slide;}
	if (queryArgs.showcoords) {showCoordsPanel = queryArgs.showcoords;} 
	if (queryArgs.resunits) {resunits = queryArgs.resunits;} 
	if (queryArgs.JSON){ JSON = queryArgs.JSON;}	
	if (queryArgs.zoom){ zoom = queryArgs.zoom;}
	if (queryArgs.x) { vX = queryArgs.x;}
	if (queryArgs.y) { vY = queryArgs.y;}
	if (queryArgs.label) { showLabel = queryArgs.label;}
	if (queryArgs.hidethumb) {hideThumb = queryArgs.hidethumb;}; 
	if (queryArgs.wheelzoomindirection) {wheelZoomInDirection = (queryArgs.wheelzoomindirection == "up")? 1 : ((queryArgs.wheelzoomindirection == "down")? -1 : wheelZoomInDirection);}; 


	if(!slideName)
		{showNoSlideRequestedWarning();
		return
		}
	if(typeof slides == "undefined"  || !slides[slideName])
		{
		showRequestedSlideNotPresentWarning();
		return;
		}
	//load slideInfo of requested slide
	//here the global var 'slides' is read!!
	slideInfo = slides[slideName];
	if (slideInfo.path) {rawPath = slideInfo.path;} 
	if (slideInfo.width) {rawWidth = slideInfo.width;} 
	if (slideInfo.height) {rawHeight = slideInfo.height;} 
	if (slideInfo.res)	{res = slideInfo.res;}
	if (slideInfo.labels) {labelsPath = slideInfo.labels;} 
	if (slideInfo.jslabels) {jsLabelsPath = slideInfo.jslabels;}//ih('jsLabelsPath='+jsLabelsPath) 
	if (slideInfo.credits) {creditsPath = slideInfo.credits;} 	

	//check if path is provided
	if(rawPath)	{imgPath=rawPath;}
	else {showNoPathWarning(); return;}
	
	//if dimensions not yet known, try to read from ImageProperties.xml file
	if (!rawWidth && !loadedXML && !getJSON) //why getJSON check?
		{//ih("init0-loadXML");
		 loadXMLfile();
	 	} 

	//load credits file and show additional credits
	if(creditsPath)
		{
		try
			{loadJs(creditsPath);
			displayCredits();
			}
		catch(e)
			{return;}	
		}
	//test
	//loadJs("P-2/labels.js")

		 
	//Set event handlers
	outerDiv.onmousedown = handleMouseDown; outerDiv.onmousemove = handleMouseMove; outerDiv.onmouseup = handleMouseUp; outerDiv.ondblclick= handleDblClick; 
	//outerDiv.ontouchstart  = handleMouseDown; outerDiv.ontouchmove = handleMouseMove; outerDiv.ontouchup = handleMouseUp; //weird behaviour for now 
	outerDiv.ondragstart = function() { return false;}

	window.onresize=winsize; //moved to here to prevent error on Chrome	
	
	if (isMobile) {setMobileOn();}
	//if (isiPad) {trackOrientation();}	

	recheckTilesTimer=setInterval("checkTiles()", 5000); //because regularly 'loses' updating tiles eg at viewport scroll, resize 

//ih("init0ready");
	//shows or hides the coords panel
	showHideCoordsPanel();
	
	//if width and height info available, do rest of init//note: if read from xhr, the xmlread function will call init()
	if (rawDimensionsKnown()) {init();}
	
	}//eof init()


//do calculations and rendering for which width and height are needed	
function init() 
	{//ih("init");

	//set global information 
	imgWidthMaxZoom=parseInt(rawWidth); 
	imgHeightMaxZoom=parseInt(rawHeight); 	
	gTierCount = getNrTiers(); //no of levels

	var o = countTilesPerTier(); //gets nr of tiles and width and height dimensions for each level
	gTierWidth= o.gTierWidth; //unpack the return object and set the globals
	gTierHeight= o.gTierHeight;

	imgWidthPresentZoom= gTierWidth[zoom]; //shortcut
	imgHeightPresentZoom= gTierHeight[zoom]; //shortcut
	
//ih("init-winsize");
	winsize();//do after onload for IE

	/////////////////
	//Position image
	////////////////
	
	
	//center on a requested x and y
	if (vX && vY)
		{//ih("init-vXCenter, vX="+vX);
			center=1; 
			centerOn(vX,vY);
			//and show the requested label
			if(showLabel)
			{
				createLabel("called", {"label": showLabel,  "x": vX, "y": vY});
				resizeLabels();
			}
		}
	//center on middle of image
	else
		{//ih("init-centerMap");	
		centerMap();
		}
	
	

	//load JSON
	if (JSON && !loadedJSON)
		{ getJSON=1; 
		loadJSON(); 
		ref("Nav").style.display="block"; 
		ref('wheelMode').style.display="block";
		}
	
	//load labels
	if (labelsPath && !loadedLabels) 
		{//ih("init0-loadLbl");
		loadLabels(labelsPath);
		} 

	//load jslabels (indicates that the labels file is not a *raw*  JSON, hence is also safe to load via script-insert, if needed.
	if (jsLabelsPath && !loadedLabels) 
		{//ih("init0-loadJsLbl");
		loadLabels(jsLabelsPath);
		} 
	


//ih("init-showThumb");
	if (!hideThumb) 	{showThumb();}
		
//ih("init-updateDiverse");
	resizeBgDiv(); 
	checkTiles(); 
	moveThumb2(); 
	updateLengthBar();

	if(hasSmallViewport()) {adaptDimensions();}
	}


function centerOn(xcoord,ycoord)
{
	innerDiv.style.left= -xcoord*imgWidthMaxZoom/(Math.pow(2,gTierCount-1-zoom)) +viewportWidth/2+"px";
	innerDiv.style.top= -ycoord*imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom))+viewportHeight/2+"px";
}

function getNrTiers()
	{
	var tempWidth = imgWidthMaxZoom; var tempHeight = imgHeightMaxZoom;  var divider=2; var gTierCount = 1; 
	
	while (tempWidth>tileSize || tempHeight>tileSize)
		{ tempWidth = Math.floor(imgWidthMaxZoom/divider);
		tempHeight = Math.floor(imgHeightMaxZoom/divider); 
		divider*=2; 
		if(tempWidth%2) tempWidth++; 
		if(tempHeight%2) tempHeight++; 
		gTierCount++; //this loop determines nr of zoom levels of picture (tier)
		}
	
	return gTierCount;
	}	
	
//determines x and y number of tiles at all available tiers, e.g. gTileCountWidth[3]= nr tiles across width at zoom level 3
function countTilesPerTier()
	{
	var gTierWidth = new Array(); var gTierHeight = new Array(); //double with global declaration: only for clarity  
	
	var tempWidth = imgWidthMaxZoom; var tempHeight = imgHeightMaxZoom; var divider=2; 

	for (var j=gTierCount-1; j>=0; j--) 
		{ gTileCountWidth[j] = Math.floor(tempWidth/tileSize); //couldn't this one and tempwidth one be replaced by ceil and no modulo addition?
		if (tempWidth%tileSize){ gTileCountWidth[j]++;}
		gTileCountHeight[j] = Math.floor(tempHeight/tileSize); 
		if (tempHeight%tileSize){ gTileCountHeight[j]++;}
		
		gTierWidth[j] = tempWidth; //store mapsizes at each tier
		gTierHeight[j] = tempHeight; //store mapsizes at each tier
		
		//ih("j="+j+", gTierWidth[j]="+gTierWidth[j]+", typeof gTierWidth[j]="+typeof gTierWidth[j]+"<br>");
		tempWidth = Math.floor(imgWidthMaxZoom/divider); 
		tempHeight = Math.floor(imgHeightMaxZoom/divider); 
		divider*=2; 
		if(tempWidth%2) tempWidth++; 
		if(tempHeight%2) tempHeight++;
		}
	//let the function return gTierWidth and gTierHeight instead of setting globals hidden in function
	return {"gTierWidth":gTierWidth,"gTierHeight":gTierHeight}; 
	}
	
	
function handleMouseDown(event)
	{if(!event) {event=window.event;}
	//ih("mouseDown ");
	clearZoomOutTimer();
	downX=event.clientX;
	downY=event.clientY;

	zoomCenterOnCursor= true;
	autoZoomOut();	//init autozoom, is cancelled by mousemove or mouseup
	startMove(event); 	
	stopAutoPan();	
	//ih("isIE"+isIE+", downX="+downX+", downY="+downY+", autoZooming="+autoZooming)
	}	

function handleMouseUp(event)
	{//ih("mouseUp<br>");
	clearZoomOutTimer(); //cancel autozoomout
	zoomCenterOnCursor= false;
	stopMove(event);
	}
	
function handleDblClick(event)
	{//ih("dblclick ");
	clearZoomOutTimer(); //cancel autozoomout
	zoomCenterOnCursor= true;
	ZoomIn();
	}	


function handleMouseMove(event)
	{if(!event) {event=window.event;}
	//ih("mouseMove, "+event.clientX+","+event.clientY+"; ");
	
	//keep track of cursorposition to enable cursorposition-centered zooming
	cursorX=event.clientX;
	cursorY=event.clientY;
	
	//ih(event.srcElement.id+"-> move ");
	//IE workaround. IE for some reason fires extra mousemoves, which cancel the autozoomout. Workaround to let autoZoomout work well: cancel the incorrect mousemove event if 'autoZooming' (this is set when mouse is held down) and if IE and cursor not moved
	//ih("isIE"+isIE+", downX="+downX+", downY="+downY+", autoZooming="+autoZooming)
	if(autoZooming && isIE && downX==cursorX && downY==cursorY)	{;return;} 

	if(lockedZoomCenterX)
		{//unlock if present cursorposition is further away than threshold from cursorpos at lock 
		if( (Math.abs(cursorX - lockedZoomCursorX) > zoomCenterUnlockThreshold) || (Math.abs(cursorY - lockedZoomCursorY) > zoomCenterUnlockThreshold) )
			{lockedZoomCenterX = lockedZoomCenterY = lockedZoomCursorX = lockedZoomCursorY = null; //unlock	
			}
		}
	clearZoomOutTimer(); //dragging, no autoZoomOut	
	processMove(event);
	}
	
		
///// DRAGGING /////
		
function startMove(event) 
	{ 
	if (!event){ event = window.event;}
	var dragStartLeft = event.clientX; 
	var dragStartTop = event.clientY; 
	var mLeft = stripPx(innerDiv.style.left); 
	var mTop = stripPx(innerDiv.style.top); 
	dragOffsetLeft= Math.round(mLeft - dragStartLeft);
	dragOffsetTop= Math.round(mTop - dragStartTop);
	dragging = true; return false;
	}


function processMove(event) 
	{//ih("processmove ");
	if (!event){ event = window.event;}
	
	//ih("showCoordsPanel="+showCoordsPanel + ",");
	if (showCoordsPanel == 1) //displaying of mouse coords. This could be commented out in production to dimish load
		{var imgCoords= getImgCoords(cursorX,cursorY);
		
		coordX = imgCoords.x;
		coordY = imgCoords.y;
		if( coordX <= 0 || coordX >=1 || coordY <= 0 || coordY >=1)
			{
				coordX = coordY = "<span class='deemphasize'>Outside slide</span>";
			}
		
		ref('coordsPane').innerHTML= "x: " + coordX + ", y: " + coordY ;
		}
	if (dragging) 
		{innerStyle.left = event.clientX + dragOffsetLeft;
		innerStyle.top = event.clientY + dragOffsetTop; 
		checkTiles();
		moveThumb2();
		}
	
	}

function stopMove() 
	{dragging = false; 
	keepInViewport();
	}
	
//gets a position on the image expressed between 0,0 (top-left corner) and 1,1 (bottom-right corner). Independent of zoom level.
function getImgCoords(cursorX,cursorY)	
	{var imgCoords={};
	imgCoords.x = Math.round(((cursorX - stripPx(innerDiv.style.left))/(imgWidthMaxZoom/(Math.pow(2,gTierCount-1-zoom)))*1000))/1000;
	imgCoords.y = Math.round(((cursorY - stripPx(innerDiv.style.top))/(imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom)))*1000))/1000; //removed -16 subtraction in Brainmaps code
	return imgCoords;
	}
	
//gets center of the visible part of the image. Used as zoomcenter at +/- or buttonclick zooming
function getVisibleImgCenter()	
	{var imgCenter={};

	var mLeft = stripPx(innerStyle.left); 
	var mTop = stripPx(innerStyle.top);
	var mRight = mLeft + imgWidthPresentZoom;
	var mBottom = mTop + imgHeightPresentZoom;
	//visible part of image
	var visLeft  = (mLeft < 0)? 0 : mLeft;
	var visRight = (mRight > viewportWidth)? viewportWidth : mRight;
	var visTop	 = (mTop < 0)? 0 : mTop;
	var visBottom= (mBottom > viewportHeight)? viewportHeight : mBottom; 

	imgCenter.x= Math.round( visLeft + (visRight - visLeft)/2 );
	imgCenter.y= Math.round( visTop + (visBottom - visTop)/2 );
	
//	ih("visLeft="+visLeft+",visRight="+visRight+", imgCenter.x="+imgCenter.x+"visTop="+visTop+",visBottom="+visBottom+", imgCenter.y="+imgCenter.y)
//	ih("imgCenter.x="+imgCenter.x+", imgCenter.y="+imgCenter.y+"<br>")	 
//	imgCenter.x = Math.round( stripPx(innerDiv.style.left) + imgWidthMaxZoom/  (2 * Math.pow(2,gTierCount-1-zoom) ) );
//	imgCenter.y = Math.round( stripPx(innerDiv.style.top)  + imgHeightMaxZoom/ (2 * Math.pow(2,gTierCount-1-zoom) ) );
	return imgCenter;
	}
	
function cursorOverImage()
	{var mLeft = stripPx(innerStyle.left); 
	var mTop = stripPx(innerStyle.top);
	var mRight = mLeft + imgWidthPresentZoom;
	var mBottom = mTop + imgHeightPresentZoom;

	return (mLeft <= cursorX && cursorX <= mRight && mTop <= cursorY && cursorY <= mBottom)? true : false;	
	}	
	
//// ZOOMING /////
//handles click on zoombuttons
function btZoomIn()
	{zoomCenterOnCursor= false; 
	ZoomIn();
	}

function btZoomOut()
	{zoomCenterOnCursor= false; 
	ZoomOut();
	}

function ZoomIn() 
	{ //ih("in zoomin, zoom="+zoom);
	//ih(", gTierCount-1="+(gTierCount-1)+"<br>");
	
	if (zoom!=gTierCount-1)
		{var mTop = stripPx(innerDiv.style.top); 
		var mLeft = stripPx(innerDiv.style.left); 

		if (lockedZoomCenterX && lockedZoomCenterY) // (if continuously zoomin/out. Unlock by mouse-move)
			{zoomCenterX = lockedZoomCenterX;
			zoomCenterY = lockedZoomCenterY;
			}
		else if(zoomCenterOnCursor && cursorOverImage()) //zooming with scrollbutton or mouseclick> center on mouse-position
			{zoomCenterX = cursorX;
			zoomCenterY = cursorY;
			}
		else //zooming with +/- keys or zoom-buttons> center on center of visible part of image
			{var visImgCenter=getVisibleImgCenter();
			lockedZoomCenterX = zoomCenterX = visImgCenter.x;
			lockedZoomCenterY = zoomCenterY = visImgCenter.y;
			lockedZoomCursorX = cursorX;
			lockedZoomCursorY = cursorY;
			}


//ih("zoomCenterX="+zoomCenterX+", zoomCenterY="+zoomCenterY+"<br>")
		innerDiv.style.left = 2 * mLeft - zoomCenterX;
		innerDiv.style.top = 2 * mTop - zoomCenterY;
	
//ih("innerDiv.style.left="+innerDiv.style.left+", innerDiv.style.top="+innerDiv.style.top)		
		zoom=zoom+1; 
		
		var imgs = imageTiles.getElementsByTagName("img"); 
		while (imgs.length > 0) imageTiles.removeChild(imgs[0]); 
		checkTiles();
		
		var divs = imageLabels.getElementsByTagName("div"); 
		for (var $i = 0; $i <divs.length; $i++) //new placement of the labels
			{ var Ltemp="L"+$i; ref(Ltemp).style.top=2*stripPx(ref(Ltemp).style.top); ref(Ltemp).style.left=2*stripPx(ref(Ltemp).style.left);}
			
		imgWidthPresentZoom= gTierWidth[zoom]; //shortcut
		imgHeightPresentZoom= gTierHeight[zoom]; //shortcut

		resizeBgDiv();	
		keepInViewport();
		updateLengthBar();	
		moveThumb2();
		//lowZoomHideLabels();
		resizeLabels();
		}
	
	}


function ZoomOut() 
	{ 
	if (zoom!=0)
		{var mTop = stripPx(innerDiv.style.top); 
		var mLeft = stripPx(innerDiv.style.left); 
	
		if (lockedZoomCenterX && lockedZoomCenterY) // (if continuously zoomin/out. Unlock by mouse-move)
			{zoomCenterX = lockedZoomCenterX;
			zoomCenterY = lockedZoomCenterY;
			}
		else if(zoomCenterOnCursor && cursorOverImage()) //zooming with scrollbutton or mouseclick> center on mouse-position
			{zoomCenterX = cursorX;
			zoomCenterY = cursorY;
			}
		else //zooming with +/- keys or zoom-buttons> center on center of visible part of image
			{var visImgCenter=getVisibleImgCenter();
			lockedZoomCenterX = zoomCenterX = visImgCenter.x;
			lockedZoomCenterY = zoomCenterY = visImgCenter.y;
			lockedZoomCursorX = cursorX;
			lockedZoomCursorY = cursorY;
			}

//ih("zoomCenterX="+zoomCenterX+", zoomCenterY="+zoomCenterY+"<br>")
		innerDiv.style.left = 0.5 * mLeft + 0.5 * zoomCenterX; 
		innerDiv.style.top = 0.5 * mTop + 0.5 * zoomCenterY; 
		
		zoom=zoom-1; 
		
		var imgs = imageTiles.getElementsByTagName("img"); 
		while (imgs.length > 0) imageTiles.removeChild(imgs[0]); 
		checkTiles(); 
		
		var divs = imageLabels.getElementsByTagName("div"); 
		for (var $i = 0; $i <divs.length; $i++)
			{ var Ltemp="L"+$i; ref(Ltemp).style.top=.5*stripPx(ref(Ltemp).style.top); ref(Ltemp).style.left=.5*stripPx(ref(Ltemp).style.left);}
		}
		
		imgWidthPresentZoom= gTierWidth[zoom]; //shortcut
		imgHeightPresentZoom= gTierHeight[zoom]; //shortcut

		resizeBgDiv(); 
		keepInViewport(); 
		updateLengthBar(); 
		moveThumb2();
		//lowZoomHideLabels();
		resizeLabels();
	}


//hide labels at low zoom, because then the labels appear to be offset, probably due to Zoomify inaccuracies at high size reductions (=low zoom)
function lowZoomHideLabels()
	{if(zoom<=1) {imageLabels.style.display="none";}
	else {imageLabels.style.display="block";}
	}
	
function updateLengthBar() 
	{//you want a bar between 50 and 125px long
	var um50 = Math.pow(2,gTierCount-1-zoom)*res*50; // micrometers equiv. with 50 px
	var um125 = um50 * 2.5; // micrometers equiv. with 100 px
	
	var step=[1,2,5];
	var pow10 = 1;
	var found= false;
	var barUm; //amount of micrometers of bar
	
	//get round amount of micrometers that correlates with a bar between 50 and 125 px
	loop: 
	while (!found)
		{for(var i=0; i < 3; i++)
			{barUm = step[i] * pow10; //makes steps: 1,2,5,10,20,50,100,200,500,1000, etc.
			if( um50 <= barUm && barUm <= um125)
				{found= true;
				break loop;
				}
			}
		pow10 *= 10;
		}
	
	//get width of bar
	var barPx = Math.round( barUm  * 50 / um50) - 6; //6 = 2 * white parts of vert. bars are each 3 px wide

	//calculate and set positions of bar-images
	var barMidPos =  100 - Math.round (barPx/2); //barContainer = 200 px, middle = 100
	ref("bar_left").style.left = (barMidPos - 3) +"px";
	ref("bar_mid").style.left = barMidPos +"px";
	ref("bar_mid").style.width = barPx +"px";
	ref("bar_right").style.left = (barMidPos + barPx) +"px";

	//set resunits to um, mm or cm.
	if 		(pow10  < 1000) 	{resunits= "&micro;m";}
	else if (pow10 == 1000) 	{resunits= "mm"; barUm = (barUm / 1000);}
	else if (pow10 >= 10000)	{resunits= "cm"; barUm = (barUm / 10000);}

	// display bar-length
	var txt= barUm + "  " + resunits + "<br />zoom level: " + zoom + "/" + (gTierCount-1);
	if (JSONnum) { text += "<br>slide #: " + (slidePointer+1) + "/" + JSONnum ;}
	ref('theScale1').innerHTML = ref('theScale2').innerHTML = txt;

	}



function autoZoomOut()
	{
	//ih("autoZoomOut called, zoomOutTimer="+zoomOutTimer+"<br>");
	if(!zoomOutTimer) //first call, delay before starting to zoomout
		{clearZoomOutTimer();
		autoZooming=true;
		zoomOutTimer = setTimeout("autoZoomOut()",1000);
		//ih(" 1ST time timer SET= "+zoomOutTimer+"  ");
		return;
		}	
	else if(zoom>0)
		{clearZoomOutTimer()
		dragging = false;
		autoZooming=true;
		ZoomOut();
		zoomOutTimer = setTimeout("autoZoomOut()",750);	
		//ih(" Nth time timer SET= "+zoomOutTimer+"  ");	
		}
	else
		{//ih("END autoZoomOut + call clearTimer ");
		clearZoomOutTimer()
		}
	}

function clearZoomOutTimer()
	{clearTimeout(zoomOutTimer); //simple clearTimeout proved insufficient
	zoomOutTimer=false;
	autoZooming=false;
	//ih("timer cancelled ");
	}	

	
	
function showZoomInTips()	
	{if(!mobile)
		{if(!zoomInTipsShown) {autoShowZoomInTips();}
		else {tipTimer=setTimeout("autoShowZoomInTips()",3000);} //start showing tips after delay
		}	
	}
	
function showZoomOutTips()	
	{if(!mobile)
		{if(!zoomOutTipsShown) {autoShowZoomOutTips();}
		else {tipTimer=setTimeout("autoShowZoomOutTips()",3000);} //start showing tips after delay
		}	
	}	

function setZoomInTipIndex()
	{if(zoomInTipsIndex < (zoomInTips.length - 1)) 
		{zoomInTipsIndex++;}
	else //restarting tips
		{zoomInTipsIndex = 0; zoomInTipsShown=true;} 
	return zoomInTipsIndex;
	}
	
function setZoomOutTipIndex()
	{if(zoomOutTipsIndex < (zoomOutTips.length - 1)) 
		{zoomOutTipsIndex++;}
	else //restarting tips
		{zoomOutTipsIndex = 0; zoomOutTipsShown=true;} 
	return zoomOutTipsIndex;
	}
	
function autoShowZoomInTips()
	{tips.style.display="block";
	tips.innerHTML=zoomInTips[zoomInTipsIndex];
	zoomInTipsIndex=setZoomInTipIndex();
	clearTimeout(tipTimer);
	tipTimer=setTimeout("autoShowZoomInTips()",1500); //switch tip shown
	}	
		
function autoShowZoomOutTips()
	{tips.style.display="block";
	tips.innerHTML=zoomOutTips[zoomOutTipsIndex];
	zoomOutTipsIndex=setZoomOutTipIndex();
	clearTimeout(tipTimer);
	tipTimer=setTimeout("autoShowZoomOutTips()",1500); //switch tip shown
	}	
		
function hideTips()
	{tips.style.display="none";
	clearTimeout(tipTimer);
	}


////////////////////////////////////////////
//
// LABELS Functions
//
///////////////////////////////////////////

/*
 * loading of labels is quite patchy (on FF)
 * if you use XHR and add something to the querystring nothing is loaded without error message
 * if you use loadJs() the file is loaded and executed, but the variable jsLabels in it cannot be accessed, is undefined...
 * if you use jQ.getScript() it gives a cross-domain error
 * if you use jQ with cross-domain = true, then no error, but also no data
 * if you try to load json (adapted so it doesn't contain var jslabels= {}, but only the {..}) , then nothing comes, no error
 * In all cases nothing visible in firebug net panel..?
 * Conclusion: the below function is the best up till now, working mostly, but easily broken. 
 */
function loadLabels(pathToFile)
	{ 
	
	try
		{//ih("loadLblwXhr-1");

 		//clear any old labels
		var pinImage = ref("L0");  
		//alert("labels="+typeof labels)
		if (pinImage) 
			{var divs = imageLabels.getElementsByTagName("div");
			//alert("going to clear labels") 
			while (divs.length > 0) imageLabels.removeChild(divs[0]);
			} 

		//load new labels	
		xhrLabels = getHTTPObject();  //moved inside loadLabels function PG
		//ih(xhrLabels);
		//added if to prevent breaking if labels don't work, removed else, this made labels disappear at a next call of loadlabels
		if(xhrLabels)			
			{//alert("getting labels");
			xhrLabels.open("GET", pathToFile , true);
			xhrLabels.onreadystatechange = readLabels;
			xhrLabels.send();
			//ih("loadLblwXhr-2");
			}
		}	
	 catch(e)
		{return;
		}	
		
	}

function readLabels() 
	{ //ih('xhrLabels.readyState=' + xhrLabels.readyState+ 'xhrLabels.responseText='+xhrLabels.responseText + '<br>');
	if (xhrLabels.readyState == 4  && xhrLabels.responseText) 
		{//alert(xhrLabels.responseText)
		eval(xhrLabels.responseText);
		
		oLabels = jsLabels; //eval('('+xhrLabels.responseText+')');
		
		loadedLabels=true;
//ih("readLblfromXhr");
//debug(oLabels);
		renderLabels();
		}
	}

	
function renderLabels() 
	{//ih("renderLabels1");
		if(!dimensionsKnown()) 
			{clearTimeout(labelTimer);
			labelTimer=setTimeout("renderLabels()", 500); 
	//ih("dimensionsUnknown");
			return;
			}

		//remove any old labels
		var labelDivs = imageLabels.getElementsByTagName("div"); 
		while (labelDivs.length > 0) {imageLabels.removeChild(labelDivs[0]);}
	//ih("renderLabels2");
	//debug(oLabels);
	
		for (label in oLabels)
			{
			var labelInfo = oLabels[label];
			createLabel(label,labelInfo);		
			}
		
	}


/*
 * Creates a label from the given object oLabel and appends the label into div imageLabels
 * @param object labelInfo e.g. {"label": "Source", "popUpText": "Source: National Library of Medicine", "href": "http://images.nlm.nih.gov/pathlab9", "x": "0.038", "y": "0.0"}
 * 
 */
createLabel.index=0;
function createLabel(labelName,labelInfo)
{
	debug(labelInfo);
	var labelText = labelInfo.label;
	var labelPopUpText = (labelInfo.popUpText != undefined)? labelInfo.popUpText : ""; 
	var nX = labelInfo.x; 
	var nY = labelInfo.y; 
	if (labelInfo.href!=undefined)
		{labelText='<a href="'+labelInfo.href+'" target="_blank">'+labelText+'</a>'; 
		}
	var pinImage = document.createElement("div"); 
	pinImage.style.position = "absolute";
	//nX = nX + (0.002/(Math.pow(2,zoom-1))); //empirically determined corr.factors
	//nY = nY - (0.006/(Math.pow(2,zoom-1)));
	pinImage.style.left =(nX*imgWidthMaxZoom/(Math.pow(2,gTierCount-1-zoom))) +"px"; 
	pinImage.style.top =(nY*imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom))) +"px"; 
	pinImage.style.width = 8*labelText.length + "px"; pinImage.style.height = "2px"; 
	pinImage.style.zIndex = 1; 
	pinImage.setAttribute("id", "L"+createLabel.index);
	if(labelPopUpText != "")
		{pinImage.setAttribute("title", labelPopUpText);
		}
	pinImage.setAttribute("class", "label"); 
	pinImage.setAttribute("className", "label"); //IE
	pinImage.innerHTML= labelText; 
	//alert(pinImage);
	imageLabels.appendChild(pinImage); 
	
	createLabel.index++;
}

function resizeLabels()
{
	var fontSize  = ((zoom/(gTierCount-1)) * 300)  + "%";
	jQ(".label").css('fontSize',fontSize);	
}


////////////////////////////////////////////
//
// GENERAL IMAGE PROCESSING
//
///////////////////////////////////////////

	
function resizeBgDiv()
	{
	bgDiv.style.width = imgWidthPresentZoom + "px";
	bgDiv.style.height = imgHeightPresentZoom + "px";	
	}

function centerMap()
	{//ih("in centerMap1");
	if(dimensionsKnown())
		{innerDiv.style.left = (viewportWidth/2 - imgWidthPresentZoom/2 )+"px"; 
		innerDiv.style.top = (viewportHeight/2 - imgHeightPresentZoom/2 )+"px"; 
		center=1;
		//ih("in centerMap2");
		//alert( "centerMap: imgWidthMaxZoom="+imgWidthMaxZoom+", gTierCount="+gTierCount+", viewportWidth="+viewportWidth+", innerDiv="+innerDiv+", innerDiv.style="+innerDiv.style+", innerDiv.style.left="+innerDiv.style.left)
		}	
	else 
		{//ih("dimensionsUnknown");
		}	
	}
		
function keepInViewport()
	{//safety factor, keep minimally this amount of pixesl of image in view
	var minPixelsInView = 25;

	var mLeft = stripPx(innerStyle.left); 
	var mTop = stripPx(innerStyle.top);
	var mRight = mLeft + imgWidthPresentZoom;
	var mBottom = mTop + imgHeightPresentZoom;

	var limitLeft = minPixelsInView; //keep minimally 10 px of image within viewport
	var limitTop = minPixelsInView;
	var limitRight = viewportWidth - minPixelsInView;
	var limitBottom = viewportHeight - minPixelsInView;

	var corrected = false;

	if (mRight < limitLeft) {innerStyle.left = limitLeft - imgWidthPresentZoom; corrected = true;}
	if (mLeft > limitRight) {innerStyle.left = limitRight; corrected = true;}
	if (mBottom < limitTop) {innerStyle.top = limitTop - imgHeightPresentZoom; corrected = true;}
	if (mTop > limitBottom) {innerStyle.top = limitBottom; corrected = true;}
	
/*	
	if (gTierWidth[zoom] > viewportWidth) 
		{if (mLeft > 0)
			{mLeft = innerStyle.left = 0; corrected = true;} //correct left side margin inside viewport
		if ( (mLeft + gTierWidth[zoom]) < viewportWidth )	
			{innerStyle.left = viewportWidth - gTierWidth[zoom]; corrected=true;} //correct right side margin inside viewport
		}
	else
		{if (mLeft < 0)
			{mLeft = innerStyle.left = 0; corrected = true;}//correct left side outside viewport
		if ((mLeft + gTierWidth[zoom]) > viewportWidth )		
			{innerStyle.left = viewportWidth - gTierWidth[zoom]; corrected=true;} //correct right side outside viewport
		}	
	if (gTierHeight[zoom] > viewportHeight) 
		{if (mTop > 0)
			{mTop = innerStyle.top = 0; corrected = true;} //correct top side margin inside viewport
		if ( (mTop + gTierHeight[zoom]) < viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[zoom]; corrected = true;} //correct bottom margin inside viewport
		}
	else
		{if (mTop < 0)
			{mTop = innerStyle.top = 0; corrected = true;} //correct top outside viewport
		if ((mTop + gTierHeight[zoom]) > viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[zoom]; corrected = true;} //correct bottom outside viewport
		}
*/				
	if (corrected)	
		{checkTiles();
		moveThumb2();
		return "corrected";
		}
	}

	
/// LOADING TILES ////
	
function checkTiles() 
	{
	//ih("CHECKTILES()");// called by: "+checkTiles.caller+"<br>");

	if (!dimensionsKnown()) {return;}
	
	var visibleTiles = getVisibleTiles(); 
	var visibleTilesMap = {}; 
	for (i = 0; i < visibleTiles.length; i++)  //each entry is a tile, contains an array [x,y], number of tiles that would fit in the viewport
		{ var tileArray = visibleTiles[i]; //for this tile

		if (!center) {centerMap();} //???
		
//ih("imgWidthMaxZoom="+ (imgWidthMaxZoom/(Math.pow(2,gTierCount-1-zoom))) +"viewportWidth="+viewportWidth+"<br>");
		pCol=tileArray[0]; 
		pRow=tileArray[1]; 
//ih("pCol="+pCol+", pRow="+pRow+"<br>"); //at the smaller zoom levels there are far more pCol and pRow than actually called (and available) pictures

		//determine tilegroupnum, each tilegroup contains 256 images, theoffset is sequential num of img
		tier=zoom; 
		var theOffset=parseFloat(pRow*gTileCountWidth[tier]+pCol); //is this parseFloat doing sthing?
		for (var theTier=0; theTier<tier; theTier++) theOffset += gTileCountWidth[theTier]*gTileCountHeight[theTier]; 
		_tileGroupNum=Math.floor(theOffset/256.0); 
		
//ih("HANDLING= "+"TileGroup" + _tileGroupNum + " /Zoom: " + zoom + ", pCol: " + pCol + ", pRow: " + pRow + "<br>");


		if (pCol<gTileCountWidth[zoom] && pRow<gTileCountHeight[zoom])
			{var tileName = "TileGroup" + _tileGroupNum + "/" + zoom + "-" + pCol + "-" + pRow + ".jpg";
//ih("TILENAME CREATED</br>");
			}

		visibleTilesMap[tileName] = true; 
		var img = document.getElementById(tileName); 
//if(img) {ih("IMAGE PRESENT:"+tileName+"<br>");}
		if (!img) 
			{ img = document.createElement("img"); 
			img.src = imgPath + tileName; 
//ih("GETTING IMAGE: "+tileName+"</br>");
			img.style.position = "absolute"; 
			img.style.left = (tileArray[0] * tileSize) + "px"; 
			img.style.top = (tileArray[1] * tileSize) + "px"; 
			img.style.zIndex = 0; 
			img.setAttribute("id", tileName); 
			imageTiles.appendChild(img);
			}
		}
		
		var imgs = imageTiles.getElementsByTagName("img"); 
		for (i = 0; i < imgs.length; i++) 
			{ var id = imgs[i].getAttribute("id"); 
			if (!visibleTilesMap[id]) 
				{ imageTiles.removeChild(imgs[i]); i--;
				}
			}
			
		}
		
		
function getVisibleTiles() 
	{
	var mapX = stripPx(innerDiv.style.left); //whole image position rel to top left of viewport
	var mapY = stripPx(innerDiv.style.top);
	var startX = (mapX < 0)? Math.abs(Math.ceil(mapX / tileSize)) : 0; //x number of first tile to be called. Added: if inside viewport startX == 0
	var startY = (mapY < 0)? Math.abs(Math.ceil(mapY / tileSize)) : 0; 

	var tilesX = Math.ceil(viewportWidth / tileSize) +2;  //number of tiles to be called in x direction, seems to be 1 too much. Seems to be all tiles necessary to fill viewport, independent of position on page or zoom factor???
	var tilesY = Math.ceil(viewportHeight / tileSize) +1; 
	var visibleTileArray = []; var counter = 0; 
	for (x = startX; x < (tilesX + startX); x++) 
		{ for (y = startY; y < (tilesY + startY); y++) 
			{ if (x>=0 && y>=0)
				{ visibleTileArray[counter++] = [x, y];

				}
			}
		}

	return visibleTileArray; //seems to contain more entries than actually afterwards really called in page
	}
		

	
	
	
	

//// THUMB ////
	
function showThumb()
	{//alert("in showThumb: imgWidthMaxZoom="+imgWidthMaxZoom+", imgHeightMaxZoom="+imgHeightMaxZoom)
	
	if( !dimensionsKnown() ) {return;}
	
	thumb.style.display="block"; //unhide (in fact would be better on Thumb0)
	thumb.innerHTML='<img src="' + imgPath + 'TileGroup0/0-0-0.jpg">';
	

	thumb0Height = thumb0.style.height = imgHeightMaxZoom/(Math.pow(2,gTierCount-1))+2; 
	thumb0Width = thumb0.style.width = imgWidthMaxZoom/(Math.pow(2,gTierCount-1))+3; 

	var ctrl1=getElemPos(controls1);
	
	ref("controls0").style.height= thumb0Height + 10 + ctrl1.height;
	ref("controls0").style.width= (thumb0Width > ctrl1.width)?  thumb0Width : ctrl1.width;
	ref("controls1").style.top= thumb0Height + 10;

//ih("ctrl1.height="+ctrl1.height+", thumb0Height="+thumb0Height+", ctrl0.height"+ctrl0.height+", ctrl0.width="+ctrl0.width+"<br>"); 
//ih("thumbHeight="+thumbHeight+", thumbWidth="+thumbWidth+"<br>"); 
	
	thumb2.style.display="block"; 
	thumb3.style.display="block"; 
		
		
	thumb0.ondragstart = function() { return false;}
	thumb3.onmousedown = startThumbMove; thumb0.onmousemove = processThumbMove; thumb0.onmouseup = stopThumb; thumb3.ondragstart = function() {return false;}
	}

function hideThumb(){ ref('Thumb').style.display="none";}

	
function startThumbMove(event)
	{
	 if (!event){ event = window.event;}
	var thumb2DragStartLeft = event.clientX; 
	var thumb2DragStartTop = event.clientY; 
	var thumb2OrigLeft = stripPx(thumb2.style.left); 
	var thumb2OrigTop = stripPx(thumb2.style.top); 
	thumb2DragOffsetLeft = thumb2OrigLeft - thumb2DragStartLeft;
	thumb2DragOffsetTop = thumb2OrigTop - thumb2DragStartTop;
	thumbDragging = true; return false;
	
	}
	
function processThumbMove(event)
	{ if (!event){ event = window.event;}
	if (thumbDragging) 
		{thumb2.style.left = thumb3.style.left = event.clientX + thumb2DragOffsetLeft; 
		thumb2.style.top = thumb3.style.top = event.clientY + thumb2DragOffsetTop; 
		}
	}
	
//handles both end of drag thumb2 and random click positioning on thumb
function stopThumb(event)
	{//ih("XXX in stopThumb XXX");
	if (!event){ event = window.event;}
	if (event)
		{var eventX = event.clientX; var eventY = event.clientY; 
		var fractionLR, fractionTB; 
		//ih("XXX in If Event XXX");

		var t0= getElemPos(thumb0);
		var ctrl0= getElemPos(controls0);
		
		//ih("XXX in If Event AFTER XXX");
		if(thumbDragging)
			{//ih("XXX thumbDragging=TRUE XXX");
			thumbDragging = false;
			
			fractionLR = (eventX + thumb2DragOffsetLeft + thumb2Width/2 ) / thumb0Width; 
			fractionTB = (eventY + thumb2DragOffsetTop + thumb2Height/ 2 ) / thumb0Height; 			
			}
		else //if click on thumb0 without thumbdragging
			{
			//ih("XXX thumbDragging=FALSE XXX");
			fractionLR = (eventX - ctrl0.left - t0.left) / thumb0Width; 
			fractionTB = (eventY - ctrl0.top - t0.top) / thumb0Height; 
			//update position thumb2
			thumb3.style.left = thumb2.style.left = eventX - ctrl0.left - t0.left - thumb2Width/2;
			thumb3.style.top = thumb2.style.top = eventY - ctrl0.top - t0.top - thumb2Height/2;
			}	

/*			if(testing)
				{ih("eventX="+eventX+", eventY="+eventY+", t0.left="+t0.left+", ctrl0.left="+ctrl0.left+", ctrl0.top="+ctrl0.top+", thumb0Width="+thumb0Width+", thumb2Width/2="+thumb2Width/2+"<br>"); 	
				ih("t0.left="+t0.left+", t0.right="+t0.right+", t0.top="+t0.top+", t0.bottom="+t0.bottom+", t0.width="+t0.width+"<br>"); 
				ih("fractionLR="+fractionLR+", fractionTB="+fractionTB+"<br><br>"); 
				}
*/		
		innerDiv.style.left= viewportWidth/2 - gTierWidth[zoom]*fractionLR;
		innerDiv.style.top= viewportHeight/2 - gTierHeight[zoom]*fractionTB;

		keepInViewport();
		checkTiles();
			
		}
	}

//resizes Thumb2 and Thumb3, thumb2 in fact indicates screen (viewport) size in relation to shown image
function moveThumb2()
	{
	//ih("moveThumb2()"+moveThumb2.caller);
	topT = stripPx(innerDiv.style.top); leftT = stripPx(innerDiv.style.left); 
	thumb3.style.width = thumb2.style.width = thumb2Width = viewportWidth/Math.pow(2,zoom); 
	thumb3.style.height = thumb2.style.height = thumb2Height = viewportHeight/Math.pow(2,zoom); 
	thumb3.style.left = thumb2.style.left = -leftT/(Math.pow(2,zoom)); 
	thumb3.style.top = thumb2.style.top = -topT/(Math.pow(2,zoom));

//ih("Math.pow(2,zoom)="+Math.pow(2,zoom)+", viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+", Thumb2.style.width="+Thumb2.style.width+", Thumb2.style.height="+Thumb2.style.height+", leftT="+leftT+", topT="+topT+", Thumb2.style.left="+Thumb2.style.left+", Thumb2.style.top="+Thumb2.style.top+"<br>");
	}

	
function getElemPos(elemRef)
	{var pos={};
	
	if(window.getComputedStyle)
		{var compStyle= getComputedStyle(elemRef,"");
		pos.left= stripPx(compStyle.getPropertyValue("left"));
		pos.right= stripPx(compStyle.getPropertyValue("right"));
		pos.top= stripPx(compStyle.getPropertyValue("top"));
		pos.bottom= stripPx(compStyle.getPropertyValue("bottom"));
		pos.width= stripPx(compStyle.getPropertyValue("width"));
		pos.height= stripPx(compStyle.getPropertyValue("height"));		
		}
	else if (elemRef.currentStyle)
		{//var currStyle=elemRef.currentStyle;
		pos.left= stripPx(elemRef.currentStyle.left);
		pos.right= stripPx(elemRef.currentStyle.right);
		pos.top= stripPx(elemRef.currentStyle.top);
		pos.bottom= stripPx(elemRef.currentStyle.bottom);
		pos.width= stripPx(elemRef.currentStyle.width);
		pos.height= stripPx(elemRef.currentStyle.height);		
		}	

	//IE and Chrome only return 'auto'	--> parseFloat==> NaN
	pos.left = (isNaN(pos.left)) ? viewportWidth - pos.right - pos.width : pos.left;
	pos.top = (isNaN(pos.top)) ? viewportHeight - pos.bottom - pos.height : pos.top;
	
	//ih("Elem="+elemRef.id+", pos.left="+pos.left+", pos.right="+pos.right+", typeof pos.right="+typeof pos.right+", pos.top="+pos.top+", pos.bottom="+pos.bottom+", pos.width="+pos.width+", typeof pos.width="+typeof pos.width+", pos.height="+pos.height+"viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+"<br>"); 

	return pos;
	}
	
///////////////////////////////
// wheelmode: what does wheel do: zoomin/zoomout or next/prev in stack of images

function wheelMode1(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" checked  onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" onClick="wheelMode2()" >&nbsp;Next/Prev'; wheelmode=0;}

function wheelMode2(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" checked  onClick="wheelMode2()" >&nbsp;Next/Prev'; wheelmode=1;}


//TOOLS ////
/*
 * shows or hides the little panel at the top of the page displaying the coords
 * uses the global var showCoordsPanel (1= show, 0 = hide)
 */
function showHideCoordsPanel()
	{
	//alert("in main  showHideCoordsPanel, showCoordsPanel ="+ showCoordsPanel)
	ref("coordsPane").style.display = (showCoordsPanel == 1)? "block" : "none";
	}



/// MOBILE FUNCTIONS /////
function hasSmallViewport()	
	{return (viewportWidth+viewportHeight <= 790)? true :false;
	}


function adaptDimensions()
	{//ref('credit').style.width=viewportWidth/2;
	ref('credit').style.fontSize="8px";
	}

function resetDimensions()
	{ref('credit').style.width="";
	ref('credit').style.fontSize="";
	}
	

function setMobileOn()
	{mobile=true;
	ref("iconMobile").style.display="none";
	adaptDimensions();
	showArrows();
	controls0.style.right=""; //left positioning to prevent discrepancy viewport-positions vs. visual-viewport-eventX  which breaks thumb 
	controls0.style.left="0px";
	controls0.style.top="0px";
	//ref('test').style.display="block";
	}
	
function setMobileOff()
	{mobile=false;
	ref("iconMobile").style.display="block";
	resetDimensions();
	hideArrows();
	controls0.style.left="";
	controls0.style.top="10px";
	controls0.style.right="10px";
	//ref('test').style.display="none";
	ref("log").style.display="none";
	logwin.innerHTML="";
	}
	
	
function mobileOnOff()
	{if(!mobile) {setMobileOn();}		
	else {setMobileOff();}	
	}


function showMobileHint()
	{ref('mobileHint').style.display="block";
	}

function hideMobileHint()
	{ref('mobileHint').style.display="none";
	}
	
		
var testing=false;

function testMobile()
	{testing=true;
	ref("log").style.display="block"
	var visVwp=getVisualViewportDim();
	var visVwpOff=getVisualViewportOffset();
	var htmlDim=getHtmlElemDim();
	ih("ORIG VIEWPORT: width="+viewportWidth+", height:"+viewportHeight+"<br>");	
	ih("ACTUAL HTML Elem Dimensions: width="+htmlDim.width+", height:"+htmlDim.height+"<br>");	
	ih("VISUAL VIEWPORT: width="+visVwp.width+", height:"+visVwp.height+"<br>");
	ih("VIEWPORT OFFSET: offsetX="+visVwpOff.x+", offsetY:"+visVwpOff.y+"<br><br>");
	}	
	
function getVisualViewportDim()
	{var o={};
	o.width= parseInt(window.innerWidth);
	o.height= parseInt(window.innerHeight);
	if(isNaN(o.width) && document.documentElement.offsetWidth) {o.width=parseInt(document.documentElement.offsetWidth);}//IE
	if(isNaN(o.height) && document.documentElement.offsetHeight) {o.height=parseInt(document.documentElement.offsetHeight);}
	return o;
	}	

function getVisualViewportOffset()
	{var o={};
	o.x= parseInt(window.pageXOffset);
	o.y= parseInt(window.pageYOffset);
	if(isNaN(o.x) && document.documentElement.offsetLeft) {o.x=parseInt(document.documentElement.offsetLeft);}//IE
	if(isNaN(o.y) && document.documentElement.offsetTop) {o.y=parseInt(document.documentElement.offsetTop);}
	return o;
	}	
	
function getHtmlElemDim()
	{var o={};
	o.width= parseInt(document.documentElement.offsetWidth);
	o.height= parseInt(document.documentElement.offsetHeight);
	if(isNaN(o.width) && document.body.clientWidth) {o.width=parseInt(document.body.clientWidth);}//IE
	if(isNaN(o.height) && document.body.clientHeight) {o.height=parseInt(document.body.clientHeight);}
	return o;
	
	}	

function showArrows()
	{ref("btUpCont").style.display="block";
	ref("btDownCont").style.display="block";
	ref("btLeftCont").style.display="block";
	ref("btRightCont").style.display="block";
	}
function hideArrows()
	{ref("btUpCont").style.display="none";
	ref("btDownCont").style.display="none";
	ref("btLeftCont").style.display="none";
	ref("btRightCont").style.display="none";
	}
	
function placeArrows()
	{var btLRtop;
	ref("btUpCont").style.left= ref("btDownCont").style.left= (viewportWidth/2 - 23);
	btLRtop= ref("btLeftCont").style.top= ref("btRightCont").style.top= (viewportHeight/2 - 20);
	correctOverlapControls();
	}
	
function correctOverlapControls()
	{var ctrl1=getElemPos(controls1);
	var btLRtop=stripPx(ref("btRightCont").style.top);
	//ih("ctrl1.top="+ctrl1.top+", btLRtop="+btLRtop+"<br>");
	if (btLRtop < (ctrl1.top + 30)) 
		{//ih("correcting ");
		ref("btLeftCont").style.top= ref("btRightCont").style.top=  ctrl1.top + 30; 
		}
	}	

function lightArw(elemId)
	{var id=elemId+"1";
	ref(id).style.display="none";
	}
	
function darkArw(elemId)
	{var id=elemId+"1";
	ref(id).style.display="block";
	}
	
function clickArw(elemId)
	{if (!panDir) //not panning yet
		{autoPanMap(elemId); 
		panDir=elemId;
		}
	else if(elemId != panDir) //clicked on other arrow
		{stopAutoPan();
		autoPanMap(elemId); 
		panDir=elemId;
		}
	else {stopAutoPan();} //click on arrow of running pan-direction or click anywhere on image
	}
	
function autoPanMap(dir)
	{var dir=dir;
	function panIt()
		{panMap(dir);}
	timerPan=setInterval(panIt,70);
	lightArw(dir);
	}
	
function stopAutoPan()
	{if(panDir)
		{clearInterval(timerPan);
		darkArw(panDir);
		panDir=false;
		}
	}	
		
function panMap(dir)
	{var map= getElemPos(innerDiv);
	if(dir=="up") {innerDiv.style.top= map.top + 10;}
	else if(dir=="down") {innerDiv.style.top= map.top - 10;}
	else if(dir=="left") {innerDiv.style.left= map.left + 10;}
	else if(dir=="right") {innerDiv.style.left= map.left - 10;}
	var result= keepInViewport();
	if (result=="corrected") {stopAutoPan(dir);}
	checkTiles();
	moveThumb2();
	}		


//// FUNCTIONS FOR STACKS OF IMAGES /////////////////////////////////////////////

function slideNext(){ if (slidePointer<JSONnum-1){ slidePointer++;}else{ slidePointer=0;}
rawPath = JSONout.slides[slidePointer].path; rawWidth = JSONout.slides[slidePointer].width; rawHeight = JSONout.slides[slidePointer].height; if (JSONout.slides[slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[slidePointer].labelspath; loadLabels();}else{labelsPath="";}
init0(); refreshTiles(); checkTiles();moveThumb2()}


function slidePrev(){ if (slidePointer>0){ slidePointer--;}else{ slidePointer=JSONnum-1;}
rawPath = JSONout.slides[slidePointer].path; rawWidth = JSONout.slides[slidePointer].width; rawHeight = JSONout.slides[slidePointer].height; if (JSONout.slides[slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[slidePointer].labelspath; loadLabels();}else{labelsPath="";}
init0(); refreshTiles(); checkTiles();moveThumb2()}


	


//// HANDLE INPUT AND SOME USER EVENTS ///////////////////////////////////////
//gets variables from the query in the URL
//src: JavaScript Defin. Guide. Danny Goodman, O'Reilly, 5th ed. p272
function getQueryArgs()
	{var pos,argName,argValue;
	
	var args = new Object();
	var query = location.search.substring(1);
	var pairs = query.split("&"); //split query in arg/value pairs
	
	for(var i=0; i < pairs.length ; i++)
    	{pos=pairs[i].indexOf("=");
		if(pos == -1) {continue;}
		argName = pairs[i].substring(0,pos); //get name
		argValue = pairs[i].substring(pos+1); //get value
		argValue = decodeURIComponent(argValue);
		//alert("argName= "+argName+",argValue= "+argValue)
		args[argName] = argValue;
    	}		
	return args	;
	}	

//handles window resize
function winsize(){ viewportWidth = 1300; viewportHeight = 1000; if( typeof( window.innerWidth ) == 'number' ) { viewportWidth = window.innerWidth; viewportHeight = window.innerHeight;} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) { viewportWidth = document.documentElement.clientWidth; viewportHeight = document.documentElement.clientHeight;} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { viewportWidth = document.body.clientWidth; viewportHeight = document.body.clientHeight;}
moveThumb2();
centerMap();
placeArrows();
//if(logwin) {ih("WINSIZE: viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+"<br>");}
}

//handles mousewheel
function handle(delta) 
	{ zoomCenterOnCursor= true;
	delta = delta * (-wheelZoomInDirection); 
	if (delta < 0)
		{if (wheelmode==0) { ZoomIn();}
		else { slideNext();}
		}
	else{ if (wheelmode==0) { ZoomOut();}
		else { slidePrev();}
		}
	zoomCenterOnCursor= false;	
	}

function wheel(event){ var delta = 0; if (!event){ event = window.event;}
if (event.wheelDelta) { delta = event.wheelDelta/120;} else if (event.detail) { delta = -event.detail/3;}
if (delta){ handle(delta);}
if (event.preventDefault){ event.preventDefault();}
event.returnValue = false;}
if (window.addEventListener){ window.addEventListener('DOMMouseScroll', wheel, false);}
window.onmousewheel = document.onmousewheel = wheel; 


//handles keyboard input
function capturekey(e)
	{ var k= (typeof event!='undefined')? window.event.keyCode : e.keyCode; 
	//ih("k="+k+"<br>");
	if ( k == 187 || k== 107 || k== 61) {zoomCenterOnCursor= true; ZoomIn(); zoomCenterOnCursor= false;}
	else if( k == 189 || k== 109) {zoomCenterOnCursor= true; ZoomOut(); zoomCenterOnCursor= false;}
	else if( k == 39 || k== 40 || k== 34){ slideNext();}
	else if( k == 37 || k== 38 || k== 33){ slidePrev();}
	}

if(navigator.appName!= "Mozilla"){document.onkeyup=capturekey}
else{document.addEventListener("keypress",capturekey,true);}




/////////////////////////////////////////////////////////////////////////////////////////////
// AJAX stuff

function getHTTPObject() 
	{ var xhr = null; 
	try 
		{xhr=new ActiveXObject("Msxml2.XMLHTTP");} 
	catch (e1)
		{ try {xhr= new ActiveXObject("Microsoft.XMLHTTP");} 
		catch (e2)
			{ xhr=null;}
		}
	//if(xhr) {ih("oMsXhr")};
	
	try //XMLHttpRequest gives error on IE6 with ActiveX disabled (e.g. secure hospital environment)
		{if (!xhr)
			{if (typeof XMLHttpRequest != "undefined")
				{xhr=new XMLHttpRequest();
	//ih("oStXhr")
				}
			else 
				{//IFrame fallback for IE				
				xhr= new XMLHttpRequestI();
	//ih("oI");	
				}
			}			
		}
	catch (e3)
		{return;}		
	return xhr;
	}



function loadXMLfile()
	{try
		{
		//ih("loadXMLwXhr-1");
		request = getHTTPObject(); 
		request.onreadystatechange = xmlread; 
		request.open("GET", imgPath + "ImageProperties.xml", true); 
		request.send(null);
		//ih("loadXMLwXhr-2");
		}
	catch(e)
		{return;}	
	}


function xmlread() 
	{if (request.readyState == 4) 
		{try //to prevent errors on IE when running from file without server
			{
//ih("xmlread");
			//alert(3)
			var xmlDoc = request.responseXML.documentElement;
			//alert(4)
			//alert("xmlDoc="+xmlDoc)
			rawWidth = parseFloat(xmlDoc.getAttribute("WIDTH")); 
			//alert(rawWidth)
			rawHeight = parseFloat(xmlDoc.getAttribute("HEIGHT"));
			//alert(xmlDoc.getAttribute("WIDTH")+", rawWidth="+rawWidth)
//ih("hasReadWHfromXhr");
			loadedXML=1;
			init();
			}
		catch(e)
			{ //ih("xmlread ERROR:"+e.description);
			//IFrame fallback for IE if run locally without server, (Chrome will also fallback here, but not work because Chrome regards it as security risk
			var xhr = new XMLHttpRequestI()
			xhr.open("GET", imgPath + "ImageProperties.xml", true); 
			xhr.send(null);
//ih("IaftFailWHreadX");
			setTimeout("showNoDimensionsWarning()",2000);//timeout allows fallbacks to load to prevent msg from showing up
			//alert("fallback2")
			return;
			}
		}
	}


function loadJSON()
	{ JSONrequest = getHTTPObject(); 
	JSONrequest.onreadystatechange = JSONread; 
	JSONrequest.open("GET", JSON, true); 
	JSONrequest.send(null);
	//ih("loadJSONwXhr");
	}


function JSONread() { 
	if (JSONrequest.readyState == 4) { 
		JSONout = eval('('+JSONrequest.responseText+')');
		alert(JSONout);
		JSONnum=JSONout.slides.length; 
		rawPath = JSONout.slides[slidePointer].path; 
		rawWidth = JSONout.slides[slidePointer].width; 
		rawHeight = JSONout.slides[slidePointer].height; 
		if (JSONout.slides[slidePointer].labelspath!=undefined){ 		
			labelsPath=JSONout.slides[slidePointer].labelspath; 
			loadLabels();
		}
		loadedJSON=1; 
		init0();
		
	}
}

 

/////////////////////////////////////////////////////////////////////
//IFrame fallback
//Source: TinyAjax, http://www.metz.se/tinyajax/
/*
coded by Kae - http://verens.com/
use this code as you wish, but retain this notice

MK retained notice but renamed to XMLHttpRequestI
PG adapted to specific situation
*/

var kXHR_instances=0;
var kXHR_objs=[];
var kXHR_timer=0;


XMLHttpRequestI = function() {
	var i=0;
	var url='';
	var responseText='';
	this.onreadystatechange=function(){
		return false;
	};
	
	this.open=function(method,url){
		this.i= ++kXHR_instances; // id number of this request
		this.method=method;
		this.url=url;
		
		//Note!! Not generic. Only in ajax-tiledviewer which may load xml or labels.js
		var len=url.length //to read from eof string, instead of slice method which appeared not to work in ie6 in virtualbox
		var ext4=url.substring(len-4,len);
		var ext3=url.substring(len-3,len);
		this.loadXML = (ext4==".xml")? true : false; //loading ImageProperties.xml
		this.loadJs = (ext3==".js")? true : false; //loading labels.js
		
		if(this.loadXML)
			{/*Create container-div and insert Iframe
			Necessary to insert iframe with innerHTML instead of DOM methods because attribute 'name' is read only with DOM methods. 'name' is necessary as target for form for POST. Container div is necessary to put innerHTML in. innerHTML directly in document would overwrite whole document.
			*/
			var contDiv = document.createElement('div');
			contDiv.setAttribute("id","container_"+this.i);
			contDiv=document.body.appendChild(contDiv);
	        var iFrameId="kXHR_iframe_"+this.i;
			var iFrameHTML= "<iframe name='"+iFrameId+"'  id='"+iFrameId+"' style='display:none'></iframe>"
	        contDiv.innerHTML = iFrameHTML;
			}		
		else if	(this.loadJs && jsLabelsPath && jsLabelsPath == url ) //presence of 'jsLabelsPath' signals non-raw JSON in labels.js
			{loadJs(jsLabelsPath);	
			}
	//alert("created iframe")
	};
	
	this.send=function(postData)
		{
		if(this.loadXML)
			{//alert(8)
			var el=document.getElementById('kXHR_iframe_'+this.i);	
			if(typeof el != "undefined")	
				{//load the xml file in the iframe
				//alert(9)
				el.src=this.url;
				kXHR_objs[this.i]=this;
				innerDiv.style.display="none";
				kXHR_timer = setTimeout('readXmlInIframe('+this.i+')',200);//weird that this works here without closure?
				}
			}
		else if(this.loadJs  && jsLabelsPath )
			{readLabelsFromJs();
			}	
		}
	
	return true;
};


function readXmlInIframe(inst)
	{
	//alert("in readXmlInIframe "+inst)
	var el=document.getElementById('kXHR_iframe_'+inst);
	var cont=document.getElementById("container_"+inst);	
	
	clearTimeout(kXHR_timer);
	
	try //if run locally, the call to document inside IFrame generates security error in Chrome
		{//if iframe existant and completely loaded and document in it 
		if ( !(el == null  || typeof el == "undefined")  && el.readyState=='complete' && window.frames['kXHR_iframe_'+inst] && window.frames['kXHR_iframe_'+inst].document  && window.frames['kXHR_iframe_'+inst].document.body) 
			{//alert("reading iframe data")
			//get content from Iframe
			var topElem=window.frames['kXHR_iframe_'+inst].document.body;
			//convert content to string of text (content is XML page rendered by IE into a HTML page)
			var txt=readTextFromDOM(topElem);
			//alert(txt)
			//get width and height values
			if(txt.length>0)
				{txt= txt.toLowerCase();
				var mtch= txt.match(/width\s*\=\s*"(\d+)"/); //read width from string
				rawWidth= parseInt(mtch[1]); //global
				mtch= txt.match(/height\s*\=\s*"(\d+)"/); //read height from string
				rawHeight= parseInt(mtch[1]); //global
	//ih("WHfromI");
				signalUseIFrameFallBack();
				//now got width and height, turn off warning msg
				hideWarnings();
				//update image
				loadedXML=1;
				init();
				}
			restore();	
			}
		 else
			{//To prevent endless looping on Chrome locally which does have IFrame, but apparently has no readyState property
			if ( !(el == null  || typeof el == "undefined")  && (typeof el.readyState == "undefined") )
				{restore();
				return;
				}
			//retry
			kXHR_timer = setTimeout('readXmlInIframe('+inst+')',200);
			}					
		} //end if iframe is existant, loaded, etc	
	catch (e)
		{//alert(e)
		restore();
		return;
		}
	
	function restore()
		{//restore visibility
		innerDiv.style.display="block";			
		//remove the container and Iframe
		cont.parentNode.removeChild(cont);
		}
	}

	
//iterates nodes in DOM and concatenates all text nodes in it	
//source: JavaScript, Definitive Guide, Flanagan 5th ed. p319
function readTextFromDOM(topElem)
	{
	var strings = [];
	getStrings(topElem, strings);
	return strings.join("");
	
	function getStrings(n,strings)
		{
		if (n.nodeType == 3) /* Textnode*/
			{strings.push(n.data);}
		else if	(n.nodeType == 1) /* Elementnode*/
			{for(var m = n.firstChild; m!=null; m=m.nextSibling)
				{getStrings(m, strings);
				}
			}
		}
	}
	
	
//reads labels from Js file
function readLabelsFromJs()
	{
	
	readLabelsFromJs.timer="";
	readLabelsFromJs.counter=0;
	if(window.jsLabels) //js file should state jsLabels= {...}
		{//ih("lblFromJs");
		oLabels = jsLabels;
		renderLabels();
		signalUseLoadJsFallBack();
		}
	else
		{if ( readLabelsFromJs.counter < 10 ) //max 10 attempts
			{clearTimeout(readLabelsFromJs.timer);
			readLabelsFromJs.counter++;
			var delay= readLabelsFromJs.counter * 200; //each attempt longer delay for retry
			readLabelsFromJs.timer = setTimeout("readLabelsFromJs()",delay);
			}
		}	
	}
	
		
//creates a new script node and loads a js file in it //note: loading a raw json {..} in this way gives error, which cannot be prevented, so only use if not a raw JSON, e.g. safe js file is=    xxxx ={..}
function loadJs(url)
	{
	try
		{var scr= document.createElement("script");
		scr.setAttribute("type","text/javascript");
		scr.setAttribute("src",url);
		return scrIn=document.body.appendChild(scr);
		}
	catch(e)
		{return;}	
	} 	

//adds additional credits into credit div
function displayCredits()
	{displayCredits.timer="";
	displayCredits.counter=0;
	if(window.credits)
		{
		var credDiv = ref("credit");
		if(credDiv)
			{var credNow = credDiv.innerHTML;
			credDiv.innerHTML= credNow +"<br />" + credits;
			}
		}
	else
		{if ( displayCredits.counter < 6 ) //6 attempts
			{clearTimeout(displayCredits.timer);
			displayCredits.counter++;
			var delay= displayCredits.counter * 200; //each attempt longer delay for retry
			displayCredits.timer = setTimeout("displayCredits()",delay);
			}
		}	
	}
	
			
//// GENERAL SUPPORT FUNCTIONS ////

function stripPx(value) { if (value == ""){ return 0;}
return parseFloat(value.substring(0, value.length - 2));}

function ref(i) { return document.getElementById(i);}

function refreshTiles() { var imgs = imageTiles.getElementsByTagName("img"); while (imgs.length > 0) imageTiles.removeChild(imgs[0]);}

//gives IE version nr source: DHTML D.Goodman 3rd ed p 669
function readIEVersion()
	{var ua = navigator.userAgent;
	var IEOffset = ua.indexOf("MSIE ");
	return parseFloat(ua.substring(IEOffset + 5, ua.indexOf(";", IEOffset)));
	}
	
function rawDimensionsKnown()
	{return ( rawWidth==null || rawHeight==null )? false : true;
	}	
	
function dimensionsKnown()
	{return ( imgWidthMaxZoom==null || imgHeightMaxZoom==null || isNaN(imgWidthMaxZoom) || isNaN(imgHeightMaxZoom) )? false : true;
	}	
	
	
/// INFORMATIVE MESSAGES, WARNINGS
function signalUseIFrameFallBack()
	{if(ref("signalI"))	{ref("signalI").style.display= "block";}
	}

function signalUseLoadJsFallBack()
	{if(ref("signalj")) {ref("signalj").style.display= "block";}
	}
		
function showNoPathWarning()
	{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: location [URL-path] of image not provided. The location should be provided either in the URL-query or in the html page.";
	ref("warning").style.display="block";	
	}

function showNoSlideRequestedWarning()
	{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: No slide requested. The slide should be requested by its name either in the URL-query or in the html page.";
	ref("warning").style.display="block";	
	}
function showRequestedSlideNotPresentWarning()
{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: No slide-info file (slides.js) is present or the requested slide is not present in the slide-info file.";
	ref("warning").style.display="block";	
}
function showNoDimensionsWarning()
	{if(!dimensionsKnown())
		{ref("warning").innerHTML="Image cannot be displayed.<br />Reason: Width and Height of image not provided. The Width and Height should be provided either in the URL-query or in the html page."; 
		ref("warning").style.display="block";
		}
	}

function hideWarnings()
	{ref("warning").innerHTML=""; 
	ref("warning").style.display="none";
	}	

//////debugging  ///////////////////////////

function ih(txt)
	{logwin.innerHTML+= txt + " ";}	

function resetlog() 
	{logwin.innerHTML="";}

/*
 * creates alert with debuginfo
 * @param one or more argumnets to be shown
 */ 
function debug(subjects)
{
	var str="";
	
	for(var i=0;i<arguments.length;i++)
		{
			var subject = arguments[i]; 	
					
			if(typeof subject == "object" && subject instanceof Array)
			{	
				str+= "[Array]\n";
				if (subject.length == 0) {str+= "EMPTY"}
				else
					{
					for(var i=1;i<subject.length;i++)
						{
							str+= i + " : " + subject[i] + "\n";
						}
					}	
			}
			else if(typeof subject == "object" )
			{	
				str+= "[Object]\n";
				counter= 0;
				for(prop in subject)
				{
					str+= prop + " : " + subject[prop]  + "\n";;
					counter++;
				}
				if(counter==0){str+= "EMPTY"}
				
			}	
			else if(typeof subject == "string")
			{
				{
					str= "[string] " + subject;
				}
			}
			else if(typeof subject == "number")
			{
				{
					str= "[number] " + subject;
				}
			}
			else if(typeof subject == "boolean")
			{
				{
					str= "[boolean] " + subject? "TRUE" : "FALSE";
				}
			}
			else if(typeof subject == "undefined")
			{
				{
					str= "undefined";
				}
			}
			else if(subject == null)
			{
				{
					str= "NULL!";
				}
			}	
			str+="\n";
		}//end loop all arguments
	alert(str);
}


	