/*
 * Core functionality (virtual slide, thumbnail, basic labels) written by Shawn Mikula, 2007 in brainmaps API.  Contact: brainmaps--at--gmail.com.   
 * Extensively modified (IE support, zoom on mouse location, zoomout by holding mousedown, online GUI labelling, direct URLs, touch support, credits, debugging, etc) by Paul Gobee, 2010-2013, dept. of Anatomy & Embryology, Leiden University Medical Center, the Netherlands, Contact: o--dot--p--dot--gobee--at--lumc--dot--nl 
 * See also: http://www.caskanatomy.info/microscopy and www.caskanatomy.info/products/caskviewer
 * iPhone/iPad modifications on virtual slide written by Matthew K. Lindley; August 25, 2010
 * You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 
 * This notification should be kept intact, also in minified versions of the code. 
 *
 */



/*

/*
 * Expected global vars in loaded files:
 * 
 * var slides;  //global var 'slides' containing the list of slides. Is defined and set in file slides.js
 * var menus;   //global var 'menus' containing the menus of slideSets. Is defined and set in file menus.js
 * var views;   //global var 'views' containing stored URL-queries to load specific slide with pre-set position, zoom and labels. Is defined and set in file views.js
 * var credits; //global var 'credits' contianing credit information. Is defined and set in file credits.js
 * 
 * Expected scripts:
 * 
 * file common.js with support scripts
 * jQuery  
 * jQuery ui
 * jQuery autosize.js
 * 
 */
//alert("load main page");

var settings= {}; //container object for settings
settings.slideName = null;
settings.zoom = null;
settings.x = null;
settings.y = null;
settings.res = 0.2325; //micrometers/ pixel 
settings.showCoordinatesPanel = false; //default dont show coords panel
settings.wheelZoomInDirection = -1; //determines zoomin/out direction of wheel; 1= up, -1= down
settings.originalLabelWidth = null; //base label with in pixels
settings.showLabel = null; //label that will be shown on the requested x, y spot
settings.focusLabel  = null; //labelText and id of label that will be shown automatically on its own location
settings.hasLabels = false; 
settings.labelOffsetHeight = null; //amount of pixels that label is shown higher/lower related to the exact spot on the picture where it is placed - to allow the text (with a certain height to stand exactly next to the spot)
settings.crosshairHeight = 16; //pixelsize of crosshairimage
settings.crosshairWidth = 16; //pixelsize of crosshairimage
settings.wheelmode = 0; //0 = wheel zooms, 1 = wheel goes to next/prev image (for stacks of images (not yet implemented)
settings.slidePointer = 0; //nr of the slide in a stack of slides [not yet implemented completely]
settings.hideThumb = false;
settings.zoomCenterUnlockThreshold= 3;//nr of pixels move needed to unlock a zoomCenterLock

var elem = {}; //global containing references to DOM elements in the connected html page, wiil be initialized in function setGlobalReferences()

var data = {}; // global container for data
data.labels = {}; //object with data of the labels
data.highestUsedLabelIndex = null; //the highest index used up till now (irrespective if it is still in use now). If a label is created give it an id of this index plus 1
data.newLabels = {}; //object with data of live created labels
data.highestUsedNewLabelIndex = null; //the highest index used up till now (irrespective if it is still in use now). If a newlabel is created give it an id of this index plus 1
data.queryArgsFromUrl = {}; //object/map with the queryargs that were read from the URL  (these may be combined with queryargs read from a view - a stored query)
data.credits = {}; //object will get credits info if present

var now = {}; //global object to keep data that needs to be kept track of
now.renderingLabels = false; //busy creating labels.
now.labelsRendered = false;
now.zoom = 2 ;// start zoom level
now.newLabelTooltipIsOpen = {}; //holds ids of newlabeltooltips that are open
now.newLabelPreviewTooltipEnabled ={}; //holds ids of newlabeltooltips where user has not yet mouseouted the arw after closing tooltiptextarea
now.labelMode = "fixed"; //"edit" labels can be editable or fixed
now.isDisplayingUrl = false //boolean indicating that urlBar with deeplink url is presently displayed
now.monitorPosition = false //boolean that is true if either now.isDisplayingUrl or settings.showCoordinatesPanel is true

//image
var slideData = {}; //object that will contain the data of the presently shown slide
var tileSize = 256; 
var path = null; //may be defined in html page (then overwrites the null value set here)
var rawPath = null; //as read from html page or query
var imgPath = null; //path as used in program
var height = null, width = null; //may be defined in html page (then overwrites the null values set here)
var imgWidthMaxZoom = null, imgHeightMaxZoom= null; //width/height of max size image, Note: may be string as read from html page, query or xhr
var imgWidthPresentZoom = null, imgHeightPresentZoom= null; //integer, shortcut for gTierWidth/Height[now.zoom]
var loadedXML=0; //used in xhr loading of XML and JSON files
var labelTimer;
var gTierCount; //nr of zoom levels
var gTierWidth = new Array(), gTierHeight = new Array(); //width and height of image at certain zoomlevel
var	gTileCountWidth = new Array(), gTileCountHeight = new Array(); //number of tiles at certain zoomlevel
var visibleTilesMap = {}; // {"tileName" : [row,col]} of each visible row/col
var viewportWidth = null, viewportHeight = null; //dimensions in pixels of viewport
var innerStyle; //global refs to elements,  
var dragOffsetLeft, dragOffsetTop, dragging= false; //used in dragging image
var zoomOutTimer= false, autoZooming= false; //used to auto-zoomout if mouse hold down on image
var lockedZoomCenterX= null, lockedZoomCenterY= null; //if using +/- keys or zoombuttons locks the start zoomcenter until mousemove or zoom on cursor
var lockedZoomCursorX= null, lockedZoomCursorY= null; //
var cursorX, cursorY; //continuously keeps track of cursorposition to enable scrolling with centerpoint cursorposition
var downX=null,downY=null;//IE workaround for autozoomout
//var isDisplayingUrl = false; //boolean indicating that urlBar with deeplink url is presently displayed
var innerDivOffsetLeft = 0; //default start
var innerDivOffsetTop = 0;

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
var isiPhone= (navigator.userAgent.indexOf("iPhone") != -1)? true : false;
var isiOs = (isiPad || isiPhone)? true : false;
var isTouchDevice = ("ontouchstart" in window)? true : false;



//////////////////////////////////////////////////////////////////////
//
// INIT
//
/////////////////////////////////////////////////////////////////////


//do all stuff that can be done as soon as document has loaded
function init() 
{	
	//Give warning message if image loading is disabled
	if( !automaticImageLoadingIsAllowed() )
		{showAutomaticImageLoadingDisallowed();}
 		
	//Load data
	//set global references to DOM elements 
	setGlobalReferences();

	//alert(window.location)
	
	//Reads data from different inputs and sets globals and settings from these data
	readDataToSettings();
	//Set event handlers
	setHandlers();
	
	//Specific settings
	if ((isMobile || isiPhone) && !isiPad) {setMobileOn();}
	if (isiPad) {setFontSizeScaleBar(1);}
	//if (isiPad) {trackOrientation();}	//was neccessary on iPad 1, doesn't seem needed anymore

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
	try
	{
	if(parent && parent.slideIsLoaded) /*Chrome on local drive incorrectly regards accessing the main frame as cross-domain*/
		{
		parent.slideIsLoaded();
		}
	}
	catch(e)
	{}
	
	
}//eof init()


/*
 * Reads data from different inputs and sets globals from these data
 */
