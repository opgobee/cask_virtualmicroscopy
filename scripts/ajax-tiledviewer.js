//Written by Shawn Mikula, 2007.   Contact: brainmaps--at--gmail.com.   You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 

/*
 * @TODO: letloadXML use jquery.
 * @TODO: on win resize let it recenter on the actual viewed center (now it re-centers on the image center)
 */ 

// Extensively modified by Paul Gobee, Leiden Univ. Med. Center, Netherlands, 2010.   Contact: o.p.gobee--at--lumc.nl. This notification should be kept intact, also in minified versions of the code.

/*
 * In the URL-query you can pass the following parameters:
 * 
 * slide: 		name of the slide to load, slideData will be read from a file slides.js that must be present
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
// FIX BUG dragging from inside viewIndicator not working on FF, Chrome, IE (only worked in Mac-Saf) (Sol: Handler on thumbContainer, for IE: viewIndicatorSenser - filter opacity as described in forum)
// FIX BUG not fetching tiles after thumb navigation until move mouse outside thumb (add checktiles call in clickthumb) 
// FIX BUG keypress plus not well detected. On Opera one must use + key and SHIFT - keys, and not Numeric keypad keys
// FIX BUG micrometer-character correct
// FIX BUG enclosed call of XmlHHTPRequest in a try{} because causes error on IE6 with ActiveX disabled (eg secure office/hospital environment)
// FIX BUG? removed if-clause in loadllabels which caused it not to work on ie
// FIX BUG? removed '-16' subtraction in coords calculation (now in function getCoordsImg) due to which labels were incorrectly repositioned at small zooms
// FIX BUG/CHG replaced function getVar by function getQueryArgs because getVar could misrecognize args, eg. 'jslabels' was also found as 'labels' 
// FIX ERR referencing to elements by id/name in global scope generated errors
// ADD viewIndicator visibly moves while dragged (originally only jumped to drag-end position)
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
// EFFIC in loop in checktiles removed call to moveViewIndicator, now called once in higher level calling functs together with call of checktiles()


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
//var center = 0; 
var res = 0.2325; //micrometers/ pixel 
var resunits = "&micro;m";
var zoomCenterUnlockThreshold= 3;//nr of pixels move needed to unlock a zoomCenterLock
var labelsPathInSlidesFolder = "labels.js"; //the default path (fileName) of the file with labels in the slides folder

var settings= {}; //container object for settings
settings["showCoordinatesPanel"] = false; //default dont show coords panel
settings["wheelZoomInDirection"] = -1; //determines zoomin/out direction of wheel; 1= up, -1= down
settings["hasLabels"] = false; 
settings["labelOffsetHeight"] = null; //amount of pixels that label is shown higher/lower related to the exact spot on the picture where it is placed - to allow the text (with a certain height to stand exactly next to the spot)
settings.crosshairHeight = 16; //pixelsize of crosshairimage
settings.crosshairWidth = 16; //pixelsize of crosshairimage

//stuff to be moved to the settings object
var wheelmode = 0; //0 = wheel zooms, 1 = wheel goes to next/prev image (for stacks of images (not yet implemented)
var slidePointer = 0; //nr of the slide in a stack of slides [not yet implemented completely]
var zoom = 2; //start zoom level
var hideThumb = false;
var cX = cY = null;
var showLabel = null; //label that will be shown on the requested x, y spot
var focusLabel = focusLabelId = null; //labelText and id of label that will be shown automatically on its own location

var elem = {}; //global containing references to DOM elements in the connected html page, wiil be initialized in function setGlobalReferences()

var data = {}; // global container for data
data.slides = {};
data.labels = {}; //object with data of the labels
data.newLabels = {}; //object with data of live created labels
data.currentImageWidth = null; //width of complete image at the current zoom level
data.currentImageHeight = null; //height of complete image at the current zoom level

var status = {}; //global object to keep data that needs to be kept track of
status.numberLabels = 0;
status.renderingLabels = false; //busy creating labels.
status.labelsRendered = false;


//image
var slideData = {}; //object that will contain the data of the presently shown slide
var path = null; //may be defined in html page (then overwrites the null value set here)
var rawPath = null; //as read from html page or query
var imgPath = null; //path as used in program
var height = null, width = null; //may be defined in html page (then overwrites the null values set here)
var imgWidthMaxZoom = null, imgHeightMaxZoom= null; //width/height of max size image, Note: may be string as read from html page, query or xhr
var imgWidthPresentZoom = null, imgHeightPresentZoom= null; //integer, shortcut for gTierWidth/Height[zoom]
var loadedXML=0; //used in xhr loading of XML and JSON files
var labelsPath=null, labelTimer;
var creditsPath=null; //path to .js file with additional credits to display
var gTierCount; //nr of zoom levels
var gTierWidth = new Array(), gTierHeight = new Array(); //width and height of image at certain zoomlevel
var	gTileCountWidth = new Array(), gTileCountHeight = new Array(); //number of tiles at certain zoomlevel
var viewportWidth = null, viewportHeight = null; //dimensions in pixels of viewport
var innerStyle; //global refs to elements, 
var dragOffsetLeft, dragOffsetTop, dragging= false; //used in dragging image
var zoomOutTimer= false, autoZooming= false; //used to auto-zoomout if mouse hold down on image
var lockedZoomCenterX= null, lockedZoomCenterY= null; //if using +/- keys or zoombuttons locks the start zoomcenter until mousemove or zoom on cursor
var lockedZoomCursorX= null, lockedZoomCursorY= null; //
var cursorX, cursorY; //continuously keeps track of cursorposition to enable scrolling with centerpoint cursorposition
var downX=null,downY=null;//IE workaround for autozoomout
var isDisplayingUrl = false; //boolean indictaing that urlBar with deeplink url is presently displayed

//controls and thumbnail
var thumbContainerWidth, thumbContainerHeight, viewIndicatorWidth, viewIndicatorHeight; 
var viewIndicatorDragOffsetLeft, viewIndicatorDragOffsetTop, thumbDragging= false; //used in dragging cyan box
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


//////////////////////////////////////////////////////////////////////
//
// INIT
//
/////////////////////////////////////////////////////////////////////


//do all stuff that can be done as soon as document has loaded
function init() 
{
	//Load data
	//set global references to DOM elements 
	setGlobalReferences();
	//Reads data from different inputs and sets globals and settings from these data
	readDataToSettings();
	//Set event handlers
	setHandlers();
	
	//Specific settings
	if (isMobile) {setMobileOn();}
	//if (isiPad) {trackOrientation();}	
	//show slideName (the name shown to users) in the little panel at the top of the page
	showSlideName();
	//load credits file and show additional credits
	loadAndShowCredits();
	//shows or hides the coords panel
	showHideCoordinatesPanel();
	
	//Show slide
	//if width and height info available, do rest of init//note: if read from xhr, the xmlread function will call showInitialView()
	if (rawDimensionsKnown()) 
	{
		showInitialView();
	}
	recheckTilesTimer=setInterval("checkTiles()", 5000); //because regularly 'loses' updating tiles eg at viewport scroll, resize 

	//Signal 'loaded slide' to the possible containing nav page 
	if(parent && parent.slideIsLoaded) /*Chrome on local drive incorrectly regards accessing the main frame as cross-domain*/
		{
		parent.slideIsLoaded();
		}
	
	makeNewLabel();
	
}//eof init()


/*
 * Reads data from different inputs and sets globals from these data
 */
function readDataToSettings()
{
	//set or adapt globals based on variables defined in html page
	readSettingsInHtmlFileToGlobals();
	//set or adapt globals with query information
	readQueryToGlobals();

	//checks 1
	if(!slideName)
		{
		showNoSlideRequestedWarning();
		return;
		}
	if(typeof slides == "undefined"  || !slides[slideName])
		{
		showRequestedSlideNotPresentWarning();
		return;
		}
	
	//load slideData of requested slide
	readslideDataToGlobals();

	//checks 2
	//check if path is provided
	if(rawPath)	
	{
		imgPath=rawPath;
	}
	else {showNoPathWarning(); return;}
	//if there are labels, construct the path to the file with the labels-data
	if(settings["hasLabels"])
	{
		labelsPath = rawPath + labelsPathInSlidesFolder;
	}
	//if dimensions not yet known, try to read from ImageProperties.xml file
	if (!imgWidthMaxZoom && !loadedXML ) 
		{//ih("init0-loadXML");
		 loadXMLfile();//Note: doesn't work yet
	 	} 
}

/*
 * sets global references to some DOM elements for easy addressing
 */