function readDataToSettings()
{
	//set or adapt globals based on variables defined in html page
	readSettingsInHtmlFileToGlobals();
	
	//get variables from query in URL
	//dont directly uri-decode texts for the labels, you want to first extract the content parts between the parentheses, any parentheses in the content should remain encoded so long
	data.queryArgsFromUrl = getQueryArgs({"dontDecodeKey":"labels"});
	//and store the results in settings
	queryArgsToSettings(data.queryArgsFromUrl);
	
	//test for a view request, if present, load data of the view
	//var result = settings.slideName.match(/view\((.+?)\)/)	
	if(settings.viewName)
	{
		//if a view is requested, use that
		//discardDetailSettings();
		loadViewData(settings.viewName);
	}
	//copy a possible initial zoom setting to the life value in object 'now'
	if(settings.zoom)
	{
		now.zoom = settings.zoom;
	}
	
	//checks 1
	if(!settings.slideName)
	{
		showNoSlideRequestedWarning();
		return;
	}
	if(typeof slides == undefined)
	{
		showSlidesFileMissingWarning();
		return;
	}
	if(slides[settings.slideName] == undefined)
	{
		showRequestedSlideNotPresentWarning();
		return;
	}
	
	//load slideData of requested slide
	readslideDataToGlobals();

	//checks 2
	//check if path is provided
	if(rawPath == undefined)	
	{
		showNoPathWarning(); 
		return;
	}
	else //get path
	{
		imgPath=rawPath;		
	}
	
	//if dimensions not yet known, try to read from ImageProperties.xml file
	if (!imgWidthMaxZoom && !loadedXML ) 
		{//ih("init0-loadXML");
		 loadXMLfile();//Note: doesn't work yet
	 	}
	
	//read initial labelwidth (is used in resizeLabels())
	settings.originalLabelWidth =  getUserAgentLabelWidth();
	
	//extract the string read from the query with label data  
	/*returns format:
	 * extractedLabels = [
	 * {id:"L0",x:..,y:..,label:..,tooltip:..},
	 * {id:"L1",x:..,y:..,label:..,tooltip:..},
	 * etc
	 * ]
	 */
	 var extractedLabels = extractLabelData(settings.labels);
	 //create labelData objects with it that are stored in data.labels
	 for(var i=0;i<extractedLabels.length;i++)
	 {	
		 createLabelObject(extractedLabels[i]);		 
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
 * gets the data for a specific requested view from the file views.js
 * @param string viewName = name of a specific view (view is in facted a stored query)
 */
function loadViewData(viewName)
{
	var queryArgsFromView = getViewData(viewName);
	//store the settings as requested in the view. Any additional settings in the URL will overwrite the settings of the view
	queryArgsToSettings(queryArgsFromView,data.queryArgsFromUrl);

}

/*
 * Stores data read from the query to the global object 'settings'
 * Note: this function can be called by:  
 * readDataToSettings() 	- in this case the query data comes from a real query
 * loadViewData()			- in this case the query data comes from the view (a stored query)
 * You can enter one or more params queryArgs, e.g. one originating from the URL, another originating from a view. 
 * If two queryArgs hold the same property (e.g. both have a 'zoom' property), the latter will overwrite the earlier onse
 * @param object/map queryArgs
 * @param object/map queryArgs [optional] a second queryArgs parameter from another source 
 * @param object/map queryArgs [optional] a third queryArgs parameter from another source 
 * @return nothing
 * @sets global 'settings'.
 */
function queryArgsToSettings(queryArgs1)
{
	var nrArguments = arguments.length;
	var queryArgs;
	
	for(i=0; i<nrArguments; i++)
	{
		queryArgs = arguments[i];
		
		if (queryArgs.start){ settings.slidePointer = queryArgs.start;} //not yet well implemented, for viewing stacks
		if (queryArgs.slide) {settings.slideName = queryArgs.slide;}
		if (queryArgs.view) {settings.viewName = queryArgs.view;}	
		if (queryArgs.showcoords) { setShowCoordinatesPanel( (queryArgs.showcoords == 1)? true : false); } 
		if (queryArgs.wheelzoomindirection) { setWheelZoomInDirection(queryArgs.wheelzoomindirection); }; 
		if (queryArgs.zoom){ settings.zoom = Number(queryArgs.zoom);}
		if (queryArgs.x) { settings.x = Number(queryArgs.x);}
		if (queryArgs.y) { settings.y = Number(queryArgs.y);}
		if (queryArgs.label) { settings.showLabel = queryArgs.label;}
		if (queryArgs.labels) { settings.labels = queryArgs.labels;}	
		if (queryArgs.focus) { settings.focusLabel = queryArgs.focus;}
		if (queryArgs.hidethumb) {settings.hideThumb = queryArgs.hidethumb;}; 
	}

}

/*
 * Discards settings for details settings: x, y, zoom, labels etc. Is NOT used presently..
 * This is used when the URL request has both a 'view' request and x, y, zoom, labels etc requests (= details-requests) .
 * Then the view request has precedence. To prevent possible unclarities, discard the settings caused by the details-requests.
 */
function discardDetailSettings()
{
	settings.zoom = null;
	settings.x = null;
	settings.y = null;
	settings.labels = null;
	setShowCoordinatesPanel(false);
	setWheelZoomInDirection("down");
	settings.hideThumb = false;
	//settings.label = null; //dont know if we want this one still
	//settings.focus = null; //dont know if we want this one still	
}

/*
 * sets globals about the slide based on the slideData read from the global 'slides' 
 * also might need global 'credits'
 */
function readslideDataToGlobals()
{
	if(!window.slides) {return;}
	
	//here the global var 'slides' is read!!
	slideData = slides[settings.slideName];
	if (slideData.path) {rawPath = slideData.path;} 
	if (slideData.width) {imgWidthMaxZoom = slideData.width;} 
	if (slideData.height) {imgHeightMaxZoom = slideData.height;} 
	if (slideData.res)	{settings.res = slideData.res;}
	//if (slideData.hasLabels) {settings.hasLabels = (slideData.hasLabels.search(/true/i) != -1)? true :false;} 
	if (slideData.credits && window.credits && window.credits[slideData.credits]) {data.credits = window.credits[slideData.credits];} 	

}


/*
 * Attaches event handlers
 * 
 */
function setHandlers()
{
	//main image interaction
	
	var outerDiv = document.getElementById("outerDiv"); 

	outerDiv.onmousedown = handleMouseDown; outerDiv.onmousemove = handleMouseMove; outerDiv.onmouseup = handleMouseUp; outerDiv.ondblclick= handleDblClick; 
	outerDiv.ondragstart = function() { return false;};

	//Workaround for iPad and iPhone feature/bug: on iPad an iFrame resizes to accomodate its content, this repositions content, that in turn again resizes iFrame, etc. this causes an endless loop
	//prevent this from happening on iPad as on iPad an iFrame resizes to accomodate its content, this repositions content, that in turn again resizes iFrame, etc. this causes an endless loop
	//http://dev.magnolia-cms.com/blog/2012/05/strategies-for-the-iframe-on-the-ipad-problem/
	if(!isiOs) 
	{
		window.onresize=winsize; //moved to here to prevent error on Chrome
	}
		
	// Capture Apple Device Events
	// iPhone/iPad modifications written by Matthew K. Lindley; August 25, 2010 
	//apple and android
	outerDiv.ontouchstart 	= appleStartTouch;
    outerDiv.ontouchend 	= appleMoveEnd;
    outerDiv.ontouchmove 	= appleMoving;
    
    //apple only
    outerDiv.ongesturestart = function (event) 
    {
        event.preventDefault();
        gestureScale = event.scale;
        parent.document.ontouchmove = function (event) 
        {
            event.preventDefault();
        };
    }
    //apple only
    outerDiv.ongestureend = function (event) 
    {
        event.preventDefault();
        if (event.scale > gestureScale) 
        {
            ZoomIn();
        } 
        else 
        {
            ZoomOut();
        }
        parent.document.ontouchmove = null;
    };

    //thumb interaction
    
    //zoomin and zoomout magnifier glass buttons
    //Note: click appears to work better on iPad than touchstart for the zoomout button. Why???
    ref("zoomin").onclick = btZoomIn;
    ref("zoomout").onclick = btZoomOut;
    
    //don't show hints on touch device. a. they don't make sense, b. they show on click, but they dont hide on touchend, so its difficult to get them away
    if(!isTouchDevice)
   	{
        jQ("#zoomin").mouseover(showZoomInTips); 
		jQ("#zoomin").mouseout(hideTips); 
		jQ("#zoomout").mouseover(showZoomOutTips);
		jQ("#zoomout").mouseout(hideTips);
	}
    
	initTooltips();
}


/*
 * do calculations and rendering for which width and height are needed	 
 */
function showInitialView() 
{//ih("init");

	//set global information 
	imgWidthMaxZoom=parseInt(imgWidthMaxZoom); 
	imgHeightMaxZoom=parseInt(imgHeightMaxZoom); 	
	gTierCount = getNrTiers(); //no of levels

	var o = countTilesPerTier(); //gets nr of tiles and width and height dimensions for each level
	gTierWidth= o.gTierWidth; //unpack the return object and set the globals
	gTierHeight= o.gTierHeight;

	currentInnerDivWidth  = imgWidthPresentZoom= gTierWidth[now.zoom]; //shortcut, currentInnerDivWidth can be smaller than imgWidthPresentZoom (if innerDiv is cut off left or top to keep it not too large)
	currentInnerDivHeight = imgHeightPresentZoom= gTierHeight[now.zoom]; //shortcut
	
	//ih("init-winsize");
	winsize();//do after onload for IE

	/////////////////
	//Position image
	////////////////
	
	//center on a requested x and y
	//Note: the zoom level is handled by setting the correct position in centerOn() or centerMap() and next by loading the correct images by checkTiles()
	if (settings.x && settings.y)
		{//ih("init-cXCenter, cX="+cX);
			centerOn(settings.x,settings.y);
			//and show the requested label
			if(settings.showLabel)
			{
				createLabel({"label": settings.showLabel,  "x": settings.x, "y": settings.y});
			}
		}
	//center on middle of image
	else
		{//ih("init-centerMap");	
		centerMap();
		}
	
	
	//load labels
	if (getObjectLength(data.labels)>0) 
		{
		renderLabels();
		} 

	//ih("init-showThumb");
	if (!settings.hideThumb) 	{showThumb();}
		
	//ih("init-updateDiverse");
	//resizeBackgroundDiv(); 
	//loads the tiles
	checkTiles(); 
	moveViewIndicator(); 
	updateLengthBar();

	//show slideName (the name shown to users) in the little panel at the top of the page
	showSlideName();
	//show credits
	showCredits();
	
	//doesn't work: small screens but still many pixels
	if(hasSmallViewport()) {adaptDimensions();}
}

/*
 * shows credit info in credits area bottom left on slide
 */
function showCredits()
{
	if(data.credits.logo)
	{
		ref("creditSlideLogo").src= data.credits.logo;
		jQ("#creditSlideLogo").show();
	}
	if(data.credits.text)
	{
		jQ("#creditSlideText").html(data.credits.text);
	}	
	if(data.credits.url)
	{
		ref("creditLinkLogo").href = data.credits.url;
		ref("creditLinkText").href = data.credits.url;
	}
}

/*
 * shows slide description in the little panel at the top
 * Note: this is the name or short description the user sees as the slide name, not the slide name used in the code
 * 
 */
function showSlideName()
{
	if(slideData.title != undefined && ref("namePanel"))
	{
		ref("namePanel").innerHTML = slideData.title;
	}
	
}

//////////////////////////////////////////////////////////////////////
//
// HANDLE INPUT AND USER EVENTS
//
/////////////////////////////////////////////////////////////////////

/*
 * handles window resize
 * Exceptions for iPad to work around iframe on ipad problem:
 * http://dev.magnolia-cms.com/blog/2012/05/strategies-for-the-iframe-on-the-ipad-problem/
 */
function winsize()
{
	//used in keeping image at same center position when resizing
	var oldViewportWidth = viewportWidth;
	var oldViewportHeight = viewportHeight;

	var viewport 	= getViewportDimensions();
	viewportWidth  	= viewport.width;
	viewportHeight 	= viewport.height;

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
	//ih("WINSIZE: viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+"<br>");
}

/*
 * handles mousewheel
 */
function handle(delta) 
{ 
	zoomCenterOnCursor= true;
	delta = delta * (-settings.wheelZoomInDirection); 
	if (delta < 0)
	{
		if (settings.wheelmode==0) 
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
		if (settings.wheelmode==0) 
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

/*
 * handles actions after mousedown event
 */	
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
/*
 * handles actions after mouseup event
 */	
function handleMouseUp(event)
	{
	//ih("mouseUp<br>");
	clearZoomOutTimer(); //cancel autozoomout
	zoomCenterOnCursor= false;
	stopMove(event);
	}
	
/*
 * handles actions after doubleclick event
 */	
function handleDblClick(event)
	{

	//ih("dblclick ");
	clearZoomOutTimer(); //cancel autozoomout
	zoomCenterOnCursor= true;
	ZoomIn();
	}	

/*
 * handles actions after mousemove event
 * 
 */	
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
		if( (Math.abs(cursorX - lockedZoomCursorX) > settings.zoomCenterUnlockThreshold) || (Math.abs(cursorY - lockedZoomCursorY) > settings.zoomCenterUnlockThreshold) )
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
	var imgLeft = getInnerDivLeft();
	var imgTop = getInnerDivTop();
	//ih("imgLeft="+imgLeft+",imgTop="+imgTop);
	dragOffsetLeft= Math.round(imgLeft - dragStartLeft);
	dragOffsetTop= Math.round(imgTop - dragStartTop);
	dragging = true; return false;
	}

/*
 * Does all things needed when slide is dragged: moves slide and updates URL in URL bar
 * Also shows mouse coordinates in coordinates panel, if show coords is true
 *
 */
function processMove(event) 
{//ih("processmove ");
	if (!event){ event = window.event;}
	
	//is coordinatespanel is shown or Url is shown, the position should be represented there. Both situations are combined in now.monitorPosition for performance to reduce to a single 'if' in the most usual case (no monitoring) 
	if(now.monitorPosition)
	{
		//display current mouse coordinates in coordinates panel
		if (settings.showCoordinatesPanel)  
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
		if(now.isDisplayingUrl) 
		{
			parent.updateUrl();
		}
	}

	//move the image
	if (dragging) 
	{
		//ih("event.clientX="+event.clientX+", dragOffsetLeft="+dragOffsetLeft);
		setInnerDivLeft( event.clientX + dragOffsetLeft );
		setInnerDivTop(  event.clientY + dragOffsetTop  );
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
 * 01-04-2015 PG CHG upgraded division and multiplication number from 10000 to 100000 for greater accuracy in large slides 
 */
function getImgCoords(cursorX,cursorY)	
	{
	var imgCoords={};
	imgCoords.x = Math.round(((cursorX - getInnerDivLeft())/(imgWidthMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)))*100000))/100000;
	imgCoords.y = Math.round(((cursorY - getInnerDivTop())/(imgHeightMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)))*100000))/100000; //removed -16 subtraction in Brainmaps code
	return imgCoords;
	}

/*
 * converts a number of x pixels to a distance expressed in the image-fraction scale (0-1)
 * return proportional number (e.g. if the number of pixels entered was half the image's width at this zoom, the returned number = 0.5
 */
function getImgFractionDeltaX(deltaX)
{
	return Math.round((deltaX/(imgWidthMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)))*10000))/10000;
}

/*
 * converts a number of y pixels to a distance expressed in the image-fraction scale (0-1)
 * return proportional number (e.g. if the number of pixels entered was half the image's height at this zoom, the returned number = 0.5
 */
function getImgFractionDeltaY(deltaY)
{
	return Math.round((deltaY/(imgHeightMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)))*10000))/10000;
}

/*
 * gets the width and height sizes of the 'complete image' at the present zoom level (be it within or outside viewport) 
 * @return object {o.width,o.height} with dimensions in pixels (without "px" suffix)
 * Oeps appears to be superfluous there is already imgWidthPresentZoom and imgHeightPresentZoom
 */
function getCurrentImageSizes()
{
	var o={};
	o.width  = imgWidthMaxZoom /(Math.pow(2,gTierCount-1-now.zoom));
	o.height = imgHeightMaxZoom/(Math.pow(2,gTierCount-1-now.zoom));
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
//	imgCenter.x = Math.round( getInnerDivLeft() + imgWidthMaxZoom/  (2 * Math.pow(2,gTierCount-1-now.zoom) ) );
//	imgCenter.y = Math.round( getInnerDivTop()  + imgHeightMaxZoom/ (2 * Math.pow(2,gTierCount-1-now.zoom) ) );
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
{ //ih("in zoomin, zoom="+now.zoom);
	//ih(", gTierCount-1="+(gTierCount-1)+"<br>");
	
	if (now.zoom!=gTierCount-1)
	{
		var imgLeft = getInnerDivLeft(); 
		var imgTop = getInnerDivTop(); 
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
		
		now.zoom=now.zoom+1; 
		imgWidthPresentZoom= gTierWidth[now.zoom]; //shortcut
		imgHeightPresentZoom= gTierHeight[now.zoom]; //shortcut
		//ih("ZOOMIN to zoom: "+now.zoom+"<br>");

		//reposition the innerDiv that contains the image
		setInnerDivLeft( 2 * imgLeft - zoomCenterX);
		setInnerDivTop(  2 * imgTop  - zoomCenterY);
		
		//ih("AFTER: elem.innerDiv.style.left="+getInnerDivLeft()+", elem.innerDiv.style.top="+getInnerDivTop())		
		
		//remove present tiles
		deleteTiles();
		
		//load with new tiles
		checkTiles();
		
		//reposition and resize labels
		repositionAndResizeLabels()

		resizeBackgroundDiv();	
		keepInViewport();
		updateLengthBar();	
		moveViewIndicator();
		//lowZoomHideLabels();
		
		if(now.isDisplayingUrl) {parent.updateUrl();}
		//ih("ZOOMIN done<br>")
	}	
}


function ZoomOut() 
{ 
	if (now.zoom!=0)
	{
		var imgLeft = getInnerDivLeft(); 
		var imgTop = getInnerDivTop(); 
	
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

		now.zoom=now.zoom-1; 
		imgWidthPresentZoom= gTierWidth[now.zoom]; // shortcut
		imgHeightPresentZoom= gTierHeight[now.zoom]; // shortcut
		//ih("ZOOMOUT to zoom: "+now.zoom+"<br>");

		//reposition the innerDiv that contains the image
		setInnerDivLeft( 0.5 * imgLeft + 0.5 * zoomCenterX );
		setInnerDivTop(  0.5 * imgTop  + 0.5 * zoomCenterY );

		//ih("zoomCenterX="+zoomCenterX+", zoomCenterY="+zoomCenterY+"<br>")
		
		
		//remove present tiles
		deleteTiles();
				
		//load with new tiles
		checkTiles(); 
		
		//reposition and resize labels
		repositionAndResizeLabels()
		
		resizeBackgroundDiv(); 
		keepInViewport(); 
		updateLengthBar(); 
		moveViewIndicator();
		// lowZoomHideLabels();
		
		if(now.isDisplayingUrl) {parent.updateUrl();}
		//ih("ZOOMOUT done<br>")
	}
}


/*
 * NOT used anymore, not neccessary anymore works well now.
 * hide labels at low zoom, because then the labels appear to be offset, probably due to Zoomify inaccuracies at high size reductions (=low zoom)
 */
function lowZoomHideLabels()
	{if(now.zoom<=1) {elem.imageLabels.style.display="none";}
	else {elem.imageLabels.style.display="block";}
	}
	
/*
 * Does the auto zoomout when the mouse is held down
 */
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
	else if(now.zoom>0)
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

/*
 * shows changing tips on zoom in button (magnifier + button) about different ways to zoom in
 */	
function showZoomInTips()	
	{if(!mobile)
		{if(!zoomInTipsShown) {autoShowZoomInTips();}
		else {tipTimer=setTimeout("autoShowZoomInTips()",3000);} //start showing tips after delay
		}	
	}
	
/*
 * shows changing tips on zoom out button (magnifier - button) about different ways to zoom out
 */	
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
	{
	tips.style.display="none";
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
/*
function setInnerDiv(virtualPositionLeft,virtualPositionTop)
{
	var DOMPositionLeft = virtualPositionLeft % tileSize;
	var DOMPositionTop = virtualPositionTop % tileSize;
	innerDivOffsetLeft = virtualPositionLeft - DOMPositionLeft;
	innerDivOffsetTop = virtualPositionTop - DOMPositionTop;
	
	elem.innerDiv.style.left  = DOMPositionLeft  + "px";
	elem.innerDiv.style.top   = DOMPositionTop  + "px";
	elem.newLabels.style.left = DOMPositionLeft  + "px";
	elem.newLabels.style.top  = DOMPositionTop  + "px";
}
*/

/*
 * repositions innerDiv, the large main div that holds and positions the image tiles, and newLabels div that holds and positions the newLabels
 * Div newlabels is a separate div because it needs to be outside outerDiv, hence it needs separate repositioning  
 */
function setInnerDivLeft(virtualPositionLeft)
{
	
	//for iOs: to prevent greying out at large zoom levels (probably due to performance limits) keep the innerDiv small (max 1 tile outside screen) and reposition the tiles on the cut innerDiv. 
	if(isiOs )
	{
		var oldInnerDivOffsetLeft = innerDivOffsetLeft;

		if(virtualPositionLeft < 0)
		{
			DOMPositionLeft = virtualPositionLeft % tileSize;
			innerDivOffsetLeft = virtualPositionLeft - DOMPositionLeft;
			currentInnerDivWidth = gTierWidth[now.zoom] + innerDivOffsetLeft; //used to cut off grey bgDiv, innerDivOffsetLeft is usually a negative number
		}
		else
		{
			DOMPositionLeft = virtualPositionLeft;
			innerDivOffsetLeft = 0;
			currentInnerDivWidth = gTierWidth[now.zoom]
		}
		//if a modulo jump was made, reposition the tiles and the labels on the innerDiv
		if (oldInnerDivOffsetLeft != innerDivOffsetLeft)
		{
			repositionContentInnerDiv();
		}
	}
	else
	{
		DOMPositionLeft = virtualPositionLeft;
		innerDivOffsetLeft = 0;
		currentInnerDivWidth = gTierWidth[now.zoom];
	}

	
	elem.innerDiv.style.left  = DOMPositionLeft  + "px";
	elem.newLabels.style.left = DOMPositionLeft  + "px";

	//debug
	//var setLeft = jQ("#innerDiv").css("left");
	//jQ("#log").html("vLeft="+virtualPositionLeft+",DOMLeft="+DOMPositionLeft+",setLeft="+setLeft+",offsetLeft="+innerDivOffsetLeft+",offsetTop="+innerDivOffsetTop);
}

function setInnerDivTop(virtualPositionTop)
{

	//for iOs: to prevent greying out at large zoom levels (probably due to performance limits) keep the innerDiv small (max 1 tile outside screen) and reposition the tiles on the cut innerDiv. 
	if(isiOs)
	{
		var oldInnerDivOffsetTop = innerDivOffsetTop;

		if(virtualPositionTop < 0)
		{
			DOMPositionTop = virtualPositionTop % tileSize;
			innerDivOffsetTop = virtualPositionTop - DOMPositionTop;
			currentInnerDivHeight = gTierHeight[now.zoom] + innerDivOffsetTop; //used to cut off grey bgDiv, innerDivOffsetTop is usually a negative number
		}
		else
		{
			DOMPositionTop = virtualPositionTop;
			innerDivOffsetTop = 0;
			currentInnerDivHeight = gTierHeight[now.zoom];	
		}
		//if a modulo jump was made, reposition the tiles and the labels on the innerDiv
		if (oldInnerDivOffsetTop != innerDivOffsetTop)
		{
			repositionContentInnerDiv();
		}
	}
	else
	{
		DOMPositionTop = virtualPositionTop;
		innerDivOffsetTop = 0;
		currentInnerDivHeight = gTierHeight[now.zoom];
	}

	//jQ("#log").html("vTop="+virtualPositionTop+",DOMTop="+DOMPositionTop+",offsetLeft="+innerDivOffsetLeft+",offsetTop="+innerDivOffsetTop);
	
	elem.innerDiv.style.top   = DOMPositionTop  + "px";
	elem.newLabels.style.top  = DOMPositionTop  + "px";
}

function getInnerDivLeft()
{
	//alert(elem.innerDiv.style.left)
	//alert(innerDivOffsetLeft)
	
	return stripPx(elem.innerDiv.style.left) + innerDivOffsetLeft;
}

function getInnerDivTop()
{
	return stripPx(elem.innerDiv.style.top) + innerDivOffsetTop;
}

/*
 * Sets the innerDiv that contains the image, so that the passed x and y coords are in the center of the viewPort
 * @param number xcoord ; fraction of the image's width  = number between 0 and 1
 * @param number ycoord ; fraction of the image's height = number between 0 and 1
 */
function centerOn(xcoord,ycoord)
{
	setInnerDivLeft( viewportWidth /2 - xcoord*imgWidthMaxZoom /(Math.pow(2,gTierCount-1-now.zoom)) );
	setInnerDivTop(  viewportHeight/2 - ycoord*imgHeightMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)) );
}

/*
 * Centers the innerDiv that contains the image, in the middle of the viewport
 */
function centerMap()
{//ih("in centerMap1");
	if(dimensionsKnown())
	{
		setInnerDivLeft( viewportWidth /2 - imgWidthPresentZoom /2 );
		setInnerDivTop(  viewportHeight/2 - imgHeightPresentZoom/2 );
		
		//ih("in centerMap2");
		//alert( "centerMap: imgWidthMaxZoom="+imgWidthMaxZoom+", gTierCount="+gTierCount+", viewportWidth="+viewportWidth+", elem.innerDiv="+elem.innerDiv+", elem.innerDiv.style="+elem.innerDiv.style+", elem.innerDiv.style.left="+getInnerDivLeft())
	}	
	else 
	{//ih("dimensionsUnknown");
	}	
}

/*
 * Keeps the innerDiv that contains the image within the viewPort upon attempt to drag it out viewPort
 */