function setGlobalReferences()
{
	elem.innerDiv = document.getElementById("innerDiv"); 
	innerStyle= elem.innerDiv.style; //keep ref to speed up
	elem.imageTiles = document.getElementById("imageTiles"); 
	elem.imageLabels = document.getElementById("imageLabels");
	elem.newLabels = document.getElementById("newLabels");
	elem.bgDiv = ref('bgDiv'); //grey background div behind image
	elem.controlsContainer = ref('controlsContainer');
 	elem.zoomButtonsContainer = ref('zoomButtonsContainer');
	elem.thumbContainer = ref('thumbContainer'); 
	elem.thumbImageHolder = ref('thumbImageHolder');  
	elem.viewIndicator = ref('viewIndicator');
	elem.viewIndicatorSenser = ref('viewIndicatorSenser');	

	tips=ref('tips');
	logwin=document.getElementById("log"); 
	logwin.ondblclick=resetlog;

}

/*
 * sets globals based on settings hard set in the html page; more or less is backward compatibility
 * 
 */
function readSettingsInHtmlFileToGlobals()
{
	rawPath = path;
	imgWidthMaxZoom = width;
	imgHeightMaxZoom = height;
}

/*
 * sets a number of globals from data in the URL query
 */
function readQueryToGlobals()
{
	//get variables from query in URL
	var queryArgs= getQueryArgs();
	
	if (queryArgs.start){ slidePointer = queryArgs.start;} //not yet well implemented, for viewing stacks
	if (queryArgs.slide) {slideName = queryArgs.slide;}
	if (queryArgs.showcoords) {settings["showCoordinatesPanel"] = (queryArgs.showcoords == 1)? true : false;} 
	if (queryArgs.wheelzoomindirection) { setWheelZoomInDirection(queryArgs.wheelzoomindirection); }; 
	if (queryArgs.resunits) {resunits = queryArgs.resunits;} 
	if (queryArgs.zoom){ zoom = Number(queryArgs.zoom);}
	if (queryArgs.x) { cX = Number(queryArgs.x);}
	if (queryArgs.y) { cY = Number(queryArgs.y);}
	if (queryArgs.label) { showLabel = queryArgs.label;}
	if (queryArgs.focus) { focusLabel = queryArgs.focus;}
	if (queryArgs.hidethumb) {hideThumb = queryArgs.hidethumb;}; 
}

/*
 * sets globals about the slide based on the slideData read from the global 'slides' 
 */
function readslideDataToGlobals()
{
	if(!window.slides) {return;}
	//here the global var 'slides' is read!!
	slideData = slides[slideName];
	if (slideData.path) {rawPath = slideData.path;} 
	if (slideData.width) {imgWidthMaxZoom = slideData.width;} 
	if (slideData.height) {imgHeightMaxZoom = slideData.height;} 
	if (slideData.res)	{res = slideData.res;}
	if (slideData.hasLabels) {settings["hasLabels"] = (slideData.hasLabels.search(/true/i) != -1)? true :false;} 
	if (slideData.credits) {creditsPath = slideData.credits;} 	

}

/*
 * Attaches event handlers
 * 
 */
function setHandlers()
{
	var outerDiv = document.getElementById("outerDiv"); 

	outerDiv.onmousedown = handleMouseDown; outerDiv.onmousemove = handleMouseMove; outerDiv.onmouseup = handleMouseUp; outerDiv.ondblclick= handleDblClick; 
	//outerDiv.ontouchstart  = handleMouseDown; outerDiv.ontouchmove = handleMouseMove; outerDiv.ontouchup = handleMouseUp; //weird behaviour for now 
	outerDiv.ondragstart = function() { return false;};

	window.onresize=winsize; //moved to here to prevent error on Chrome
	initTooltips();
}



//do calculations and rendering for which width and height are needed	
function showInitialView() 
{//ih("init");

	//set global information 
	imgWidthMaxZoom=parseInt(imgWidthMaxZoom); 
	imgHeightMaxZoom=parseInt(imgHeightMaxZoom); 	
	gTierCount = getNrTiers(); //no of levels

	var o = countTilesPerTier(); //gets nr of tiles and width and height dimensions for each level
	gTierWidth= o.gTierWidth; //unpack the return object and set the globals
	gTierHeight= o.gTierHeight;

	imgWidthPresentZoom= gTierWidth[zoom]; //shortcut
	imgHeightPresentZoom= gTierHeight[zoom]; //shortcut
	
	setLabelOffsetHeight();
	
//ih("init-winsize");
	winsize();//do after onload for IE

	/////////////////
	//Position image
	////////////////
	
	//center on a requested x and y
	//Note: the zoom level is handled by setting the correct position in centerOn() or centerMap() and next by loading the correct images by checkTiles()
	if (cX && cY)
		{//ih("init-cXCenter, cX="+cX);
			//center=1; 
			centerOn(cX,cY);
			//and show the requested label
			if(showLabel)
			{
				createLabel({"label": showLabel,  "x": cX, "y": cY});
			}
		}
	//center on middle of image
	else
		{//ih("init-centerMap");	
		centerMap();
		}
	
		
	//load labels
	if (settings["hasLabels"]) 
		{
		loadLabels(labelsPath);
		} 

//ih("init-showThumb");
	if (!hideThumb) 	{showThumb();}
		
//ih("init-updateDiverse");
	//resizeBackgroundDiv(); 
	//loads the tiles
	checkTiles(); 
	moveViewIndicator(); 
	updateLengthBar();

	
	if(hasSmallViewport()) {adaptDimensions();}
}


/*
 * loads and displays credit information
 */
function loadAndShowCredits()
{
	if(creditsPath)
	{
		try
		{
			loadJs(creditsPath);
			displayCredits();
		}
		catch(e)
		{
			return;
		}	
	}	 	
}

/*
 * shows slide description in the little panel at the top
 * Note: this is the name or short description the user sees as the slide name, not the slide name used in the code
 * 
 */
function showSlideName()
{
	if(slideData.info != undefined && ref("namePanel"))
	{
		ref("namePanel").innerHTML = slideData.info;
	}
	
}

//////////////////////////////////////////////////////////////////////
//
// HANDLE INPUT AND USER EVENTS
//
/////////////////////////////////////////////////////////////////////



//handles window resize
function winsize()
{
	//used in keeping image at same center position whwn resizing
	var oldViewportWidth = viewportWidth;
	var oldViewportHeight = viewportHeight;
		
	if( typeof( window.innerWidth ) == 'number' ) 
	{ 
		viewportWidth = window.innerWidth; 
		viewportHeight = window.innerHeight;
	} 
	else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) 
	{ 
		viewportWidth = document.documentElement.clientWidth; 
		viewportHeight = document.documentElement.clientHeight;
	} 
	else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) 
	{ 
		viewportWidth = document.body.clientWidth; 
		viewportHeight = document.body.clientHeight;
	}
	
	moveViewIndicator();
	//initial
	if(oldViewportWidth == null)
	{
		centerMap();
	}
	//resize later on when a slide was already visible, than keep image centered as it was
	else
	{
		var imgCoords= getImgCoords(oldViewportWidth/2,oldViewportHeight/2);
		centerOn(imgCoords.x,imgCoords.y);
	}
	
	placeArrows();
	positionSizeIndicators();
//if(logwin) {ih("WINSIZE: viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+"<br>");}
}

//handles mousewheel
function handle(delta) 
{ 
	zoomCenterOnCursor= true;
	delta = delta * (-settings["wheelZoomInDirection"]); 
	if (delta < 0)
	{
		if (wheelmode==0) 
		{ 
			ZoomIn();
		}
		else 
		{ 
			slideNext();
		}
	}
	else
	{ 
		if (wheelmode==0) 
		{ 
			ZoomOut();
		}
		else 
		{ 
			slidePrev();
		}
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
	//hideUrlBarAndSizeIndicators(); //presently not called, keep for a while
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
	
		
//////////////////////////////////////////////////////////////////////
//
// DRAGGING
//
/////////////////////////////////////////////////////////////////////
		
function startMove(event) 
	{ 
	if (!event){ event = window.event;}
	var dragStartLeft = event.clientX; 
	var dragStartTop = event.clientY; 
	var imgLeft = stripPx(elem.innerDiv.style.left); 
	var imgTop = stripPx(elem.innerDiv.style.top); 
	dragOffsetLeft= Math.round(imgLeft - dragStartLeft);
	dragOffsetTop= Math.round(imgTop - dragStartTop);
	dragging = true; return false;
	}


function processMove(event) 
{//ih("processmove ");
	if (!event){ event = window.event;}
	
	//display current mouse coordinates in coordinates panel
	if (settings["showCoordinatesPanel"])  
	{
		var imgCoords= getImgCoords(cursorX,cursorY);	
		coordX = imgCoords.x;
		coordY = imgCoords.y;
		if( coordX <= 0 || coordX >=1 || coordY <= 0 || coordY >=1)
			{
				coordX = coordY = "<span class='deemphasize'>Outside slide</span>";
			}
		
		ref('coordsPane').innerHTML= "x: " + coordX + ", y: " + coordY ;
	}
	if(isDisplayingUrl) {parent.updateUrl();}
	//move the image
	if (dragging) 
	{
		//ih("event.clientX="+event.clientX+", dragOffsetLeft="+dragOffsetLeft);
		var newX = event.clientX + dragOffsetLeft;
		var newY = event.clientY + dragOffsetTop;
		setInnerDiv(newX,newY);
		checkTiles();
		moveViewIndicator();
	}
	
}

function stopMove() 
	{dragging = false; 
	keepInViewport();
	}
	
/*
 * expresses a certain point of the screen (e.g. the location of the cursor) as a position on the image, expressed between 0,0 (top-left corner) and 1,1 (bottom-right corner). Independent of zoom level.
 * @param number cursorX (in pixels)
 * @param number cursorY (in pixels)
 * return object with keys x and y holding the coords (in fractions of the image)
 */
function getImgCoords(cursorX,cursorY)	
	{var imgCoords={};
	imgCoords.x = Math.round(((cursorX - stripPx(elem.innerDiv.style.left))/(imgWidthMaxZoom/(Math.pow(2,gTierCount-1-zoom)))*10000))/10000;
	imgCoords.y = Math.round(((cursorY - stripPx(elem.innerDiv.style.top))/(imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom)))*10000))/10000; //removed -16 subtraction in Brainmaps code
	return imgCoords;
	}
	