function keepInViewport()
	{
	//safety factor, keep minimally this amount of pixels of image in view
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
	if (gTierWidth[now.zoom] > viewportWidth) 
		{if (imgLeft > 0)
			{imgLeft = innerStyle.left = 0; corrected = true;} //correct left side margin inside viewport
		if ( (imgLeft + gTierWidth[now.zoom]) < viewportWidth )	
			{innerStyle.left = viewportWidth - gTierWidth[now.zoom]; corrected=true;} //correct right side margin inside viewport
		}
	else
		{if (imgLeft < 0)
			{imgLeft = innerStyle.left = 0; corrected = true;}//correct left side outside viewport
		if ((imgLeft + gTierWidth[now.zoom]) > viewportWidth )		
			{innerStyle.left = viewportWidth - gTierWidth[now.zoom]; corrected=true;} //correct right side outside viewport
		}	
	if (gTierHeight[now.zoom] > viewportHeight) 
		{if (imgTop > 0)
			{imgTop = innerStyle.top = 0; corrected = true;} //correct top side margin inside viewport
		if ( (imgTop + gTierHeight[now.zoom]) < viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[now.zoom]; corrected = true;} //correct bottom margin inside viewport
		}
	else
		{if (imgTop < 0)
			{imgTop = innerStyle.top = 0; corrected = true;} //correct top outside viewport
		if ((imgTop + gTierHeight[now.zoom]) > viewportHeight )
			{innerStyle.top = viewportHeight - gTierHeight[now.zoom]; corrected = true;} //correct bottom outside viewport
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
 */
function resizeBackgroundDiv()
{
	elem.bgDiv.style.width = currentInnerDivWidth + "px";
	elem.bgDiv.style.height = currentInnerDivHeight + "px";	
}


//////////////////////////////////////////////////////////////////////
//
// LOADING TILES
//
/////////////////////////////////////////////////////////////////////

var nrImagesLoaded=0;
var nrDivImagesLoaded=0;

/*
 * Loads the images!
 */
function checkTiles() 
{
	// ih("CHECKTILES()");// called by: "+checkTiles.caller+"<br>");

	if (!dimensionsKnown()) {return;}
	
	var visibleTiles = getVisibleTiles(); //is all rows and cols within viewPort
	visibleTilesMap = {}; //empty the global, is used outside this function in repositionContentInnerDiv()
	
	for (i = 0; i < visibleTiles.length; i++)  // each entry is a location in viewport tht could have a tile, contains an array [x,y],number of tiles that would fit in the viewport
	{ 
		var tileArray = visibleTiles[i]; // for this tile
		
		// ih("imgWidthMaxZoom="+
		// (imgWidthMaxZoom/(Math.pow(2,gTierCount-1-now.zoom)))
		// +"viewportWidth="+viewportWidth+"<br>");
		pCol=tileArray[0]; 
		pRow=tileArray[1]; 
		// ih("pCol="+pCol+", pRow="+pRow+"<br>"); //at the smaller zoom levels
		// there are far more pCol and pRow than actually called (and available)
		// pictures
		// ih("HANDLING= "+"TileGroup" + _tileGroupNum + " /Zoom: " + now.zoom + ", pCol: " + pCol + ", pRow: " + pRow + "<br>");

		//if row and col are within the image..
		if (pCol<gTileCountWidth[now.zoom] && pRow<gTileCountHeight[now.zoom])
		{		
			// determine tilegroupnum, each tilegroup contains 256 images, theoffset is sequential num of img
			tier=now.zoom; 
			var theOffset=parseFloat(pRow*gTileCountWidth[tier]+pCol); // is this parseFloat doing sthing?
			for (var theTier=0; theTier<tier; theTier++) theOffset += gTileCountWidth[theTier]*gTileCountHeight[theTier]; 
			_tileGroupNum=Math.floor(theOffset/256.0); 

			var tileName =  now.zoom + "-" + pCol + "-" + pRow + ".jpg";
			var tilePath = "TileGroup" + _tileGroupNum + "/" + tileName;
			
			//ih("TILEPATH CREATED:"+tilePath+"</br>");
			var img = document.getElementById(tileName); 
	
			if (!img ) 
			{
				//on iOs load the image as a backgroundimage in a div instead of a regular image as workaround for the image limit on iOs
				//http://stackoverflow.com/questions/2986039/ipad-iphone-browser-crashing-when-loading-images-in-javascript
				if(isiOs)
				{
					img = document.createElement("div");
					//img.style.backgroundImage = "url(" + imgPath + tileName + ")";
					img.style.background = "transparent url(" + imgPath + tilePath + ") no-repeat";
					img.style.width = tileSize +"px";
					img.style.height = tileSize +"px";
					nrDivImagesLoaded++;
				}
				else
				{
					img = document.createElement("img"); 
					img.src = imgPath + tilePath; 
					nrImagesLoaded++;
				}
				
				jQ("#test").html(nrImagesLoaded +","+nrDivImagesLoaded);
				//jQ("#log").html("Loading: "+tileName+", No.Img:"+nrImagesLoaded+", No.DivImg:"+nrDivImagesLoaded+" </br> src= " + imgPath + tileName);
				img.style.position = "absolute"; 
				img.style.left = ((pCol * tileSize) + innerDivOffsetLeft) + "px"; 
				img.style.top =  ((pRow * tileSize) + innerDivOffsetTop) +"px"
				img.style.zIndex = 0; 
				img.setAttribute("id", tileName); 
				elem.imageTiles.appendChild(img);
	
			}
			//store the col and row for fast retrieval in repositionContentInnerDiv
			visibleTilesMap[tileName] = [pCol,pRow]; 
			//ih("imgLeft ="+ img.style.left);
		}


	}
		
	if(isiOs)
	{
		var imgs = elem.imageTiles.getElementsByTagName("div"); 
	}
	else
	{
		var imgs = elem.imageTiles.getElementsByTagName("img"); 
	}
	for (i = 0; i < imgs.length; i++) 
	{ 
		var id = imgs[i].getAttribute("id"); 
		if (!visibleTilesMap[id]) 
		{ 
			elem.imageTiles.removeChild(imgs[i]); i--;
		}
	}
	
	//ZoomSvg();
}


	
function deleteTiles()
{
	if(isiOs)
	{
		jQ(elem.imageTiles).children("div").remove();
	}
	else
	{
		jQ(elem.imageTiles).children("img").remove();
	}
	
}
		
function getVisibleTiles() 
	{
	var mapX = getInnerDivLeft(); //whole image position rel to top left of viewport
	var mapY = getInnerDivTop();
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

/*
function positionTileOnInnerDiv(img,pCol,pRow)
{
	img.style.left = ((pCol * tileSize) + innerDivOffsetLeft) + "px"; 
	img.style.top =  ((pRow * tileSize) + innerDivOffsetTop) +"px"
}
*/

/*
 * repositions the tiles and labels in innerDiv when innerDiv has been cut off when it came further than 1 tileSize left/top outside viewport
 */
function repositionContentInnerDiv()
{
	//reposition the tiles
	jQ(elem.imageTiles).children("img,div").each(function(){
		var tileName = jQ(this).attr("id");
		var pCol = visibleTilesMap[tileName][0];
		var pRow = visibleTilesMap[tileName][1];
	
		//debug(visibleTilesMap)
			//BUSY HERE -- ONLY WORKS PARTIALLY STILL - LEFT works, TOP not yet, also labels to be done
		var l= (pCol * tileSize) + innerDivOffsetLeft;
		var t= (pRow * tileSize) + innerDivOffsetTop;
		//ih("tileName="+tileName+",pCol="+pCol+",pRow="+pRow+"innerDivOffsetLeft="+innerDivOffsetLeft+",innerDivOffsetTop="+innerDivOffsetTop+",l="+l+",t="+t+"<br>");
		jQ(this).css({"left":((pCol * tileSize) + innerDivOffsetLeft) + "px", "top":((pRow * tileSize) + innerDivOffsetTop) +"px"})
	});
	//cut off grey bg if needed
	resizeBackgroundDiv();
	//also
	repositionLabels();
	
}
	
//////////////////////////////////////////////////////////////////////
//
// THUMB
//
/////////////////////////////////////////////////////////////////////

/*
 * Creates and shows the thumbnail iamge with the viewindicator
 */
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
	if(isTouchDevice)
	{
		elem.viewIndicatorSenser.ontouchstart = startTouchThumbMove; 
		elem.thumbContainer.ontouchmove = processTouchThumbMove; 
		elem.thumbContainer.ontouchend = stopTouchThumb;
	}
	else //not touchdevice
	{
		elem.viewIndicatorSenser.onmousedown = startMouseThumbMove; 
		elem.thumbContainer.onmousemove = processMouseThumbMove; 
		elem.thumbContainer.onmouseup = stopMouseThumb; 
	}
	elem.viewIndicatorSenser.ondragstart = function() {return false;}	
	elem.thumbContainer.ondragstart = function() { return false;}
}

function hideThumb(){ ref('elem.thumbImageHolder').style.display="none";}

function getViewIndicatorPosition(event)
{
	var o ={};
	o.x = stripPx(elem.viewIndicator.style.left); 
	o.y = stripPx(elem.viewIndicator.style.top); 
	return o;
}

/*
 * handles mouse move of viewindicator
 */
function startMouseThumbMove(event)
{
	if (!event){ event = window.event;}
	var viewIndicatorPos = getViewIndicatorPosition(event);
	viewIndicatorDragOffsetLeft = viewIndicatorPos.x - event.clientX;
	viewIndicatorDragOffsetTop = viewIndicatorPos.y - event.clientY;
	thumbDragging = true; 
	return false;
}

/*
 * handles touch move of view indicator
 * Note: uses direct event.touches for performance, to prevent flipping out on touch devices that are less powerful than desktops
 */
function startTouchThumbMove(event)
{
	if (event.touches.length == 1) 
	{
		var viewIndicatorPos = getViewIndicatorPosition(event);
		viewIndicatorDragOffsetLeft = viewIndicatorPos.x - event.touches[0].clientX;
		viewIndicatorDragOffsetTop = viewIndicatorPos.y - event.touches[0].clientY;
		thumbTouchIdentifier = event.touches[0].identifier;
		thumbDragging = true; 
	}
	return false;
}

/*
 * Moves the viewindicator (cyan rectangle on thumb) when dragging it by mouse
 * Note: for performance: does not move viewIndicatorSenser (the senser), but only in the final stopThumb. viewIndicatorSenser is not needed here as movement is sensed on the thumbContainer 
 *  
 */
function processMouseThumbMove(event)
{ 
	if (thumbDragging) 
	{
		if (!event){ event = window.event;}
		elem.viewIndicator.style.left  = event.clientX + viewIndicatorDragOffsetLeft + "px"; 
		elem.viewIndicator.style.top   = event.clientY + viewIndicatorDragOffsetTop  + "px"; 
	}
}

/*
 * Moves the viewindicator (cyan rectangle on thumb) when dragging it by touch
 * Notes: for performance, to prevent flipping out on touch devices that are less powerful than desktops:
 * 1: uses direct event.changedTouches 
 * 2: does not move viewIndicatorSenser, but only in the final stopThumb. viewIndicatorSenser is not needed here as movement is sensed on the thumbContainer 
 */
function processTouchThumbMove(event) 
{
	if (thumbDragging && event.changedTouches.length == 1 && (thumbTouchIdentifier == event.changedTouches[0].identifier) ) 
	{
		elem.viewIndicator.style.left  = event.changedTouches[0].clientX + viewIndicatorDragOffsetLeft + "px"; 
		elem.viewIndicator.style.top   = event.changedTouches[0].clientY + viewIndicatorDragOffsetTop  + "px"; 
	}
	event.preventDefault();
}

function stopMouseThumb(event)
{
	if (!event){ event = window.event;};
	var eventX = event.clientX;
	var eventY = event.clientY;
	stopThumb(eventX,eventY);
}

function stopTouchThumb(event)
{
	event.preventDefault();
	var eventX = event.changedTouches[0].clientX;
	var eventY = event.changedTouches[0].clientY;
	stopThumb(eventX,eventY);
}

/*
 * handles both end of drag viewIndicator and random click positioning on thumb
 * repositions the slide to the new position
 * repositions viewIndicator and viewindicatorsenser (cyan rectangle on thumb) to the new position (needed when clicked or tapped on thumb)
 */
function stopThumb(eventX,eventY)
{
	if (eventX)
	{
		var fractionLR, fractionTB; 		
				
		//end of thumbdragging
		if(thumbDragging)
			{
			thumbDragging = false;		
			fractionLR = (eventX + viewIndicatorDragOffsetLeft + viewIndicatorWidth/2 ) / thumbContainerWidth; 
			fractionTB = (eventY + viewIndicatorDragOffsetTop + viewIndicatorHeight/ 2 ) / thumbContainerHeight; 	
			//update position viewIndicator
			elem.viewIndicator.style.left  = elem.viewIndicatorSenser.style.left = eventX + viewIndicatorDragOffsetLeft + "px"; 
			elem.viewIndicator.style.top   = elem.viewIndicatorSenser.style.top  = eventY + viewIndicatorDragOffsetTop  + "px"; 
			}
		//click on thumbContainer without thumbdragging
		else 
			{
			var controlsContPos= getElemPos(elem.controlsContainer);
			var thumbContPos= getElemPos(elem.thumbContainer);

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
		setInnerDivLeft( (viewportWidth/2  - gTierWidth[now.zoom]  * fractionLR) ) ;
		setInnerDivTop(  (viewportHeight/2 - gTierHeight[now.zoom] * fractionTB) );
		keepInViewport();
		checkTiles();
		
		if(now.isDisplayingUrl) {parent.updateUrl();}
	}
}


/*
 * resizes and positions viewIndicator and viewIndicatorSenser, viewIndicator in fact indicates screen (viewport) size in relation to shown image
 */
function moveViewIndicator()
	{
	//ih("moveViewIndicator()"+moveViewIndicator.caller);
	var innerDivLeft = getInnerDivLeft();
	var innerDivTop  = getInnerDivTop();
	viewIndicatorWidth  = viewportWidth/Math.pow(2,now.zoom);
	viewIndicatorHeight = viewportHeight/Math.pow(2,now.zoom); 

	elem.viewIndicator.style.left   = elem.viewIndicatorSenser.style.left   =  -innerDivLeft/(Math.pow(2,now.zoom)) +"px"; 
	elem.viewIndicator.style.top    = elem.viewIndicatorSenser.style.top    =  -innerDivTop/(Math.pow(2,now.zoom))  +"px";
	elem.viewIndicator.style.width  = elem.viewIndicatorSenser.style.width  =  viewIndicatorWidth + "px";
	elem.viewIndicator.style.height = elem.viewIndicatorSenser.style.height =  viewIndicatorHeight + "px";

//ih("Math.pow(2,now.zoom)="+Math.pow(2,now.zoom)+", viewportWidth="+viewportWidth+", viewportHeight="+viewportHeight+", viewIndicator.style.width="+viewIndicator.style.width+", viewIndicator.style.height="+viewIndicator.style.height+", innerDivLeft="+innerDivLeft+", innerDivTop="+innerDivTop+", viewIndicator.style.left="+viewIndicator.style.left+", viewIndicator.style.top="+viewIndicator.style.top+"<br>");
	}

	






//////////////////////////////////////////////////////////////////////
//
// SCALE INDICATOR BAR
//
/////////////////////////////////////////////////////////////////////


function updateLengthBar() 
{
	//settings.res = um/px
	//you want a bar between 50 and 125px long
	var um50 = Math.pow(2,gTierCount-1-now.zoom)*settings.res*50; // micrometers equiv. with 50 px
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
	var resunits ="";
	if 		(pow10  < 1000) 	{resunits= "&micro;m";}
	else if (pow10 == 1000) 	{resunits= "mm"; barUm = (barUm / 1000);}
	else if (pow10 >= 10000)	{resunits= "cm"; barUm = (barUm / 10000);}
	
	// display bar-length
	var txt= barUm + "  " + resunits + "<br />zoom level: " + now.zoom + "/" + (gTierCount-1);
	ref('theScale1').innerHTML = ref('theScale2').innerHTML = txt; //if <=IE9 out of market can be replaced by: ref('theScale').innerHTML = txt; (<=IE9 doesn't support text=shadow)

}






////////////////////////////////////////////
//
// LABELS 
//
///////////////////////////////////////////

/*
 * Creates and displays the fixed labels (ie not the 'new' labels in edit label mode)
 */	
function renderLabels() 
{
	if(!dimensionsKnown()) 
	{clearTimeout(labelTimer);	
	labelTimer=setTimeout("renderLabels()", 500); 
	return;
	}	
	
	//prevent duplicate creation. Because checkLabelsLoaded(), and thus renderLabels() may be called by a timeOut() @todo: check if this safety measure is still needed now we not load from labels.js anymore  	
	if(now.renderingLabels)
		{return;}
	//set switch: busy!
	now.renderingLabels = true;	
	//ih("renderLabels1");

	//remove any old labels and reset counter and now status
	jQ(elem.imageLabels).empty();
	now.labelsRendered = false;
	
	//ih("renderLabels2");
	//debug(data.labels);
	
	//create labels
	for (labelId in data.labels)
	{
		var labelData = data.labels[labelId];
		createLabelInDom(labelData);		
	}
	//attaches handlers to labels that shows the tooltips
	initTooltips();
	//neccessary because the page may be initialized via a deep link directly at a certain zoom level
	repositionAndResizeLabels();
	//possibly focus on a specific label
	focusOnLabel();
	//set global booleans
	now.renderingLabels = false;
	now.labelsRendered = true;
}


/*
 * Creates a labelData object in data.labels and creates the label in the DOM
 * @param object labelData [optional] like so: {"id":...,"x":...,"y":...,"label":...,"tooltip":...}
 */
function createLabel(labelData)
{
	var labelData = createLabelObject(labelData);
	createLabelInDom(labelData);
}

/*
 * Creates a labelData object for a fixed Label and stores it in data.labels
 * @param object labelData - EITHER: was read from the URL via extractLabelData, OR is from a existing new label, that is to be converted to a (fixed) label
 * @return object labelData
 */
function createLabelObject(labelData)
{
	//Create data object for the label 
	var localLabelData = {"id":null,"x":null,"y":null,"label":"","tooltip":""}; 
	
	/* The index will be the highest ever used labelindex plus 1. Also update data.highestUsedLabelIndex 
	 * Note: the number of labels is not a good measure as labels may have been removed, ie:
	 * STEP1: 3 labels: L0, L1, L2
	 * STEP2: make L0 and L1 editable: now data.labels has L2 and data.newLabels has NL0 and NL1
	 * STEP3: fix label NL0: Now data.labels has length = 1. But you dont want the fixed labels to be positioned on 1 plus 1 = 2 (L2). That would overwrite L2
	 * So you need the highest ever used number. Then id of the created label becomes: highest number + 1
	 */
	var index 					= (data.highestUsedLabelIndex == null)? 0 : data.highestUsedLabelIndex + 1
	localLabelData.id 			= "L" + index;
	data.highestUsedLabelIndex 	= index; 
//	debug("New highest labelId:" +localLabelData.id);
	
	//copy the rest of the labelData
	localLabelData.x 			= 	labelData.x;
	localLabelData.y 			= 	labelData.y;
	localLabelData.label		= 	labelData.label;
	localLabelData.tooltip		= 	labelData.tooltip;

	//store the label in the global store, use the id as key
	data.labels[localLabelData.id] = localLabelData;
	//and return it
	return localLabelData;
}


/*
 * Creates a label in DOM from the given object labelData and appends the label into div imageLabels
 * @param object labelData e.g. {"id": "L0", "label": "Source", "info": "Source: National Library of Medicine", "href": "http://images.nlm.nih.gov/pathlab9", "x": "0.038", "y": "0.0"}
 * @return nothing
 */
function createLabelInDom(labelData)
{
	//debug(labelData);
	if(!isSet(labelData))
		{
			return;
		}
	
	//ih("Creating:"+labelData.label+",="+labelData.id+"<br>");
	
	var labelId = labelData.id;
	//label itself
	var labelHtml= "";
	labelHtml+= '<div id="' + labelId + '" class="labelContainer" className="labelContainer">';
	var classHasTooltip = (labelData.tooltip != "")? " hastooltip" : "";
	labelHtml+= '<div id="' + labelId + 'Text" class="label' + classHasTooltip + '" className="label' + classHasTooltip + '"></div>';
	//tooltip
	labelHtml+= (labelData.tooltip != "")? '<div id="' + labelId + 'Tooltip" class="tooltip" className="tooltip"></div>' : "";
	//Edit button
	var classHidden = (now.labelMode == "fixed")? " invisible" : "";
	labelHtml+= '<img id="' + labelId + 'Edit" class="labelEditButton' + classHidden + ' hastooltip" classname="labelEditButton' + classHidden + ' hastooltip" src="../img/edit.png">';
	labelHtml+= '<div class="tooltip">Edit this label.</div>';
	labelHtml+= '</div>';
	jQ("#imageLabels").append(labelHtml);
		
	//Add the text of the label in a xss safe way (note: this text may be user inserted from the URL!)
	var labelText = labelData.label;
	labelText = ( isSet(labelData.href) )? '<a href="' + labelData.href + '" target="_blank">' + labelText + '</a>' : labelText ;	
	ref(labelId+"Text").innerHTML = labelText;

	//Add the text of the tooltip in a xss safe way (note: this text may be user inserted from the URL!)
	if(labelData.tooltip != "")
	{		
		jQ("#"+labelId+"Tooltip").append( jQ.parseHTML(labelData.tooltip) );
	}

	jQ("#"+labelId + "Edit").click(function(event){makeLabelEditable(labelId)});

	//position the label
	repositionAndResizeLabels();
	initTooltips();
}

/*
 * Calculates the position of the label, dependent on the present zoom and the offset (the amount cut off from innerDiv for iPad performance
 * @param object labelData - this should contain properties x and y with the locations of the label (in fractions of the image)
 * @return object {o.x,o.y} holding x and y positions in pixels in relation to the div that contains the labels (without "px")
 */
function calculateLabelPosition(labelData)
{
	var o = {};
	o.x = (labelData.x * imgWidthMaxZoom /(Math.pow(2,gTierCount-1-now.zoom))) + innerDivOffsetLeft; 
	o.y = (labelData.y * imgHeightMaxZoom/(Math.pow(2,gTierCount-1-now.zoom))) + innerDivOffsetTop; 
	return o;	
}


/*
 * positions a label (or a new label)
 */
function positionLabel(labelData)
{
	
	var labelId  = labelData.id;
	var labelPos = calculateLabelPosition(labelData);
	jQ("#"+labelId).css({"left": labelPos.x + "px", "top": (labelPos.y + settings.labelOffsetHeight) + "px"});
/*	if( labelId=="NL0")
	{
		var fontSize= jQ("#NLTextArea0").css("font-size");
		var lineHeight= jQ("#NLTextArea0").css("line-height");
		var str="Positioning. Stored position left: "+labelData.x+"FR, top: "+labelData.y+"FR<br>"
		str+="font-size: "+fontSize+", line-height: "+lineHeight+", labelOffsetHeight: "+ settings.labelOffsetHeight+"px<br>";
		str+="Container set to left: "+labelPos.x+"px, top: "+(labelPos.y + settings.labelOffsetHeight)+"px<br>";;
		//ih(str);	

		
		//ih("<br>Position "+labelId+" to: left="+labelPos.x+"px ["+labelData.x+"FR], top="+labelPos.y+ settings.labelOffsetHeight+"px, ["+labelData.y+"FR]<br />");
	}
*/	
}

function repositionAndResizeLabels()
{
	//first resize as that resizes font-size > line-height > labelOffsetHeight (and that is used in positioning label)
	resizeLabels(); 
	repositionLabels();
}

/*
 * repositions (after zoom) labels and newlabels
 */
function repositionLabels()
{
	for(thisLabel in data.labels)
	{
		positionLabel(data.labels[thisLabel]);
	}
	for(thisNewLabel in data.newLabels)
	{
		positionLabel(data.newLabels[thisNewLabel]);
	}	
}

/*
 * resize labels at zooming
 * 
 */
function resizeLabels() 
{	
	var sizeFactor  = parseFloat( (now.zoom/(gTierCount-1)) * 3 );
	var sizeProcent = (sizeFactor * 100) + "%";  //100pct	
	var labelWidth  = (sizeFactor * settings.originalLabelWidth);
	var newLabelMagnFactor = (now.zoom <= 2)? 2 : 1;
	var newLabelCorrFactor = (newLabelMagnFactor == 1)? -8 : 0; //subtract 2x padding to get it appear just as wide as the newLabelTextArea that has no padding
	var newLabelTooltipWidth = ( newLabelMagnFactor *(sizeFactor * settings.originalLabelWidth) + newLabelCorrFactor ); //let the tooltip be twice as wide as the label

	//ih("sizeFactor="+sizeFactor+"<br>settings.originalLabelWidth="+settings.originalLabelWidth + "<br>labelWidth="+ labelWidth);
	
	//adapt font-size and max-width of fixed labels 
	//1st note OBSOLETE - all label widths now determined from the single width in class .label, but just keep for moment 
	//Note 1: XXX this doesn't set width on newlabeltextareas despite they have class .label, as width is overruled by class .newlabeltextarea declared later in css
	//Note 2: used max-width instead of width so that the actual width (esp. the width that triggers the tooltip!) is the width of the visual text, but the text will still wrap at the same width as the newLabel
	jQ(".label").css({'fontSize':sizeProcent,"max-width": labelWidth + "px"});	
	//solve text wrap problem
	jQ(".labelContainer").css({"width": labelWidth + "px"}); // to let the contained div .label expand. Else it wraps at each word and doesn't use the allowed max-width
	jQ(".label").not(".newLabelTextArea").css({"position": "absolute"}); //to let it shrink-wrap on the contained text. Else the full max-width will trigger the hover. But dont apply on text-area in new label.
	
	setLabelOffsetHeight();
	positionCrossHairs();
	positionNewLabelCloseButtons(labelWidth);
	
	//adapt width of newLabels
	jQ(".newLabelTextArea").css({"width": labelWidth + "px"});
	jQ(".newLabelTooltip").css({"width": newLabelTooltipWidth + "px"});	
	
	//also activate autosize-resizing of the newlabeltextbox, to accomodate for the changed font-size 
	//Note: doesn't seem to work when calling it by class, so call it by the textarea's id's: http://www.jacklmoore.com/autosize#comment-1324
	var newLabelId, nrNewLabels = getObjectLength(data.newLabels); 
	for(thisLabel in data.newLabels)
	{
		newLabelId = data.newLabels[thisLabel].id;
		jQ("#"+newLabelId+"TextArea").trigger('autosize');
	}
}

/*
 * get the current font-size of the labels as generated by the user agent, is read from the hiddenLabel
 * @return floating number - font-size 
 */
function getUserAgentLabelFontSize()
{
	return parseFloat(stripPx(jQ("#hiddenLabel").css("font-size"))); 
}

/*
 * get the current width of the labels as generated by the user agent, is read from the hiddenLabel
 * @return floating number - width
 */
function getUserAgentLabelWidth()
{
	return parseFloat(stripPx(jQ("#hiddenLabel").css("width"))); //is read from the hiddenLabel
}


/*
 * Sets the amount of pixels that label is shown higher/lower related to the exact spot on the picture where it is placed 
 * to allow the text (with a certain height) to stand exactly next to the spot
 */
function setLabelOffsetHeight()
{
	var uaFontSize = getUserAgentLabelFontSize(); 
	var labelLineHeight= uaFontSize * 1.2; // 1.2 = average multiplication factor see CSS Definitive Guide Eric Meyer 3rd ed, p135
	settings.labelOffsetHeight = - (labelLineHeight/2);
	//ih("LabelLineHeight="+labelLineHeight + ", SET labelOffsetHeight= "+ settings.labelOffsetHeight+"<br>");
}


/*
 * Positions the slide with the specified label shown in the middle of the viewport. If called 'focus=labelname' in URL-query
 * @TODO: check if this still functions
 */
function focusOnLabel()
{
	if(settings.focusLabel)
	{
		//alert("focussing on "+settings.focusLabel)
		var x = data.labels[settings.focusLabel].x
		var y = data.labels[settings.focusLabel].y;
		centerOn(x,y);
		//alert("centered on x="+x+", y="+y)
	}
}


//////////////////////////////////////////////////////////////////////////////
//
// EDIT OR ADD LABELS
//
//////////////////////////////////////////////////////////////////////////////
/*
 * INFO: New label is the same as a label in edit mode. 'New label' and 'label in edit mode' are used interchangeably.
 * Upon setting a label from a fixed label to edit mode (click on pencil icon), the fixed label is deleted and a new label with the content of the fixed label is created.
 * When a new label is fixed (click on green checkmark on new label), the new/edit label is deleted and a fixed label with the content of the new/edit label is created.
 */

/*
 * Creates a newLabelData object in data.newLabels and creates the newlabel in the DOM
 * Can be called by surrounding page: user request to make new label. Then labelData is not given. The new label will be positioned at mid viewport
 * Or, can be called by setLabelsToEditMode. Then labelData of an existing (fixed) label is given. The fixed label is going to be converted to a (editable) new label 
 * @param object labelData [optional] like so: {"id":...,"x":...,"y":...,"label":...,"tooltip":...}
 */
function createNewLabel(labelData)
{
	var newLabelData = createNewLabelObject(labelData);
	createNewLabelInDom(newLabelData);
}

/*
 * Creates a labelData object for a new Label and stores it in data.newLabels
 * If no labelData is given it will become a new label with no text or tooltip in it, positioned at center of viewPort
 * If labelData is given (obtained from an existing fixed label), that labelData will be copied into the newLabel object
 * @param object labelData [optional] like so: {"id":...,"x":...,"y":...,"label":...,"tooltip":...}
 * @return object newLabelData
 */
function createNewLabelObject(labelData)
{
	//Create data object for the new label
	var newLabelData = {"id":null,"x":null,"y":null,"label":"","tooltip":""}; //container for the data of the new label

	//the index will be the highest ever used newlabelindex plus 1. Also update data.highestUsedLabelIndex 
	var index 							= (data.highestUsedNewLabelIndex == null)? 0 : data.highestUsedNewLabelIndex + 1
	newLabelData.id 					= "NL" + index;
	data.highestUsedNewLabelIndex 		= index; 

	//If labelData is given, this comes from an existing fixed label, that labelData will be copied into the newLabelData object
	if(isSet(labelData))
	{
/*		if(labelData.id.charAt(0) != "L")
		{
			alert("Error. Invalid labelId: '"+newLabelData.id+"' passed into function to create new label object."); 
			return newLabelData;
		}
		//fixed label had id: "Lx", with x=index, new label gets id "NLx"
		newLabelData.id 		= 	"N" + labelData.id;
*/
		newLabelData.x			= 	labelData.x;
		newLabelData.y			= 	labelData.y;
		newLabelData.label  	=	labelData.label;
		newLabelData.tooltip 	=	labelData.tooltip;		
	}
	else
	{
		//the index will be the amount of present newLabels. Note: length property is not a native thing in a javascript object
//		var index				= 	getObjectLength(data.newLabels);
//		newLabelData.id 		= 	"NL" + index;
		var center = getImgCoords(viewportWidth/2,viewportHeight/2); //calculate position on image in fractions of mid-viewport 
		newLabelData.x 			= 	center.x; //store in the data object
		newLabelData.y 			= 	center.y;
	}

	//store the new label in the global store, use the id as key
	data.newLabels[newLabelData.id] = newLabelData;

	//and return it
	return newLabelData;	
}


/*
 * Creates a new label in DOM (for GUI label making), it is a draggable container with a textbox for the labeltext and a textbox for the tooltiptext  
 * @param object - labelData : id, x, y, label, tooltip  to make the label with. Contains only id and x, y for a really new label, or more data for an existing (fixed) label that is to be made editable
 */
function createNewLabelInDom(labelData)
{
	if(!isSet(labelData))
		{return;}
	
	var newLabelId = labelData.id;
	
	//DOM creation
	//container, 'newLabelContainerId' is alias for newLabelId that is used in DOM actions to clarify that the container-div is indicated. 
	var newLabelContainerId = newLabelId;
	var newLabelContainerHtml = '<div id="'+newLabelContainerId+'" class="newLabelContainer" className="newLabelContainer"></div>';
	jQ( "#newLabels").append(newLabelContainerHtml);
	//The crosshair
	jQ( "#"+newLabelContainerId ).append('<img src="../img/cursor_crosshair_dbl.png" class="newLabelCrosshair hastooltip" className="newLabelCrosshair hastooltip"/><div class="tooltip">The label will be affixed to this point.<br /><em><small>(This is at half the line-height of the label\'s text)</small></em>.</div>');
	
	//textarea for the labeltext
	var newLabelTextAreaId = newLabelId + "TextArea";
	jQ( "#"+newLabelContainerId ).append('<textarea id="'+newLabelTextAreaId+'" class="newLabelTextArea label" classname="newLabelTextArea label">' + labelData.label + '</textarea>');
	//neccessary to make textarea editable whilst it is draggable: http://yuilibrary.com/forum/viewtopic.php?p=10361 (in combination with 'cancel:input' in draggable)	
	jQ( "#"+newLabelTextAreaId ).click(function(e){e.target.focus();})
	//workaround to also let the glow work in ie7 that doesn't support :focus pseudo-selector (gives a glowing border like Chrome and Safari to show the location of the textbox more clearly) -would be better with modernizr
	if(isSet(islteIE8) && islteIE8)
	{
		jQ( "#"+newLabelTextAreaId ).focus(function() {jQ(this).addClass("glowingBorder")}); 
		jQ( "#"+newLabelTextAreaId ).blur(function()  {jQ(this).removeClass("glowingBorder")}); 	
	}
	
	//Autosize the textarea at text entry http://www.jacklmoore.com/autosize 
	jQ( "#"+newLabelTextAreaId ).autosize({append: "\n"}); 
	//Continuously get the entered text and store it in the data of the newlabel
	jQ( "#"+newLabelTextAreaId ).keyup(function () {
		data.newLabels[newLabelId].label = ref(newLabelTextAreaId).value; //http://stackoverflow.com/questions/6153047/jquery-detect-changed-input-text-box
		//ih(data.newLabels[newLabelId].label)
		}); 
	jQ("#"+newLabelTextAreaId).keydown(function(e) 
	{
		//tab opens newlabeltooltip textarea
		if (e.which == 9) 
		{
	        e.preventDefault();
	        openNewLabelTooltipTextArea( newLabelId);
	    }
	});
		
	//buttons to open the tooltip textarea
	var htmlArws = '<br /><img id="' + newLabelId + 'ArwDown" class="newLabelArw hastooltip" classname="newLabelArw hastooltip" src="../img/bullet_arrow_down_light.png">';
	htmlArws+= '<div class="tooltip">Add a tooltip for this label<br /><em><small>(A tooltip is a little box with additional information, that appears when the user hovers her mouse over the label. Just as the one you\'re reading now!)</small></em>.</div>';
	htmlArws+= '<img id="' + newLabelId + 'ArwUp" class="newLabelArw hastooltip" classname="newLabelArw" src="../img/bullet_arrow_up_light.png">';
	htmlArws+= '<div class="tooltip">Close tooltip (your text remains stored)</div>';
	jQ( "#"+newLabelContainerId ).append(htmlArws);
	//initially hide the up arrow
	jQ("#"+ newLabelId + "ArwUp").hide();
	
	//close-button
	var closeButton='<img id="' + newLabelId + 'Close" class="newLabelClose hastooltip" classname="newLabelClose hastooltip" src="../img/close2.png">';
	closeButton+= '<div class="tooltip">Delete this label.</em></div>';
	jQ( "#"+newLabelContainerId ).append(closeButton);
	
	//ok-button
	var okButton='<img id="' + newLabelId + 'Ok" class="newLabelOkButton hastooltip" classname="newLabelOkButton hastooltip" src="../img/check2.png">';
	okButton+= '<div class="tooltip">Stop editing this label and fix it to this position.<br /><em>(You can always edit it again).</em></div>';
	jQ( "#"+newLabelContainerId ).append(okButton);

	//textarea for the tooltip
	var newLabelTooltipId = newLabelId + "Tooltip";
	jQ( "#"+newLabelContainerId ).append('<textarea id="'+newLabelTooltipId+'" class="newLabelTooltip tooltip" classname="newLabelTooltip tooltip">' + labelData.tooltip + '</textarea>');
	//neccessary to make textarea editable whilst it is draggable: http://yuilibrary.com/forum/viewtopic.php?p=10361 (in combination with 'cancel:input' in draggable)	
	jQ( "#"+newLabelTooltipId ).click(function(e){e.target.focus();}) 
	//Autosize the textarea at text entry http://www.jacklmoore.com/autosize 
	jQ( "#"+newLabelTooltipId ).autosize({append: "\n"}); 
	//Continuously get the entered text and store it in the data of the newlabel
	jQ( "#"+newLabelTooltipId ).keyup(function () {
		data.newLabels[newLabelId].tooltip = ref(newLabelTooltipId).value; //http://stackoverflow.com/questions/6153047/jquery-detect-changed-input-text-box
		//ih(data.newLabels[newLabelId].tooltip)
		}); 
	jQ("#"+newLabelTooltipId).keydown(function(e) 
	{
		//shift tab closes newlabeltooltip textarea
		if (e.which === 9 && e.shiftKey)  {
	        e.preventDefault();
	        closeNewLabelTooltipTextArea( newLabelId);
	    }
	});
	
	//attach handlers to arw buttons (Note: refers to newLabelTooltip, so this is after adding of tooltip-textarea
	now.newLabelPreviewTooltipEnabled[newLabelTooltipId] = true;
	jQ("#"+ newLabelId + "ArwDown").click(function(){
		openNewLabelTooltipTextArea(newLabelId);		
	});
	jQ("#"+ newLabelId + "ArwUp").click(function(){
		closeNewLabelTooltipTextArea(newLabelId);
		disablePreviewNewLabelToolTipTextArea(newLabelId); //to make it close directly, not just after mouseout of arw
	});	
	jQ("#"+ newLabelId + "ArwDown").mouseover(function(){
		previewNewLabelToolTipTextArea(newLabelId);
	});
	jQ("#"+ newLabelId + "ArwDown").mouseout(function(){
		hidePreviewNewLabelToolTipTextArea(newLabelId);
	});	
	jQ("#"+ newLabelId + "ArwDown").mouseout(function(event){ //note: only works if on arwDown
		enablePreviewNewLabelToolTipTextArea(newLabelId);
	});
	
	//attach handler to close button
	jQ("#"+ newLabelId + "Close").mouseup(function(){
		removeNewLabel(newLabelId);
	});
		

	//attach handler to ok button
	jQ("#"+ newLabelId + "Ok").mouseup(function(){
		fixLabel(newLabelId);
	});

	//make label draggable. At stopdrag get the textarea's value and update the position data in the data object of the newlabel
	jQ( "#"+newLabelContainerId).draggable({
		cancel: "input", //neccessary to make textarea draggable
		stop: function( event, ui ) 
		{		
			//ui.position.left and top are px positions related to left top of image
			data.newLabels[newLabelId].x = ui.position.left / imgWidthPresentZoom; //@TODO? add border correction of 1?
			data.newLabels[newLabelId].y = (ui.position.top - settings.labelOffsetHeight) / imgHeightPresentZoom; //apparently border seems no effect on top???? so dont correct
			//var str="<br>Container moved to left: "+ui.position.left+"px, top: "+ui.position.top+"px<br>";
			//str+="labelOffsetHeight: "+ settings.labelOffsetHeight+"px<br>";
			//str+="Stored position left: "+data.newLabels[newLabelId].x+"FR, top: "+data.newLabels[newLabelId].y+"FR<br>";
			//ih(str);	
		}
	});
	
	//position the new label (and others)
	repositionAndResizeLabels();
	
	//set focus on new label
	jQ( "#"+newLabelTextAreaId ).focus();
	//activate tooltips
	initNewLabelTooltips();
	
}

/*
 * Opens the textarea below label in which user can enter the text that is to be shown on tooltip on label
 */
function  openNewLabelTooltipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	jQ("#"+ newLabelTooltipId).show().css({"opacity":1}); //open tooltip text area
	jQ("#"+ newLabelTooltipId).focus(); //put input on the tooltip text area
	jQ("#"+ newLabelId + "ArwDown").hide(); //hide down arrow
	jQ("#"+ newLabelId + "ArwUp").show(); //show up arrow
	now.newLabelTooltipIsOpen[newLabelTooltipId] = true;
}

function closeNewLabelTooltipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	jQ("#"+ newLabelTooltipId).hide(); //hide tooltip text area
	jQ("#"+ newLabelId + "TextArea").focus(); //put input back on the label text area		
	jQ("#"+ newLabelId + "ArwUp").hide(); //hide down arrow
	jQ("#"+ newLabelId + "ArwDown").show(); //show up arrow
	now.newLabelTooltipIsOpen[newLabelTooltipId] = false;
}

/*
 * At mouseover down-arrow transparently shows the textarea below label with the text that is to be shown on tooltip on label
 */
function previewNewLabelToolTipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	if(now.newLabelPreviewTooltipEnabled[newLabelTooltipId])
	{
		jQ( "#"+newLabelTooltipId ).show().css({"opacity":0.6});	//give an impression of the tooltip at hover to quickly check content without having to open it
	}
	//ih("arwdown mouseover")	
}

function hidePreviewNewLabelToolTipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	//hide only if the tooltip area was not deliberately opened (by click) by user
	if(!now.newLabelTooltipIsOpen[newLabelTooltipId])
	{
		jQ( "#"+newLabelTooltipId ).hide();
	}
	//ih("arwdown mouseout")
}

/*
 * reenables previewing of tooltip textarea (see disablePreviewNewLabelToolTipTextArea() ) 
 */
function enablePreviewNewLabelToolTipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	now.newLabelPreviewTooltipEnabled[newLabelTooltipId] = true;	
	//ih("enabled preview of "+newLabelTooltipId)	
}

/*
 * previewing tooltip textarea is disabled after user clicked the arw-up to close textarea, until user has moused out the arw button (otherwise closing textarea by clicking arw would seem not to work, as mouse is still above arw up button
 */
function disablePreviewNewLabelToolTipTextArea(newLabelId)
{
	var newLabelTooltipId = newLabelId  +"Tooltip"; 
	now.newLabelPreviewTooltipEnabled[newLabelTooltipId] = false;	
	//ih("disabled preview of "+newLabelTooltipId)	
}
/*
 * variant on the general addTooltips function. This positions the tooltip differently to not overlap the textarea
 */
function initNewLabelTooltips()
{
	//only affect hastooltips that are a child of newLabelContainer
	jQ(".newLabelContainer .hastooltip" ).tooltip({
		content: function() {
			var data = jQ(this).next('.tooltip');
			if(data.length)
			{
				return data.html();
			}		
		},
		items: "img,div,span,a",
		show: 100,
		hide: false,
		tooltipClass: "tooltip",
		position: { my: "left-100% top"}
	});
}