/*
 * gets the width and height sizes of the 'complete image' at the present zoom level (be it within or outside viewport) 
 * @return object {o.width,o.height} with dimensions in pixels (without "px" suffix)
 * Oeps appears to be superfluous there is already imgWidthPresentZoom and imgHeightPresentZoom
 */
function getCurrentImageSizes()
{
	var o={};
	o.width  = imgWidthMaxZoom /(Math.pow(2,gTierCount-1-zoom));
	o.height = imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom));
	return o;
}

/*
 * gets center of the visible part of the image (expressed in pixels of the image). Used as zoomcenter at +/- or buttonclick zooming
 * 
 */
function getVisibleImgCenter()	
	{var imgCenter={};

	//positions of the innerDiv that holds the tiles
	var imgLeft = stripPx(innerStyle.left); 
	var imgTop = stripPx(innerStyle.top);
	var imgRight = imgLeft + imgWidthPresentZoom;
	var imgBottom = imgTop + imgHeightPresentZoom;
	//visible part of image
	var visLeft  = (imgLeft < 0)? 0 : imgLeft;
	var visRight = (imgRight > viewportWidth)? viewportWidth : imgRight;
	var visTop	 = (imgTop < 0)? 0 : imgTop;
	var visBottom= (imgBottom > viewportHeight)? viewportHeight : imgBottom; 

	imgCenter.x= Math.round( visLeft + (visRight - visLeft)/2 );
	imgCenter.y= Math.round( visTop + (visBottom - visTop)/2 );
	
//	ih("visLeft="+visLeft+",visRight="+visRight+", imgCenter.x="+imgCenter.x+"visTop="+visTop+",visBottom="+visBottom+", imgCenter.y="+imgCenter.y)
//	ih("imgCenter.x="+imgCenter.x+", imgCenter.y="+imgCenter.y+"<br>")	 
//	imgCenter.x = Math.round( stripPx(elem.innerDiv.style.left) + imgWidthMaxZoom/  (2 * Math.pow(2,gTierCount-1-zoom) ) );
//	imgCenter.y = Math.round( stripPx(elem.innerDiv.style.top)  + imgHeightMaxZoom/ (2 * Math.pow(2,gTierCount-1-zoom) ) );
	return imgCenter;
	}
	
function cursorOverImage()
	{var imgLeft = stripPx(innerStyle.left); 
	var imgTop = stripPx(innerStyle.top);
	var imgRight = imgLeft + imgWidthPresentZoom;
	var imgBottom = imgTop + imgHeightPresentZoom;

	return (imgLeft <= cursorX && cursorX <= imgRight && imgTop <= cursorY && cursorY <= imgBottom)? true : false;	
	}	


//////////////////////////////////////////////////////////////////////
//
// ZOOMING
//
/////////////////////////////////////////////////////////////////////

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
	{
		var imgTop = stripPx(elem.innerDiv.style.top); 
		var imgLeft = stripPx(elem.innerDiv.style.left); 
		//ih("imgLeft=" +imgLeft + ", imgTop="+imgTop +", cursorX="+cursorX+", cursorY="+cursorY+", lockedZoomCenterX="+lockedZoomCenterX+", lockedZoomCenterY="+lockedZoomCenterY+"<br>");

		if (lockedZoomCenterX && lockedZoomCenterY) // (if continuously zoomin/out. Unlock by mouse-move)
			{
				zoomCenterX = lockedZoomCenterX;
				zoomCenterY = lockedZoomCenterY;
			}
		else if(zoomCenterOnCursor && cursorOverImage()) //zooming with scrollbutton or mouseclick> center on mouse-position
			{
				zoomCenterX = cursorX;
				zoomCenterY = cursorY;
			}
		else //zooming with +/- keys or zoom-buttons> center on center of visible part of image
			{
				var visImgCenter=getVisibleImgCenter();
				lockedZoomCenterX = zoomCenterX = visImgCenter.x;
				lockedZoomCenterY = zoomCenterY = visImgCenter.y;
				lockedZoomCursorX = cursorX;
				lockedZoomCursorY = cursorY;
			}
		//ih("DETERMINED zoomCenterX="+zoomCenterX+", zoomCenterY="+zoomCenterY+"<br>")
		
		//reposition the innerDiv that contains the image
		var newX = 2 * imgLeft - zoomCenterX;
		var newY = 2 * imgTop  - zoomCenterY;
		setInnerDiv(newX,newY);
		
		//ih("AFTER: elem.innerDiv.style.left="+elem.innerDiv.style.left+", elem.innerDiv.style.top="+elem.innerDiv.style.top)		
		zoom=zoom+1; 
		imgWidthPresentZoom= gTierWidth[zoom]; //shortcut
		imgHeightPresentZoom= gTierHeight[zoom]; //shortcut
		//ih("ZOOMIN to zoom: "+zoom+"<br>");
		setLabelOffsetHeight();
		
		
		//remove present tiles
		deleteTiles();
		
		//load with new tiles
		checkTiles();
		
		//reposition labels
		repositionLabels();

		resizeBackgroundDiv();	
		keepInViewport();
		updateLengthBar();	
		moveViewIndicator();
		//lowZoomHideLabels();
		resizeLabels();
		if(isDisplayingUrl) {parent.updateUrl();}
		//ih("ZOOMIN done<br>")
	}	
}


function ZoomOut() 
{ 
	if (zoom!=0)
	{
		var imgTop = stripPx(elem.innerDiv.style.top); 
		var imgLeft = stripPx(elem.innerDiv.style.left); 
	
		if (lockedZoomCenterX && lockedZoomCenterY) // (if continuously zoomin/out. Unlock by mouse-move)
		{
			zoomCenterX = lockedZoomCenterX;
			zoomCenterY = lockedZoomCenterY;
		}
		else if(zoomCenterOnCursor && cursorOverImage()) // zooming with scrollbutton or mouseclick> center on mouse-position
		{
			zoomCenterX = cursorX;
			zoomCenterY = cursorY;
		}
		else // zooming with +/- keys or zoom-buttons> center on center of visible part of image
		{
			var visImgCenter=getVisibleImgCenter();
			lockedZoomCenterX = zoomCenterX = visImgCenter.x;
			lockedZoomCenterY = zoomCenterY = visImgCenter.y;
			lockedZoomCursorX = cursorX;
			lockedZoomCursorY = cursorY;
		}

		//reposition the innerDiv that contains the image
		var newX = 0.5 * imgLeft + 0.5 * zoomCenterX;
		var newY = 0.5 * imgTop  + 0.5 * zoomCenterY;
		setInnerDiv(newX,newY);

		//ih("zoomCenterX="+zoomCenterX+", zoomCenterY="+zoomCenterY+"<br>")
		
		zoom=zoom-1; 
		imgWidthPresentZoom= gTierWidth[zoom]; // shortcut
		imgHeightPresentZoom= gTierHeight[zoom]; // shortcut
		//ih("ZOOMOUT to zoom: "+zoom+"<br>");
		setLabelOffsetHeight();
		
		
		//remove present tiles
		deleteTiles();
				
		//load with new tiles
		checkTiles(); 
		
		//reposition labels
		repositionLabels();
		
		resizeBackgroundDiv(); 
		keepInViewport(); 
		updateLengthBar(); 
		moveViewIndicator();
		// lowZoomHideLabels();
		resizeLabels();
		if(isDisplayingUrl) {parent.updateUrl();}
		//ih("ZOOMOUT done<br>")
	}
}


//hide labels at low zoom, because then the labels appear to be offset, probably due to Zoomify inaccuracies at high size reductions (=low zoom)
function lowZoomHideLabels()
	{if(zoom<=1) {elem.imageLabels.style.display="none";}
	else {elem.imageLabels.style.display="block";}
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
// HANDLING THE SLIDE
//
///////////////////////////////////////////

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
		{ gTileCountWidth[j] = Math.floor(tempWidth/tileSize); //couldn't this one and tempwidth one be replaced by ceil and no modulo addition? //@TODO: store in main data globals isntead of all these separate globals
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
	
/*
 * repositions innerDiv, the large main div that holds and positions the image tiles, and newLabels div that holds and positions the newLabels
 * Div newlabels is a separate div because it needs to be outside outerDiv, hence it needs separate repositioning  
 */
function setInnerDiv(xPosition,yPosition)
{
	elem.innerDiv.style.left  = xPosition  + "px";
	elem.innerDiv.style.top   = yPosition  + "px";
	elem.newLabels.style.left = xPosition  + "px";
	elem.newLabels.style.top  = yPosition  + "px";
}



/*
 * Sets the innerDiv that contains the image, so that the passed x and y coords are in the center of the viewPort
 * @param number xcoord ; fraction of the image's width  = number between 0 and 1
 * @param number ycoord ; fraction of the image's height = number between 0 and 1
 */
function centerOn(xcoord,ycoord)
{
	var x = viewportWidth /2 - xcoord*imgWidthMaxZoom /(Math.pow(2,gTierCount-1-zoom));
	var y = viewportHeight/2 - ycoord*imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom));
	setInnerDiv(x,y);
}

function centerMap()
{//ih("in centerMap1");
	if(dimensionsKnown())
	{
		var x = viewportWidth /2 - imgWidthPresentZoom /2;
		var y = viewportHeight/2 - imgHeightPresentZoom/2;
		setInnerDiv(x,y);
		//center=1;
		//ih("in centerMap2");
		//alert( "centerMap: imgWidthMaxZoom="+imgWidthMaxZoom+", gTierCount="+gTierCount+", viewportWidth="+viewportWidth+", elem.innerDiv="+elem.innerDiv+", elem.innerDiv.style="+elem.innerDiv.style+", elem.innerDiv.style.left="+elem.innerDiv.style.left)
	}	
	else 
	{//ih("dimensionsUnknown");
	}	
}

function keepInViewport()
	{//safety factor, keep minimally this amount of pixesl of image in view
	var minPixelsInView = 25;

	var imgLeft = stripPx(innerStyle.left); 
	var imgTop = stripPx(innerStyle.top);
	var imgRight = imgLeft + imgWidthPresentZoom;
	var imgBottom = imgTop + imgHeightPresentZoom;

	var limitLeft = minPixelsInView; //keep minimally 10 px of image within viewport
	var limitTop = minPixelsInView;
	var limitRight = viewportWidth - minPixelsInView;
	var limitBottom = viewportHeight - minPixelsInView;

	var corrected = false;

	if (imgRight < limitLeft) {innerStyle.left = limitLeft - imgWidthPresentZoom; corrected = true;}
	if (imgLeft > limitRight) {innerStyle.left = limitRight; corrected = true;}
	if (imgBottom < limitTop) {innerStyle.top = limitTop - imgHeightPresentZoom; corrected = true;}
	if (imgTop > limitBottom) {innerStyle.top = limitBottom; corrected = true;}
	
/*	
	if (gTierWidth[zoom] > viewportWidth) 
		{if (imgLeft > 0)
			{imgLeft = innerStyle.left = 0; corrected = true;} //correct left side margin inside viewport
		if ( (imgLeft + gTierWidth[zoom]) < viewportWidth )	
			{innerStyle.left = viewportWidth - gTierWidth[zoom]; corrected=true;} //correct right side margin inside viewport
		}
	else
		{if (imgLeft < 0)
			{imgLeft = innerStyle.left = 0; corrected = true;}//correct left side outside viewport
		if ((imgLeft + gTierWidth[zoom]) > viewportWidth )		
			{innerStyle.left = viewportWidth - gTierWidth[zoom]; corrected=true;} //correct right side outside viewport
		}	
	if (gTierHeight[zoom] > viewportHeight) 
		{if (imgTop > 0)
			{imgTop = innerStyle.top = 0; corrected = true;} //correct top side margin inside viewport
		if ( (imgTop + gTierHeight[zoom]) < viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[zoom]; corrected = true;} //correct bottom margin inside viewport
		}
	else
		{if (imgTop < 0)
			{imgTop = innerStyle.top = 0; corrected = true;} //correct top outside viewport
		if ((imgTop + gTierHeight[zoom]) > viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[zoom]; corrected = true;} //correct bottom outside viewport
		}
*/				
	if (corrected)	
		{checkTiles();
		moveViewIndicator();
		return "corrected";
		}
	}

/*
 * resizes the background div
 * not used at present
 */
function resizeBackgroundDiv()
{
	elem.bgDiv.style.width = imgWidthPresentZoom + "px";
	elem.bgDiv.style.height = imgHeightPresentZoom + "px";	
}


//////////////////////////////////////////////////////////////////////
//
// LOADING TILES
//
/////////////////////////////////////////////////////////////////////
	
function checkTiles() 
	{
	//ih("CHECKTILES()");// called by: "+checkTiles.caller+"<br>");

	if (!dimensionsKnown()) {return;}
	
	var visibleTiles = getVisibleTiles(); 
	var visibleTilesMap = {}; 
	for (i = 0; i < visibleTiles.length; i++)  //each entry is a tile, contains an array [x,y], number of tiles that would fit in the viewport
		{ var tileArray = visibleTiles[i]; //for this tile

		//if (!center) {centerMap();} //???
		
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
			elem.imageTiles.appendChild(img);
			}
		}
		
		var imgs = elem.imageTiles.getElementsByTagName("img"); 
		for (i = 0; i < imgs.length; i++) 
			{ var id = imgs[i].getAttribute("id"); 
			if (!visibleTilesMap[id]) 
				{ elem.imageTiles.removeChild(imgs[i]); i--;
				}
			}
			
		}
	
function deleteTiles()
{
	jQ(elem.imageTiles).children("img").remove();
}
		