/*
 * positions the crosshair on the new label, at front of and at half the height of the first line of text
 */
function positionCrossHairs()
{
	var left = - settings.crosshairWidth/2;
	var top  = - settings.crosshairHeight/2 - settings.labelOffsetHeight;

	//set crosshair at middle of (first-line) line-height
	jQ(".newLabelCrosshair").css({ "left": left +"px", "top": top +"px"});
}

/*
 * positions the red x on new labels
 */
function positionNewLabelCloseButtons(labelWidth)
{
	labelWidth = labelWidth -14;
	jQ(".newLabelClose").css({ "left": labelWidth +"px", "top": "-16px"});
}

/*
 * deletes a new/edited label
 */
function removeNewLabel(newLabelId)
{
	//alert("remove "+newLabelId)
	jQ("#"+newLabelId).remove();
	delete data.newLabels[newLabelId];
}



/*
 * returns the present labelMode
 * Is used by full page when add/edit label button is clicked
 * @return "fixed" or "edit"
 */
function getLabelMode()
{
	return now.labelMode;
}

/*
 * make existing labels editable
 * 
 */
function setLabelsToEditMode()
{
	//make a new label for each existing (fixed) label
	for(thisLabel in data.labels)
	{
		var labelId= data.labels[thisLabel].id;
		//show the edit buttons on the labels
		jQ(".labelEditButton").removeClass("invisible");
		//Note: creating editable labels for alle labels caused unsolvable problems with labels outside the viewport coming into view and moving outerdiv without any tractable change in debuggers
		//createNewLabel(data.labels[label]);
	}
	now.labelMode = "edit";
}

/*
 * Makes an existing 'fixed' bale editable
 * The fixed label is deleted and a new label with the content of the fixed label is created.
 * 
 */
function makeLabelEditable(labelId)
{
	createNewLabel(data.labels[labelId]);
	//remove the fixed Label from DOM and from the data storage
	jQ("#imageLabels #"+labelId).remove();
	delete data.labels[labelId];
	//debug("LABELS",data.labels);
	//debug("NEWLABELS",data.newLabels);
}

/*
 * converts editable new labels to fixed labels, stops edit mode
 */
function fixLabels()
{
	//make a fixed label for each new label
	for(thisLabel in data.newLabels)
	{
		//create fixed label with the data of new label
		fixLabel(data.newLabels[thisLabel].id)
	}

	//neccessary because the labels have the original (non-zoom-corrected) size now still
	resizeLabels()
	jQ(".labelEditButton").addClass("invisible");
	//empty object newLabels
	data.newLabels= {};
	//empty DOM of newLabels
	jQ("#newLabels").empty();
	now.labelMode = "fixed";
	
}

/*
 * Converts editable / new label to a fixed label (click on green checkmark on new label or close edit mode for all labels)
 * The new/edit label is deleted and a fixed label with the content of the new/edit label is created.
 */
function fixLabel(newLabelId)
{
	if(data.newLabels[newLabelId].label != "" || data.newLabels[newLabelId].tooltip != "")
	{
		//create fixed label with the data of new label
		createLabel(data.newLabels[newLabelId]);
	}
	//remove the new Label from the data storage and from DOM
	delete data.newLabels[newLabelId];
	jQ("#"+newLabelId).remove();
	//debug("LABELS",data.labels);
	//debug("NEWLABELS",data.newLabels);
	
}



//////////////////////////////////////////////////////////////////////
//
// URL handling
//
/////////////////////////////////////////////////////////////////////

/*
 * Get present view settings
 * Is called by the navframe to create an url that calls the present view
 * @return object with zoom, x,y-position and label data
 */
function getDataForUrl()
{
	var o ={}; //container
	o["slideName"] = settings.slideName;
	o["zoom"] = now.zoom;
	//get the position on the image at the center of the viewport 
	var center = getImgCoords(viewportWidth/2,viewportHeight/2);
	o["x"] = center.x;
	o["y"] = center.y;
	var mergedLabels = mergeObjects(data.labels,data.newLabels);
	o["labels"] = createQueryPartLabels(mergedLabels); //create the URL string
//	debug("getDataForUrl",o);
	return o;	
}

/*
 * creates query holding info about labels 
 */
function createQueryPartLabels(labels)
{
	var str="";
	for(thisLabel in labels)
	{
		str+= createQueryPartLabel(labels[thisLabel]);
	}
	return str;
}

/*
 * creates query part for one label
 */
function createQueryPartLabel(labelData)
{
	//only if there is text in the label or in the tooltip use it, else discard it
	if(labelData.label != ""  || labelData.tooltip != "" )
	{
		var qX 		 =	(labelData.x)? 			(truncate(labelData.x,4))  		: "";
		var qY 		 =	(labelData.y)? 			(truncate(labelData.y,4))  		: "";
		var qLabel 	 =	(labelData.label)? 		urlEncode(labelData.label) 		: "";
		var qTooltip =	(labelData.tooltip)? 	urlEncode(labelData.tooltip) 	: "";
		
		return   "(" + qX + "," + qY + "," + qLabel + "," +qTooltip +")" ;
	}
	return "";
}

/*
 * extracts the data in the query part label data string to labeldata objects
 * @param string querypart with labeldata
 * @return array holding labelData objects
 */
function extractLabelData(queryPartLabel)
{	

	//debug("extracting :"+queryPartLabel)
	/*
	 * EXAMPLE:
	 * NOW WE HAVE queryPartLabel=
	 * (0.9,0.7,labeltext,labeltooltip)(0.5,0.5004,%28this+text%29+is+between+parenthesis,) //note second label: text holds parenthesis, tooltip is empty
	 */

	//Step 1: Get the separate labels and place them in array 'labels' 
	var labels = extractLabelDataStepRegEx(queryPartLabel);
	//debug("STEP 1. after regex: labels =", labels);
	/*
	 * EXAMPLE
	 * NOW WE HAVE
	 * labels[0] = 0.9,0.7,labeltext,labeltooltip
	 * labels[1] = 0.5,0.5004,%28this+text%29+is+between+parenthesis,
	 */
	
	//Step 2, 3, 4: for each label: 
	var thisLabel, labelId, labelData, extractedLabels= [];
	for(var i=0;i<labels.length;i++)
	{
		thisLabel = labels[i]; //for easier reading
		
		//Step 2: split the string on the , to get the individual properties
		thisLabel = extractLabelDataStepSplitToProperties(thisLabel);
		//debug("STEP2. after split on ,: thisLabel["+i+"]=",thisLabel)
		/*
		 * EXAMPLE
		 * NOW WE HAVE (for 2nd label in example)
		 * thisLabel[0] = 0.5   									[string]
		 * thisLabel[1] = 0.5004									[string]
		 * thisLabel[2] = %28this+text%29+is+between+parenthesis	[string]
		 * thisLabel[3] = 											[empty string]
		 */	
		
		//Step 3: uri- decode the values 
		thisLabel = extractLabelDataStepUrlDecode(thisLabel)
		//debug("STEP3. after url-decode, thisLabel["+i+"]=",thisLabel)
		/*
		 * EXAMPLE
		 * NOW WE HAVE (for 2nd label in example ) - AFTER HAVING LOOPED FOR ALL PROPERTIES -in this case: 4 properties- 
		 * thisLabel[0] = 0.5   									[string]
		 * thisLabel[1] = 0.5004									[string]
		 * thisLabel[2] = (this text) is between parenthesis		[string]
		 * thisLabel[3] = 											[empty string]
		 */			

		//Step 4: place the values in the respective keys in object 'labelData' and convert x and y to numbers
		labelData = extractLabelDataStepToObject(thisLabel)
	//	labelData.id = labelId;
		//debug("STEP4. after placing in labelData, thisLabel["+i+"].labelData=",labelData)
		/*
		 * EXAMPLE
		 * NOW WE HAVE (for 2nd label in example )
		 * labelData.id			= L2										[string: L plus index]  
		 * labelData.x 			= 0.5   									[number]
		 * labelData.y 			= 0.5004									[number]
		 * labelData.label 		= (this text) is between parenthesis		[string]
		 * labelData.tooltip 	= 											[empty string]
		 */	
	
		//Step 5: safety
		//discard the label if the coordinates are non-numerical, also removes empty coordinates
		if(isNaN(labelData.x) || isNaN(labelData.y)) 
			{continue;}
		//discard the label if the cordinates are (way out) of the image
		if(labelData.x < -0.1 || labelData.x > 1.1 || labelData.y < -0.1 || labelData.y > 1.1)
			{continue;}
		//discard the label if it has nor text nor tooltip
		if(labelData.label == "" && labelData.tooltip == "")
			{continue;}
		
		//Step 6: store in return object
		extractedLabels[i] = labelData;
	}
	
	//debug("STEP 7 - READY: extractedLabels=", extractedLabels)
	/*
	 * EXAMPLE
	 * NOW WE HAVE 
	 * extractedLabels[0].x 			= 0.5   									[number]
	 * extractedLabels[0].y 			= 0.5004									[number]
	 * extractedLabels[0].label 		= (this text) is between parenthesis		[string]
	 * extractedLabels[0].tooltip 		= 											[empty string]	 * 
	 * extractedLabels[1].x 			= 0.5   									[number]
	 * extractedLabels[1].y 			= 0.5004									[number]
	 * extractedLabels[1].label 		= (this text) is between parenthesis		[string]
	 * extractedLabels[1].tooltip 		= 											[empty string]
	 */
	
	return extractedLabels;
}

/*
 * Get the separate labels and place them in array 'labels' 
 */
function extractLabelDataStepRegEx(queryPartLabel)
{
	//the pattern matches the strings between the parentheses: (string..)(string...)(string...) and extracts the 'string' part (without the parenetheses)
	var pattern = /\(([^\)]*)\)/g;
	var result, labels= [];	
	while( (result = pattern.exec(queryPartLabel)) != null )
	{
		//debug("regex result", result);
		labels[labels.length] = result[1];	
	}
	return labels;
}

/*
 * split the string on the , to get the individual properties
 * @param string thisLabel = x,y,labeltext,tooltip
 */
function extractLabelDataStepSplitToProperties(thisLabel)
{
	thisLabel = thisLabel.split(",");
	return thisLabel;	
}

/*
 * url-decode the values
 * @param reg array thisLabel = array with thisLabel[0] = x, thisLabel[1] = y, thisLabel[2] = labeltext, thisLabel[3]= tooltip
 */
function extractLabelDataStepUrlDecode(thisLabel)
{
	for(var j=0;j<thisLabel.length;j++)
	{		
		var data = urlDecode(thisLabel[j]);
		//once more pass through preventXss after the decoding
		thisLabel[j] = preventXss(data);
	}
	return thisLabel;
}


/*
 * place the values in the respective keys in object 'labelData' and convert x and y to numbers
 * @param reg array thisLabel = array with thisLabel[0] = x, thisLabel[1] = y, thisLabel[2] = labeltext, thisLabel[3]= tooltip
 */