function getVisibleTiles() 
	{
	var mapX = stripPx(elem.innerDiv.style.left); //whole image position rel to top left of viewport
	var mapY = stripPx(elem.innerDiv.style.top);
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
		

	
	
	
//////////////////////////////////////////////////////////////////////
//
// THUMB
//
/////////////////////////////////////////////////////////////////////
	
function showThumb()
	{//alert("in showThumb: imgWidthMaxZoom="+imgWidthMaxZoom+", imgHeightMaxZoom="+imgHeightMaxZoom)
	
	if( !dimensionsKnown() ) {return;}
	
	//unhide thumb (in fact would be better on thumbContainer)
	elem.thumbImageHolder.style.display="block"; 
	elem.viewIndicator.style.display="block"; 
	elem.viewIndicatorSenser.style.display="block"; 

	//insert the thumb image of the slide in the control
	elem.thumbImageHolder.innerHTML='<img id="thumbImage" src="' + imgPath + 'TileGroup0/0-0-0.jpg">';

	//dimension the thumbContainer so that it neatly fits the thumb image, note: it appears difficult to get the dimensions of the thumbImage or the thumbImageHolder, so the whole large image is used as a replacement for it 
	thumbContainerHeight = imgHeightMaxZoom/(Math.pow(2,gTierCount-1)); 
	thumbContainerWidth  = imgWidthMaxZoom/(Math.pow(2,gTierCount-1)); 
	elem.thumbContainer.style.height   = (thumbContainerHeight + 2) +"px"; //add 2: border 1px on thumbImagHolder must be accomodated
	elem.thumbContainer.style.width    = (thumbContainerWidth  + 2) +"px";
	elem.thumbImageHolder.style.height = thumbContainerHeight +"px";
	elem.thumbImageHolder.style.width  = thumbContainerWidth  +"px";
	
	//dimension the controlsContainer to hold both the thumb and the zoomButtons and place the zoomButtons at correct location //@TODO cant this be done with CSS?
	var zoomButtonsDim=getElemPos(elem.zoomButtonsContainer);
	elem.controlsContainer.style.height= thumbContainerHeight + 10 + zoomButtonsDim.height  +"px";
	elem.controlsContainer.style.width= ((thumbContainerWidth > zoomButtonsDim.width)?  thumbContainerWidth : zoomButtonsDim.width)  +"px";
	elem.zoomButtonsContainer.style.top= thumbContainerHeight + 10  +"px";

//ih("zoomButtonsDim.height="+zoomButtonsDim.height+", thumbContainerHeight="+thumbContainerHeight+", controlsContPos.height"+controlsContPos.height+", controlsContPos.width="+controlsContPos.width+"<br>"); 
//ih("thumbHeight="+thumbHeight+", thumbWidth="+thumbWidth+"<br>"); 
		
	//connect handlers
	elem.thumbContainer.ondragstart = function() { return false;}
	elem.thumbContainer.onmousemove = processThumbMove; 
	elem.thumbContainer.onmouseup = stopThumb; 
	elem.viewIndicatorSenser.onmousedown = startThumbMove; 
	elem.viewIndicatorSenser.ondragstart = function() {return false;}
	}

function hideThumb(){ ref('elem.thumbImageHolder').style.display="none";}

	
function startThumbMove(event)
	{
	if (!event){ event = window.event;}
	var viewIndicatorDragStartLeft = event.clientX; 
	var viewIndicatorDragStartTop = event.clientY; 
	var viewIndicatorOrigLeft = stripPx(elem.viewIndicator.style.left); 
	var viewIndicatorOrigTop = stripPx(elem.viewIndicator.style.top); 
	viewIndicatorDragOffsetLeft = viewIndicatorOrigLeft - viewIndicatorDragStartLeft;
	viewIndicatorDragOffsetTop = viewIndicatorOrigTop - viewIndicatorDragStartTop;
	thumbDragging = true; return false;	
	}
	
function processThumbMove(event)
	{ 
		if (!event){ event = window.event;}
		if (thumbDragging) 
			{
			elem.viewIndicator.style.left = elem.viewIndicatorSenser.style.left = event.clientX + viewIndicatorDragOffsetLeft +"px"; 
			elem.viewIndicator.style.top = elem.viewIndicatorSenser.style.top = event.clientY + viewIndicatorDragOffsetTop + "px"; 
			}
	}
	
/*
 * handles both end of drag viewIndicator and random click positioning on thumb
 */
function stopThumb(event)
{
	if (!event){ event = window.event;}
	if (event)
	{
		var eventX = event.clientX; //has no "px" apparently
		var eventY = event.clientY; 
		var fractionLR, fractionTB; 
		
		var controlsContPos= getElemPos(elem.controlsContainer);
		var thumbContPos= getElemPos(elem.thumbContainer);
				
		//end of thumbdragging
		if(thumbDragging)
			{
			thumbDragging = false;		
			fractionLR = (eventX + viewIndicatorDragOffsetLeft + viewIndicatorWidth/2 ) / thumbContainerWidth; 
			fractionTB = (eventY + viewIndicatorDragOffsetTop + viewIndicatorHeight/ 2 ) / thumbContainerHeight; 			
			}
		//click on thumbContainer without thumbdragging
		else 
			{
			fractionLR = (eventX - controlsContPos.left - thumbContPos.left) / thumbContainerWidth; 
			fractionTB = (eventY - controlsContPos.top - thumbContPos.top) / thumbContainerHeight; 
			//update position viewIndicator
			elem.viewIndicator.style.left = elem.viewIndicatorSenser.style.left = (eventX - controlsContPos.left - thumbContPos.left - viewIndicatorWidth/2 ) +"px" ;
			elem.viewIndicator.style.top  = elem.viewIndicatorSenser.style.top  = (eventY - controlsContPos.top  - thumbContPos.top  - viewIndicatorHeight/2) +"px" ;
			}	

/*			if(testing)
				{ih("eventX="+eventX+", eventY="+eventY+", thumbContPos.left="+thumbContPos.left+", controlsContPos.left="+controlsContPos.left+", controlsContPos.top="+controlsContPos.top+", thumbContainerWidth="+thumbContainerWidth+", viewIndicatorWidth/2="+viewIndicatorWidth/2+"<br>"); 	
				ih("thumbContPos.left="+thumbContPos.left+", thumbContPos.right="+thumbContPos.right+", thumbContPos.top="+thumbContPos.top+", thumbContPos.bottom="+thumbContPos.bottom+", thumbContPos.width="+thumbContPos.width+"<br>"); 
				ih("fractionLR="+fractionLR+", fractionTB="+fractionTB+"<br><br>"); 
				}
*/		
		//reposition the main image according to how the viewIndicator was set by user
		elem.innerDiv.style.left= (viewportWidth/2  - gTierWidth[zoom]  * fractionLR) +"px";
		elem.innerDiv.style.top = (viewportHeight/2 - gTierHeight[zoom] * fractionTB) +"px";
		keepInViewport();
		checkTiles();
		
		if(isDisplayingUrl) {parent.updateUrl();}
	}
}

/*
 * resizes and positions viewIndicator and viewIndicatorSenser, viewIndicator in fact indicates screen (viewport) size in relation to shown image
 */
function moveViewIndicator()
	{
	//ih("moveViewIndicator()"+moveViewIndicator.caller);
	innerDivLeft = stripPx(elem.innerDiv.style.left);
	innerDivTop  = stripPx(elem.innerDiv.style.top);
	viewIndicatorWidth  = viewportWidth/Math.pow(2,zoom);
	viewIndicatorHeight = viewportHeight/Math.pow(2,zoom); 

	elem.viewIndicator.style.left   = elem.viewIndicatorSenser.style.left   =  -innerDivLeft/(Math.pow(2,zoom)) +"px"; 
	elem.viewIndicator.style.top    = elem.viewIndicatorSenser.style.top    =  -innerDivTop/(Math.pow(2,zoom))  +"px";
	elem.viewIndicator.style.width  = elem.viewIndicatorSenser.style.width  =  viewIndicatorWidth + "px";
	elem.viewIndicator.style.height = elem.viewIndicatorSenser.style.height =  viewIndicatorHeight + "px";

//ih("Math.pow(2,zoom)="+Math.pow(2,zoom)+", viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+", viewIndicator.style.width="+viewIndicator.style.width+", viewIndicator.style.height="+viewIndicator.style.height+", innerDivLeft="+innerDivLeft+", innerDivTop="+innerDivTop+", viewIndicator.style.left="+viewIndicator.style.left+", viewIndicator.style.top="+viewIndicator.style.top+"<br>");
	}

	



//////////////////////////////////////////////////////////////////////
//
// LENGTH INDICATOR BAR
//
/////////////////////////////////////////////////////////////////////


function updateLengthBar() 
{//res = um/px
//you want a bar between 50 and 125px long
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

//get width of bar (in fact it's length, but as it is a horizontal bar it is the width in css)
var barWidth = Math.round( barUm  * 50 / um50) - 4; //4 = 2 * vert. bars are each 2 px wide

//calculate and set positions of bar-divs
var barMidPos = 100; //barContainer = 200 px, middle = 100 !this is not an example!, these are the actual values
var barLeftPos =  barMidPos - Math.round (barWidth/2); 
ref("bar_left").style.left = (barLeftPos - 2) +"px"; //vert bar= 2px width
ref("bar_mid").style.left = barLeftPos +"px";
ref("bar_mid").style.width = barWidth +"px";
ref("bar_right").style.left = (barLeftPos + barWidth) +"px";

//set resunits to um, mm or cm.
if 		(pow10  < 1000) 	{resunits= "&micro;m";}
else if (pow10 == 1000) 	{resunits= "mm"; barUm = (barUm / 1000);}
else if (pow10 >= 10000)	{resunits= "cm"; barUm = (barUm / 10000);}

// display bar-length
var txt= barUm + "  " + resunits + "<br />zoom level: " + zoom + "/" + (gTierCount-1);
ref('theScale1').innerHTML = ref('theScale2').innerHTML = txt;

}






////////////////////////////////////////////
//
// LABELS 
//
///////////////////////////////////////////


function loadLabels(pathToFile)
{ 
	
	try
	{// ih("loadLblwXhr-1");

		// First try jQuery.getScript
		// works from server, not local
		jQ.getScript(pathToFile, checkLabelsLoaded);
				
		// if working from file, jQ.getScript doesn't work, and also doesn't call the callback, fallback to own method loadJs
		// works, on Chrome, FF, IE, Saf, both local and on server
		if(window.location.protocol == "file:")
		{
			loadJs(pathToFile, checkLabelsLoaded);
		}

		// store the pathtofile on the checkLabelsLoaded function, so that checkLabelsLoaded can also call loadJs() as fallback  
		checkLabelsLoaded.pathToFile = pathToFile;
	}	
	 catch(e)
	{
		return;
	}			
}

/*
 * Callback function called when the file labels.js has been loaded
 * checks that that the labels.js file is loaded and contains a variable 'labels'. 
 * If so, calls for the labels to be rendered, if not re-calls itself 
 */
function checkLabelsLoaded()
	{
	//isLoaded= (window.labels)? "loaded":"NOTloaded";
	//ih(isLoaded);
	if(window.labels && !status.labelsRendered ) //js file should state labels= {...}
		{
		//ih("lblFromJs");
		
		//copy the labels to the internal object
		//create labelIds, use these as key and also set it in the labelData self //@TODO change in array type for loop after the labels are changed from object to array - for now is a rename
		var index = 0;
		for(label in labels)
		{
			var LabelId = "L"+index;
			//store labelData in the internal object by key labelId
			data.labels[LabelId]= labels[label];
			//also store the id in the data of the individual label (ie in the object that is value)
			data.labels[LabelId].id = LabelId;
			index++;
		}
		renderLabels();	
		}
	else
		{if ( checkLabelsLoaded.counter < 10 ) //max 10 attempts
			{clearTimeout(checkLabelsLoaded.timer);
			checkLabelsLoaded.counter++;
			var delay= checkLabelsLoaded.counter * 200; //each attempt longer delay for retry
			checkLabelsLoaded.timer = setTimeout("checkLabelsLoaded()",delay);
			
			//also attempt the loadJs method
			loadJs(checkLabelsLoaded.pathToFile,checkLabelsLoaded);
			}
		}	
	}
checkLabelsLoaded.counter=0;
checkLabelsLoaded.timer="";
checkLabelsLoaded.pathToFile=""; 

	
function renderLabels() 
{
	if(!dimensionsKnown()) 
	{clearTimeout(labelTimer);	
	labelTimer=setTimeout("renderLabels()", 500); 
	return;
	}	
	
	//prevent duplicate creation. Because checkLabelsLoaded(), and thus renderLabels() may be called by a timeOut()  	
	if(status.renderingLabels)
		{return;}
	//set switch: busy!
	status.renderingLabels = true;	
	//ih("renderLabels1");

	//remove any old labels and reset counter and status
	jQ(elem.imageLabels).empty();
	status.numberLabels = 0;
	status.labelsRendered = false;
	
	//ih("renderLabels2");
	//debug(data.labels);
	
	//create labels
	for (labelId in data.labels)
	{
		var labelData = data.labels[labelId];
		createLabel(labelData);		
	}
	//attaches handlers to labels that shows the tooltips
	initTooltips();
	//neccessary because the page may be initialized via a deep link directly at a certain zoom level
	resizeLabels();
	//possibly focus on a specific label
	focusOnLabel();
	//set global booleans
	status.renderingLabels = false;
	status.labelsRendered = true;
}

/*
 * Creates a label from the given object oLabel and appends the label into div imageLabels
 * @param object labelData e.g. {"label": "Source", "info": "Source: National Library of Medicine", "href": "http://images.nlm.nih.gov/pathlab9", "x": "0.038", "y": "0.0"}
 * @return nothing
 */
function createLabel(labelData)
{
	//debug(labelData);
	var index = status.numberLabels + 1;
	
	//ih("Creating:"+labelData.label+", createLabel.index="+index+"<br>");
	
	//create element
	var label = document.createElement("div"); 
	label.style.position = "absolute";
	label.style.zIndex = 1; 
	label.setAttribute("id", labelData.id);
	label.setAttribute("class", "label hastooltip"); 
	label.setAttribute("className", "label hastooltip"); //IE
	label = elem.imageLabels.appendChild(label);
			
	//Add the text of the label in a xss safe way (note: this text may be user inserted from the URL!)
	var labelText = labelData.label;
	labelText = ( isSet(labelData.href) )? '<a href="' + labelData.href + '" target="_blank">' + labelText + '</a>' : labelText ;	
	jQ(label).append( jQ.parseHTML(labelText) );

	//add tooltip
	if(isSet(labelData.info))
	{
		//create element
		var labelTooltip = document.createElement("div");
		labelTooltip.setAttribute("class", "tooltip"); 
		labelTooltip.setAttribute("className", "tooltip"); //IE		
		labelTooltip = elem.imageLabels.appendChild(labelTooltip);
		//Add the text of the tooltip in a xss safe way (note: this text may be user inserted from the URL!)
		jQ(labelTooltip).append( jQ.parseHTML(labelData.info) );
	}
	
	//position the label
	positionLabel(labelData);
	
	//increment the global counter
	status.numberLabels++;	
}

/*
 * Calculates the position of the label, dependent on the present zoom
 * @param object labelData - this should contain properties x and y with the locations of the label (in fractions of the image)
 * @return object {o.x,o.y} holding x and y positions in pixels in relation to the div that contains the labels (without "px")
 */
function calculateLabelPosition(labelData)
{
	var o = {};
	o.x = labelData.x * imgWidthMaxZoom /(Math.pow(2,gTierCount-1-zoom)); 
	o.y = labelData.y * imgHeightMaxZoom/(Math.pow(2,gTierCount-1-zoom)); 
	return o;	
}


/*
 * positions a label (or a new label)
 */
function positionLabel(labelData)
{
	var labelId  = labelData.id;
	var labelPos = calculateLabelPosition(labelData);
	jQ("#"+labelId).css({"left": labelPos.x + "px", "top": (labelPos.y + settings["labelOffsetHeight"]) + "px"});
	if( labelId=="NL0")
	{
		var fontSize= jQ("#NLTextArea0").css("font-size");
		var lineHeight= jQ("#NLTextArea0").css("line-height");
		var str="Positioning. Stored position left: "+labelData.x+"FR, top: "+labelData.y+"FR<br>"
		str+="font-size: "+fontSize+", line-height: "+lineHeight+", labelOffsetHeight: "+ settings["labelOffsetHeight"]+"px<br>";
		str+="Container set to left: "+labelPos.x+"px, top: "+(labelPos.y + settings["labelOffsetHeight"])+"px<br>";;
		//ih(str);	

		
		//ih("<br>Position "+labelId+" to: left="+labelPos.x+"px ["+labelData.x+"FR], top="+labelPos.y+ settings["labelOffsetHeight"]+"px, ["+labelData.y+"FR]<br />");
	}
}

/*
 * repositions (after zoom) labels and newlabels
 */
function repositionLabels()
{
	for(labelId in data.labels)
	{
		positionLabel(data.labels[labelId]);
	}
	for(labelId in data.newLabels)
	{
		positionLabel(data.newLabels[labelId]);
	}	
}

/*
 * resize labels at zooming
 * 
 */
function resizeLabels() 
{	
	var sizeFactor  = parseFloat( (zoom/(gTierCount-1)) * 3 );
	var sizeProcent = (sizeFactor * 100) + "%";  //100pct
	var labelWidth  = (sizeFactor * 100) + "px"; //100px is original width
	var newLabelTooltipWidth = ((sizeFactor * 100) -8 ) + "px"; //subtract 2x padding to get it appear just as wide as the newLabelTextArea that has no padding 
	//ih(sizeProcent + ", "+ labelWidth);
	
	//adapt font-size and max-width of fixed labels 
	//Note 1: this doesn't set width on newlabeltextareas despite they have class .label, as width is overruled by class .newlabeltextarea declared later in css
	//Note 2: used max-width instead of width so that the actual width (esp. the tooltip area!) is the width of the visual text, but the text will still wrap at the same width as the newLabel
	jQ(".label").css({'fontSize':sizeProcent,"max-width": labelWidth});

	positionCrossHairs()
	
	//adapt width of newLabels
	jQ(".newLabelTextArea").css({"width": labelWidth});
	jQ(".newLabelTooltip").css({"width": newLabelTooltipWidth});	
	
	//also activate autosize-resizing of the newlabeltextbox, to accomodate for the changed font-size 
	//Note: doesn't seem to work when calling it by class, so call it by the textarea's id's: http://www.jacklmoore.com/autosize#comment-1324
	var nrNewLabels = getObjectLength(data.newLabels); 
	for(var i=0;i < nrNewLabels;i++)
	{
		jQ("#NLTextArea"+i).trigger('autosize');
	}
}

/*
 * gets the current font-size of labels, is read from the hiddenLabel, is used to determine the labelOffset
 */
function getCurrentLabelLineHeight()
{
	return stripPx(jQ("#hiddenLabel").css("line-height"));
}

/*
 * Sets the amount of pixels that label is shown higher/lower related to the exact spot on the picture where it is placed 
 * to allow the text (with a certain height) to stand exactly next to the spot
 */
function setLabelOffsetHeight()
{
	var labelLineHeight= getCurrentLabelLineHeight();
	settings["labelOffsetHeight"] = - (labelLineHeight/2);
	//ih("LabelLineHeight="+labelLineHeight + ", SET labelOffsetHeight= "+ settings["labelOffsetHeight"]+"<br>");
}



function placeTestLabel()
{
	var labelData={};
	labelData.id="NL0";
	labelData.x= 0.39;
	labelData.y= 0.443;
	positionLabel(labelData);
	data.newLabels["NL0"].x= 0.39;
	data.newLabels["NL0"].y= 0.443;
}

function testLabelPos()
{

	var str="";
	str+= "Innerdiv-left:" +jQ("#innerDiv").css("left") +", Innerdiv-top:" +jQ("#innerDiv").css("top")+"<br>";
	str+= "Dep-left:" +jQ("#L4").css("left") +" ["+data.labels["L4"].x+"FR]<br>";
	str+= "Dep-top:"  +jQ("#L4").css("top")  +" ["+data.labels["L4"].y+"FR]<br>";
	str+= "Dep-line-height:" +jQ("#L4").css("line-height") +"<br>";
	str+= "Dep-font-size:" +jQ("#L4").css("font-size") +"<br>";

	str+= "NewLabels-left:" +jQ("#newLabels").css("left") +", NewLabels-top:" +jQ("#newLabels").css("top")+"<br>";
	str+= "NL0-left:" +jQ("#NL0").css("left") +" ["+data.newLabels["NL0"].x+"FR]<br>";
	str+= "NL0-top:"  +jQ("#NL0").css("top")  +" ["+data.newLabels["NL0"].y+"FR]<br>";
	str+= "NLTextArea0-left:" +jQ("#NLTextArea0").css("left") +"<br>";
	str+= "NLTextArea0-top:"  +jQ("#NLTextArea0").css("top")  +"<br>";	
	str+= "NLTextArea0-line-height:" +jQ("#NLTextArea0").css("line-height") +"<br>";
	str+= "NLTextArea0-font-size:" +jQ("#NLTextArea0").css("font-size") +"<br>";
	
	ih(str);
	
}
function focusOnLabel()
{
	if(focusLabel)
	{
		//alert("focussing on "+focusLabel)
		var x = data.labels[focusLabel].x
		var y = data.labels[focusLabel].y;
		centerOn(x,y);
		//alert("centered on x="+x+", y="+y)
	}
}



/*
 * Creates a new label (for GUI label making), it is a draggable container with a textbox for the labeltext and a textbox for the tooltiptext  
 */
function makeNewLabel()
{
	//Note: length property is not a native thing in a javascript object
	var index= getObjectLength(data.newLabels); 
	//create id. 'newLabelId' is used as key in the object newLabels (with value= data-object for this new label)
	var newLabelId =  "NL" + index; 
	//Create data object for the new label and add it to the global data.newLabels
	var newLabel = {"id":newLabelId,"x":null,"y":null,"text":"","tooltip":null}; //container for the data of the new label
	data.newLabels[newLabelId] = newLabel;
	
	//DOM creation
	//container, 'newLabelContainerId' is alias for newLabelId that is used in DOM actions to clarify that the container-div is indicated. 
	var newLabelContainerId = newLabelId;
	var newLabelContainerHtml = '<div id="'+newLabelContainerId+'" class="newLabelContainer" className="newLabelContainer"></div>';
	jQ( "#newLabels").append(newLabelContainerHtml);
	//The crosshair
	jQ( "#"+newLabelContainerId ).append('<img src="../img/cursor_crosshair2.png" class="newLabelCrosshair hastooltip"/><div class="tooltip">The label will be affixed to this point.<br /><em><small>(This is at half the line-height of the label\'s text)</small></em>.</div>');
	
	//textarea for the labeltext
	var newLabelTextAreaId = "NLTextArea" + index;
	jQ( "#"+newLabelContainerId ).append('<textarea id="'+newLabelTextAreaId+'" class="newLabelTextArea label" classname="newLabelTextArea label"></textarea>');
	//neccessary to make textarea editable whilst it is draggable: http://yuilibrary.com/forum/viewtopic.php?p=10361 (in combination with 'cancel:input' in draggable)	
	jQ( "#"+newLabelTextAreaId ).click(function(e){e.target.focus();}) 
	//Autosize the textarea at text entry http://www.jacklmoore.com/autosize 
	jQ( "#"+newLabelTextAreaId ).autosize({append: "\n"}); 
	//Continuously get the entered text and store it in the data of the newlabel
	jQ( "#"+newLabelTextAreaId ).keyup(function () {
		data.newLabels[newLabelId].text = ref(newLabelTextAreaId).value; //http://stackoverflow.com/questions/6153047/jquery-detect-changed-input-text-box
		//ih(data.newLabels[newLabelId].text)
		}); 
		
	//buttons to open the tooltip textarea
	var htmlArws = '<br /><img id="newLabelArwDown' + index + '" class="newLabelArw hastooltip" classname="newLabelArw hastooltip" src="../img/bullet_arrow_down.png">';
	htmlArws+= '<div class="tooltip">Add a tooltip for this label<br /><em><small>(A tooltip is a little box with additional information, that appears when the user hovers her mouse over the label. Just as the one you\'re reading now!)</small></em>.</div>';
	htmlArws+= '<img id="newLabelArwUp' + index + '" class="newLabelArw hastooltip" classname="newLabelArw" src="../img/bullet_arrow_up.png">';
	htmlArws+= '<div class="tooltip">Close tooltip (your text remains stored)</div>';
	jQ( "#"+newLabelContainerId ).append(htmlArws);
	//initially hide the up arrow
	jQ("#newLabelArwUp"+index).hide();
	
	//textarea for the labeltext
	var newLabelTooltipId = "NLTooltip" + index;
	jQ( "#"+newLabelContainerId ).append('<textarea id="'+newLabelTooltipId+'" class="newLabelTooltip tooltip" classname="newLabelTooltip tooltip"></textarea>');
	//neccessary to make textarea editable whilst it is draggable: http://yuilibrary.com/forum/viewtopic.php?p=10361 (in combination with 'cancel:input' in draggable)	
	jQ( "#"+newLabelTooltipId ).click(function(e){e.target.focus();}) 
	//Autosize the textarea at text entry http://www.jacklmoore.com/autosize 
	jQ( "#"+newLabelTooltipId ).autosize({append: "\n"}); 
	//Continuously get the entered text and store it in the data of the newlabel
	jQ( "#"+newLabelTooltipId ).keyup(function () {
		data.newLabels[newLabelId].tooltip = ref(newLabelTooltipId).value; //http://stackoverflow.com/questions/6153047/jquery-detect-changed-input-text-box
		//ih(data.newLabels[newLabelId].text)
		}); 
	


	//attach handlers to button (Note: refers to newLabelTooltip, so this is after adding of tooltip-textarea
	jQ("#newLabelArwDown"+index).click(function(){
		jQ( "#"+newLabelTooltipId ).show(); //open tooltip text area
		jQ(this).hide(); //hide down arrow
		jQ("#newLabelArwUp"+index).show(); //show up arrow
	})

	jQ("#newLabelArwUp"+index).click(function(){
		jQ( "#"+newLabelTooltipId ).hide(); //hide tooltip text area
		jQ(this).hide(); //hide up arrrow
		jQ("#newLabelArwDown"+index).show(); //show down arrow
	})
	
	//position new Label in the middle of viewport to start with
	var center = getImgCoords(viewportWidth/2,viewportHeight/2); //calculate position on image in fractions of mid-viewport 
	data.newLabels[newLabelId].x = center.x; //store in the data object
	data.newLabels[newLabelId].y = center.y;
	
	//position the new label
	positionLabel(data.newLabels[newLabelId]);
	//var labelPos = calculateLabelPosition(data.newLabels[newLabelId]);
	//ih("newLabelLeft="+labelPos.x+"px= "+data.newLabels[newLabelId].x+"FR, newLabelTop="+labelPos.y+"px= "+data.newLabels[newLabelId].y+"FR");
	
	//make label draggable. At stopdrag get the textarea's value and update the position data in the data object of the newlabel
	jQ( "#"+newLabelContainerId).draggable({
		cancel: "input", //neccessary to make textarea draggable
		stop: function( event, ui ) 
		{		
			//ui.position.left and top are px positions related to left top of image
			data.newLabels[newLabelId].x = ui.position.left / imgWidthPresentZoom; //@TODO? add border correction of 1?
			data.newLabels[newLabelId].y = (ui.position.top - settings["labelOffsetHeight"]) / imgHeightPresentZoom; //apparently border seems no effect on top???? so dont correct
			var str="<br>Container moved to left: "+ui.position.left+"px, top: "+ui.position.top+"px<br>";
			str+="labelOffsetHeight: "+ settings["labelOffsetHeight"]+"px<br>";
			str+="Stored position left: "+data.newLabels[newLabelId].x+"FR, top: "+data.newLabels[newLabelId].y+"FR<br>";
			//ih(str);	
		}
	});
	
	//set focus on new label
	jQ( "#"+newLabelTextAreaId ).focus();
	//activate tooltips
	initTooltips();
	
}

function positionCrossHairs()
{
	var left = - settings.crosshairWidth/2;
	var top  = - settings.crosshairHeight/2 - settings["labelOffsetHeight"];

	//set crosshair at middle of (first-line) line-height
	jQ(".newLabelCrosshair").css({ "left": left +"px", "top": top +"px"});

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


//////////////////////////////////////////////////////////////////////
//
// TOOLS AND ADDONS
//
/////////////////////////////////////////////////////////////////////

/*
 * sets setting wheelZoomInDirection, converts "up" and "down" to 1 and -1
 * @param string zoomInDirection: "up" : zoom in at wheel up; "down" " zoom in at wheel down
 */
function setWheelZoomInDirection(zoomInDirection)
{
	settings["wheelZoomInDirection"] = (zoomInDirection == "up")? 1 : ((zoomInDirection == "down")? -1 : settings["wheelZoomInDirection"]);
}


/*
 * shows or hides the little panel at the top of the page displaying the coords
 * @param boolean showOrHide : true = show, false = hide
 * if not given, it uses the settings["showCoordinatesPanel"] 
 */
function showHideCoordinatesPanel(showOrHide)
{
	//if a setting is passed, set 'settings["showCoordinatesPanel"]' that determines the showing to this value, else keep the default one  
	settings["showCoordinatesPanel"] = (typeof showOrHide == "boolean")? showOrHide : settings["showCoordinatesPanel"];
	//ih("in viewerframe showHideCoordinatesPanel, settings["showCoordinatesPanel"] ="+ settings["showCoordinatesPanel"])
	//show coords panel
	ref("coordsPane").style.display = (settings["showCoordinatesPanel"])? "block" : "none";
	//then hide the name panel, as this overlaps, when shown it must be inline-block to have the centering and dynamic width work
	ref("namePanel").style.display = (settings["showCoordinatesPanel"])?  "none" : "inline-block";
}


/*
 * wheelmode: what does wheel do: zoomin/zoomout or next/prev in stack of images
 */
function wheelMode1(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" checked  onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" onClick="wheelMode2()" >&nbsp;Next/Prev'; wheelmode=0;}

function wheelMode2(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" checked  onClick="wheelMode2()" >&nbsp;Next/Prev'; wheelmode=1;}


/*
 * Get present view settings
 * Is called by the navframe to create an url that calls the present view
 */
function getPresentViewSettings()
{
	var o ={}; //container
	o["slideName"] = slideName;
	o["zoom"] = zoom;
	//get the position on the image at the center of the viewport 
	var center = getImgCoords(viewportWidth/2,viewportHeight/2);
	o["cX"] = center.x;
	o["cY"] = center.y;
	
	return o;	
}

/*
 * positions the sizeIndicators
 */
function positionSizeIndicators()
{
	var horCenter  = viewportWidth/2;
	var vertCenter = viewportHeight/2;
	jQ("#hor800x600").css({"left": horCenter-280, "top": vertCenter - 248});
	jQ("#hor1024x768").css({"left": horCenter-392, "top": vertCenter - 328});
}

/*
 * shows and positions the sizeIndicators
 */
function showSizeIndicators()
{
	positionSizeIndicators();
	jQ("#sizeIndicators").show();
	isDisplayingUrl = true; 
}


function hideSizeIndicators()
{
	jQ("#sizeIndicators").hide();
	isDisplayingUrl = false;
}


/*
 * presently not called, keep for a while
 */
function hideUrlBarAndSizeIndicators()
{
	if(isDisplayingUrl && parent.closeUrlBar)
		{
		parent.closeUrlBar();//this will also call hideSizeIndicators()
		}	
}



//////////////////////////////////////////////////////////////////////
//
//  MOBILE FUNCTIONS
//
/////////////////////////////////////////////////////////////////////


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
	elem.controlsContainer.style.right=""; //left positioning elem.thumbImageHolder to prevent discrepancy viewport-positions vs. visual-viewport-eventX  which breaks thumb 
	elem.controlsContainer.style.left="0px";
	elem.controlsContainer.style.top="0px";
	ref("barCont").style.left= "100px";//move the bar aside of the elem.thumbImageHolder that has now come to the left
	//ref('test').style.display="block";
	}
	
function setMobileOff()
	{mobile=false;
	ref("iconMobile").style.display="block";
	resetDimensions();
	hideArrows();
	elem.controlsContainer.style.left="";
	elem.controlsContainer.style.top="10px";
	elem.controlsContainer.style.right="10px";
	ref("barCont").style.left= "0px";
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
{
	var zoomButtonsDim = getElemPos(elem.zoomButtonsContainer);
	var btLRtop = stripPx(ref("btRightCont").style.top);
	//ih("zoomButtonsDim.top="+zoomButtonsDim.top+", btLRtop="+btLRtop+"<br>");
	if (btLRtop < (zoomButtonsDim.top + 30)) 
	{//ih("correcting ");
		ref("btLeftCont").style.top = ref("btRightCont").style.top =  (zoomButtonsDim.top + 30) +"px"; 
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
	{var map= getElemPos(elem.innerDiv);
	if(dir=="up") 			{ elem.innerDiv.style.top  = (map.top  + 10) +"px"; }
	else if(dir=="down") 	{ elem.innerDiv.style.top  = (map.top  - 10) +"px"; }
	else if(dir=="left") 	{ elem.innerDiv.style.left = (map.left + 10) +"px"; }
	else if(dir=="right") 	{ elem.innerDiv.style.left = (map.left - 10) +"px"; }
	var result= keepInViewport();
	if (result=="corrected") {stopAutoPan(dir);}
	checkTiles();
	moveViewIndicator();
	}		



	



//////////////////////////////////////////////////////////////////////
//
// FUNCTIONS FOR STACKS OF IMAGES (under development)
//
/////////////////////////////////////////////////////////////////////

function slideNext(){ 
	return; //temp disabled
	if (slidePointer<JSONnum-1){ slidePointer++;}else{ slidePointer=0;}
rawPath = JSONout.slides[slidePointer].path; imgWidthMaxZoom = JSONout.slides[slidePointer].width; imgHeightMaxZoom = JSONout.slides[slidePointer].height; if (JSONout.slides[slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[slidePointer].labelspath; loadLabels();}else{labelsPath="";}
init0(); refreshTiles(); checkTiles();moveViewIndicator()}


function slidePrev(){
	return; //temp disabled
	if (slidePointer>0){ slidePointer--;}else{ slidePointer=JSONnum-1;}
rawPath = JSONout.slides[slidePointer].path; imgWidthMaxZoom = JSONout.slides[slidePointer].width; imgHeightMaxZoom = JSONout.slides[slidePointer].height; if (JSONout.slides[slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[slidePointer].labelspath; loadLabels();}else{labelsPath="";}
init0(); refreshTiles(); checkTiles();moveViewIndicator()}


////////////////////////////////////////////
//
//	GENERAL SUPPORT FUNCTIONS
//
///////////////////////////////////////////

function ref(i) { return document.getElementById(i);}

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




function refreshTiles() { var imgs = elem.imageTiles.getElementsByTagName("img"); while (imgs.length > 0) elem.imageTiles.removeChild(imgs[0]);}

//gives IE version nr source: DHTML D.Goodman 3rd ed p 669
function readIEVersion()
	{var ua = navigator.userAgent;
	var IEOffset = ua.indexOf("MSIE ");
	return parseFloat(ua.substring(IEOffset + 5, ua.indexOf(";", IEOffset)));
	}
	
function rawDimensionsKnown()
	{return ( imgWidthMaxZoom==null || imgHeightMaxZoom==null )? false : true;
	}	
	
function dimensionsKnown()
	{return ( imgWidthMaxZoom==null || imgHeightMaxZoom==null || isNaN(imgWidthMaxZoom) || isNaN(imgHeightMaxZoom) )? false : true;
	}	



/*
 * Gets the part of the url that is NOT the query, that is: protocol + host + pathname (see JavaScript Definitive Guide, Flanagan 3rd ed. p.854),
 * BaseUrl is not an official name, but used for ease here 
 * 
 */
function getBaseUrlPart()
{
	var url = location.href;
	var baseUrlPart = url.split("?")[0];
	return baseUrlPart; 
}

////////////////////////////////////////////
//
//	FILE LOADING
//
///////////////////////////////////////////
	
/*
 * creates a new script node and loads a js file in it 
 * works on Chrome, FF, IE, Saf, both local and on server
 * Note: loading a raw json {..} in this way gives error, which cannot be prevented, so only use if not a raw JSON, e.g. safe js file is=  var xxxx ={..}
 *
 */
function loadJs(url,callback)
	{
	try
		{
		var scrip= document.createElement("script");
		scrip.setAttribute("type","text/javascript");
		scrip.setAttribute("src",url);
		scrip.onload= scrip.onreadystatechange = callback; //onreadystatechange is for IE, see http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer @TODO: add cleanup for memory leak of IE see this stackoverflow
		return scrIn=document.body.appendChild(scrip);
		}
	catch(e)
		{return;}	
	} 	

/*
 * FALLBACK xml imageproperties loading
 */
function loadXMLfile()
{try
	{	
	//alert(imgPath + "ImageProperties.xml");
	jQ.get(imgPath + "ImageProperties.xml", xmlread);
	}
catch(e)
	{return;}	
}


function xmlread(data) 
{
	try
	{ 
	
		return;
		
/*		alert(data);	//data= [object XMLDocument]
		var xmlDoc = jQ.parseXML(data); //this doesn't work yet!!!
		alert(xmlDoc); //xmlDoc = null
		var $xml = jQ( xmlDoc );

		imgWidthMaxZoom = parseFloat(data.getAttribute("WIDTH"));
		//imgHeightMaxZoom = $xml.find("IMAGE_PROPERTIES").attr("HEIGHT");
	
		//ih("hasReadWHfromXhr");
		//loadedXML=1;
		//showInitialView();
*/		
	}
	catch(e)
	{ 
	}

}




//////////////////////////////////////////////////////////////////////
//
// DEBUGGING, INFORMATIVE MESSAGES, WARNINGS
//
/////////////////////////////////////////////////////////////////////

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

//////debugging functions  ///////////////////////////

function ih(txt)
	{logwin.innerHTML+= txt + " || ";}	

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
				if (subject.length == 0) {str+= "EMPTY";}
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


	