function extractLabelDataStepToObject(thisLabel)
{
	var labelData= {};
	labelData.x 		= parseFloat(thisLabel[0]);
	labelData.y 		= parseFloat(thisLabel[1]);
	labelData.label 	= thisLabel[2];
	labelData.tooltip	= thisLabel[3];
	return labelData;
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
	settings.wheelZoomInDirection = (zoomInDirection == "up")? 1 : ((zoomInDirection == "down")? -1 : settings.wheelZoomInDirection);
}


/*
 * shows or hides the little panel at the top of the page displaying the coords
 * @param boolean showOrHide : true = show, false = hide
 * 
 */
function showHideCoordinatesPanel(showOrHide)
{
	setShowCoordinatesPanel(showOrHide);
	//ih("in viewerframe showHideCoordinatesPanel, settings.showCoordinatesPanel ="+ settings.showCoordinatesPanel)
	//show coords panel
	ref("coordsPane").style.display = (settings.showCoordinatesPanel)? "block" : "none";
	//then hide the name panel, as this overlaps, when shown it must be inline-block to have the centering and dynamic width work
	ref("namePanel").style.display = (settings.showCoordinatesPanel)?  "none" : "inline-block";
}

/*
 * sets setting showcoordinatesPanel (and the container setting monitorPosition)
 * @param boolean trueOrFalse :  true = show, false = hide
 * if not given, it uses the settings.showCoordinatesPanel (keeps unchanged)
 */
function setShowCoordinatesPanel(trueOrFalse)
{
	//if a setting is passed, set 'settings.showCoordinatesPanel' that determines the showing to this value, else keep the default one  
	settings.showCoordinatesPanel = (typeof trueOrFalse == "boolean")? trueOrFalse : settings.showCoordinatesPanel;
	setNowMonitorPosition();
}

/*
 * wheelmode: what does wheel do: zoomin/zoomout or next/prev in stack of images
 * Temporarily not used
 */
function wheelMode1(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" checked  onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" onClick="wheelMode2()" >&nbsp;Next/Prev'; settings.wheelmode=0;}

function wheelMode2(){ ref('wheelMode').innerHTML='<b>Mouse Wheel:</b><br><input type="radio" onClick="wheelMode1()">&nbsp;Zoom<br><input type="radio" checked  onClick="wheelMode2()" >&nbsp;Next/Prev'; settings.wheelmode=1;}


/*
 * positions the sizeIndicators: grey rectangles indicating visible area on small screens, shown overlaid when a direct url is requested. 
 * Replace by SVG when IE8 and lower has lost enough market share. Disadvantage: prevents access to edit label buttons on modern browsers.
 * @TODO: create alternative SVG method for modern browsers, alongside the present 'showing div' method for old IE
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
function startUrlViewing()
{
	positionSizeIndicators();
	jQ("#sizeIndicators").show();
	setIsDisplayingUrl(true);
}


function stopUrlViewing()
{
	jQ("#sizeIndicators").hide();
	setIsDisplayingUrl(false);
}


/*
 * presently not called, keep for a while
 */
function hideUrlBarAndSizeIndicators()
{
	if(now.isDisplayingUrl && parent.closeUrlBar)
		{
		parent.closeUrlBar();//this will also call stopUrlViewing()
		}	
}

/*
 * sets setting now.isDisplayingUrl (and the container setting now.monitorPosition)
 * @param boolean trueOrFalse : true or false
 * if not a valid boolean is passed the setting remains unchanged
 */
function setIsDisplayingUrl(trueOrFalse)
{
	now.isDisplayingUrl = (typeof trueOrFalse == "boolean")? trueOrFalse : now.isDisplayingUrl;
	setNowMonitorPosition();
}

/*
 * sets the combined setting monitorPosition true if either now.isDisplayingUrl or settings.showCoordinatesPanel is true
 * this combined setting is used to reduce the number of ifs during moving in processmove()
 * 
 */
function setNowMonitorPosition()
{
	now.monitorPosition = (now.isDisplayingUrl || settings.showCoordinatesPanel)? true : false;
}

//////////////////////////////////////////////////////////////////////
//
//  MOBILE FUNCTIONS
//
/////////////////////////////////////////////////////////////////////
/*
 * Still basic work arounds, already partially made superfluous due to implementation of touch
 * @TODO: replace by media queries, viewport setting and responsive design 
 */

function hasSmallViewport()	
	{
		return (viewportWidth+viewportHeight <= 790)? true :false;
	}


function adaptDimensions()
{
	//ref('credit').style.width=viewportWidth/2;
	//ref('credit').style.fontSize="8px";
	//enlarge zoom buttons
	jQ("#zoomButtonsContainer,#zoomin,#zoomout").addClass("enlarged");	
}

function resetDimensions()
{
	jQ("#zoomButtonsContainer,#zoomin,#zoomout").removeClass("enlarged");	
}

/*
 * sets the font on the scale bar larger or removes this setting, ie on iPad and mobile
 * @param number 0 = base font, 1 = largerFont1, 2 = largerFont2 
 */
function setFontSizeScaleBar(size)
{
	if(typeof size != "number") {return;}
	if(size==0)
	{
		jQ("#theScale1,#theScale2").removeClass("largerFont1 largerFont2");			
	}
	else if(size==1)
	{		
		jQ("#theScale1,#theScale2").addClass("largerFont1");		
	}
	else if (size==2)
	{
		jQ("#theScale1,#theScale2").addClass("largerFont2");
	}
}

function setMobileOn()
	{mobile=true;
	ref("iconMobile").style.display="none";
	adaptDimensions();
	//showArrows();
	elem.controlsContainer.style.right=""; //left positioning elem.thumbImageHolder to prevent discrepancy viewport-positions vs. visual-viewport-eventX  which breaks thumb 
	elem.controlsContainer.style.left="0px";
	elem.controlsContainer.style.top="0px";
	ref("barCont").style.left= "200px";//move the bar aside of the elem.thumbImageHolder that has now come to the left
	//ref('test').style.display="block";
	setFontSizeScaleBar(2);
	}
	
function setMobileOff()
	{mobile=false;
	ref("iconMobile").style.display="block";
	resetDimensions();
	//hideArrows();
	elem.controlsContainer.style.left="";
	elem.controlsContainer.style.top="10px";
	elem.controlsContainer.style.right="10px";
	ref("barCont").style.left= "0px";
	//ref('test').style.display="none";
	ref("log").style.display="none";
	logwin.innerHTML="";
	setFontSizeScaleBar(0);
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

/*
 * blue arrow buttons up, down, left, right, that autopans slide at click on one of the buttons
 * Is not anymore used now as touch panning works now
 */
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

/*
 * autopans slide at click on one of the blue arrow buttons
 * Is not anymore used now as touch panning works now
 */
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
	{
	var map= getElemPos(elem.innerDiv);
	if(dir=="up") 			{ setInnerDivTop((map.top  + 10) +"px"); }
	else if(dir=="down") 	{ setInnerDivTop((map.top  - 10) +"px"); }
	else if(dir=="left") 	{ setInnerDivLeft((map.left + 10) +"px"); }
	else if(dir=="right") 	{ setInnerDivLeft((map.left - 10) +"px"); }
	var result= keepInViewport();
	if (result=="corrected") {stopAutoPan(dir);}
	checkTiles();
	moveViewIndicator();
	}		


///////////////////////////////////////////////////////////////////////////////////////////
//
// TOUCH FUNCTIONALITY: PAN AND ZOOM SLIDE
//
//////////////////////////////////////////////////////////////////////////////////////////

//*** START OF: Apple Device Event Handlers Block
//iPhone/iPad modifications written by Matthew K. Lindley; August 25, 2010

function appleStartTouch(event) 
{
	//ih("starttouch");
	if (event.touches.length == 1) 
	{
		touchIdentifier = event.touches[0].identifier;
		dragStartLeft = event.touches[0].clientX;
		dragStartTop = event.touches[0].clientY;
		mLeft = getInnerDivLeft();
		mTop = getInnerDivTop();	
		  
		dragging = true;
		return true;
	}
}

function appleMoving(event) 
{
	//ih("appleMoving");
	event.preventDefault();
	appleMove(event);
}

function appleMoveEnd(event) 
{
	//ih("moveend");
	dragging = false;
	appleMove(event);
}

function appleMove(event) 
{
	//	ih("applemove");
	if ((event.changedTouches.length == 1) && (dragging == true) && (touchIdentifier == event.changedTouches[0].identifier)) 
	{
		setInnerDivLeft( mLeft + (event.changedTouches[0].clientX - dragStartLeft));
		setInnerDivTop(  mTop +  (event.changedTouches[0].clientY - dragStartTop));
	   
	}
	event.preventDefault();
	checkTiles();
	moveViewIndicator();
}

//*** END OF: Apple Device Event Handlers Block
	
	



//////////////////////////////////////////////////////////////////////
//
// FUNCTIONS FOR STACKS OF IMAGES (temporarily not used)
//
/////////////////////////////////////////////////////////////////////

function slideNext(){ 
	return; //temp disabled
	if (settings.slidePointer<JSONnum-1){ settings.slidePointer++;}else{ settings.slidePointer=0;}
rawPath = JSONout.slides[settings.slidePointer].path; imgWidthMaxZoom = JSONout.slides[settings.slidePointer].width; imgHeightMaxZoom = JSONout.slides[settings.slidePointer].height; if (JSONout.slides[settings.slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[settings.slidePointer].labelspath; loadLabels();}else{labelsPath="";}
init0(); refreshTiles(); checkTiles();moveViewIndicator()}


function slidePrev(){
	return; //temp disabled
	if (settings.slidePointer>0){ settings.slidePointer--;}else{ settings.slidePointer=JSONnum-1;}
rawPath = JSONout.slides[settings.slidePointer].path; imgWidthMaxZoom = JSONout.slides[settings.slidePointer].width; imgHeightMaxZoom = JSONout.slides[settings.slidePointer].height; if (JSONout.slides[settings.slidePointer].labelspath!=undefined){ labelsPath=JSONout.slides[settings.slidePointer].labelspath; loadLabels();}else{labelsPath="";}
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


/*
 * Check whether automatic image loading is allowed
 * Source http://stereochro.me/ideas/detecting-broken-images-js 
 * 
 */
function automaticImageLoadingIsAllowed()
{
	ref('testimage').src= "../img/emptyimage.gif";
	var img = ref('testimage');
	 
 /*   
  * this triggered in IE, turned it off
  * if (!img.complete) {
        return false;
    }
*/
    if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
    	return false;
    }

    return true;	
}

/*
 * Are we loading images?
 */
function isImageOk(img) {
    // During the onload event, IE correctly identifies any images that
    // weren't downloaded as not complete. Others should too. Gecko-based
    // browsers act like NS4 in that they report this incorrectly.
    if (!img.complete) {
        return false;
    }

    // However, they do have two very useful properties: naturalWidth and
    // naturalHeight. These give the true size of the image. If it failed
    // to load, either of these should be zero.
    if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
        return false;
    }

    // No other way of checking: assume it's ok.
    return true;
}


function signalUseIFrameFallBack()
	{if(ref("signalI"))	{ref("signalI").style.display= "block";}
	}

function signalUseLoadJsFallBack()
	{if(ref("signalj")) {ref("signalj").style.display= "block";}
	}
	
function showAutomaticImageLoadingDisallowed()
{
var str = "It seems image loading is presently turned off in your browser. Therefore, the slide cannot be loaded and shown. To turn image loading on:<br /> ";
str+= 	"<ul>";
str+=	"<li>Firefox: orange Firefox button &gt; Options &gt; tab 'Content' &gt; check 'Load images automatically'.</li>";
str+=	"</ul>";
ref("warning").innerHTML= str;
ref("warning").style.display="block";	
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
function showSlidesFileMissingWarning()
{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: No slide-info file (slides.js) is present in the folder 'slides'.";
	ref("warning").style.display="block";	
}
function showRequestedSlideNotPresentWarning()
{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: The requested slide is not present in the slide-info file (slides.js in folder 'slides').";
	ref("warning").style.display="block";	
}
function showNoDimensionsWarning()
{if(!dimensionsKnown())
	{ref("warning").innerHTML="Image cannot be displayed.<br />Reason: Width and Height of image not provided. The Width and Height should be provided either in the URL-query or in the html page."; 
	ref("warning").style.display="block";
	}
}
function showViewsFileMissingWarning()
{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: No views-info file (views.js) is present in the folder 'slides'.";
	ref("warning").style.display="block";	
}
function showRequestedViewNotPresentWarning()
{
	ref("warning").innerHTML="Image cannot be displayed.<br />Reason: The requested view is not present in the views-info file (views.js in folder 'slides').";
	ref("warning").style.display="block";	
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



	