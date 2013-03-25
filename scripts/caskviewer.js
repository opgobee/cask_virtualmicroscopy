/*
 * Navigation-pane scripts used together with the microscopy viewer
 * Written 2013 by Paul Gobee, dept. of Anatomy & Embryology, Leiden University Medical Center, the Netherlands, Contact: o--dot--p--dot--gobee--at--lumc--dot--nl
 * See also: http://www.caskanatomy.info
 * license: Creative Commons: BY NC SA
 * Basically: You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 
 * This notification should be kept intact, also in minified versions of the code. 
 * 
 * How it works:
 * frameset full.html refers to nav frame nav.html with scripts nav_pane.js and main frame 'view' main.html with scripts ajax-tiledviewer.js
 * If no slide is requested in the parent's URl (that is in the URL of the frameset, the URL the user sees), blank.html is loaded in the main frame
 * If one of the slides in the slide selection menu (created here) is clicked, the parent will be reloaded with the slide request aded to the query: ?slide=..slidename...
 * If a slide IS requested in the parent's URl (either because it was direcly externally called with that, or because the parent was reloaded with the slide request, then viewer file is called in the main frame, with the query (including the requested slide) appended to it
 * So: basically 2 possible ways to show a slide:
 * 1. the BMCviewer is called direct from the start with a slide request: '....pathtoBMCviewer.../full.html?slide=slideName' --> the nav panel is shown, but the requested slide is directly loaded in the main panel
 * 2. the BMCviewer is called without a slide request: '....pathtoBMCviewer.../full.html'. 
 * 		- the user clicks one of the slides in the slide selection menu
 * 		- a reload of the parent is done with a slide request: '....pathtoBMCviewer.../full.html?slide=slideName'
 * 		- step 1 is executed
 *
 */

    
//Settings
var initialSlideSetMenu = "collectionsAnatomicalRegions"; //default
var initialSlideSet = "view=carotis1,4qw_rot"; //slideSet to load opening //@TODO: put this in the menus.js file
var urlViewerFile = "../html/main.html";
var urlSlideImg = "../img/slide.jpg";
var urlSensorImg = "../img/emptyimage.gif";
var spaceRatio = 2.307692307692308; //w/h ratio of thumbs projected on slides

//Local Settings in nav - Note: the settings are listed here for clarity, but they are always reset in function resetSettings()  
settings = {}; 
settings["slideName"] = null; //slideName (the code-slidename)
settings["viewName"] = null; //a specific view on the slide
settings["wheelZoomInDirection"] = "down"; //user-option: zoomin/out direction of wheel, default wheeldown = zoomin
settings["showCoordinatesPanel"] = false; //user-option: default hide coords panel
settings["zoom"] = null;
settings["x"] = null; //the x coordinate (fraction of image) to center on
settings["y"] = null; //the y coordinate (fraction of image) to center on
settings["label"] = null; // a single label to be set on the center x,y location

//to hold track of actual things
now= {}; 
now.urlViewing = false;

//Variable declarations

/*
 * Expected global vars in loaded files:
 * 
 * var slides; //global var 'slides' containing the list of slides. Is now defined and set in slides.js
 * var slideSetsMenus; //global var 'slideSetsMenus' containing the menus of slideSets. Is now defined and set in slidesets_menus.js
 */

var currentSlideSetMenu = null;
var loadedSlideSetMenuNames = Array(); //array with names of the slideSetsMenus that have been created and inserted in the slideSetsMenuPane
var currentSlideSetSlideNames = Array(); //array of the slideNames in the current slideSet
var loadedSlides = {}; //assoc array with the slideData-objects that are loaded, with key= slideName
var querySettings = Array(); //assoc arary with name/value pairs settings that are communicated via the URL's query.  If a slide is requested, the viewer iframe is loaded, the query is transferred to the URL of the viewer iframe
var fitDone= {},fitAttempt=1; //fitDone= assoc array slideName = true/false indicating whether the thumb-fitting has (already) succeeded
var isIE= (navigator.userAgent.indexOf("MSIE") != -1)? true : false; //for IE workarounds
var isOpera= (navigator.userAgent.indexOf("Opera") != -1)? true : false;
var isiPad= (navigator.userAgent.indexOf("iPad") != -1)? true : false;
var isTouchDevice = ("ontouchstart" in window)? true : false;
var settingsCloseTimer;
var slidesCont;
var logwin;
var slideSetsMenus = {};
var slideSetsMenuData = Array();

//////////////////////////////////////////
//
// 	Startup
//
////////////////////////////////////////////	


function init()
{
	//debugging
	logwin=document.getElementById("log");
	
	//at a reload reset the settings
	resetSettings();
	
	//reads data from the URL
	//get variables from query in URL
	//without uri-decoding for the labels, you want to first extract the content parts between the parentheses, any parentheses in the content should remain encoded so long
	var queryArgs= getQueryArgs({"dontDecodeKey":"labels"});
	queryArgsToSettings(queryArgs);
	
	winsize();//do after onload for IE
	setHandlers();
	
	//unfortunately neccessary still: some device specific adaptations
	if(isiPad)
	{
		setForiPad();
	}
	
	
	//sets default options in the options menu
	checkChosenOptions();
	//creates the menus: Menus: menuAnatomicalRegions and menuInstitutionsModules, containing headers, containing entries (entry refers to a set of slides to be shown in the slide-selection panel [=that is: here])
	createSlideSetsMenus();
	//load an initial slideSet in the slide-selection panel [=that is: here]) 
	loadSlideSet(initialSlideSet);
	//If a slide or view is requested in the URL (e.g. '...?slide=carotis' or '...?view=xxxx' ), load the requested slide or view in the main panel
	//Note 1: all additional specific requests in the URL (e.g. zoom, x, y, labels) have already been read to global object 'settings' and will be passsed in when the query is constructed in createQuery()
	//Note 2: a slide may also be loaded by a click on one of the slides-thumbs in the menus
	if(settings["slideName"] != null || settings["viewName"] != null)  
	{
		var query = getQuery();
		//mode= 'unchanged': pass the query through unchanged
		loadVirtualSlide({"query":query},"unchanged"); 
	}
}

function resetSettings()
{
	settings["slideName"] = null; //slideName (the code-slidename)
	settings["viewName"] = null; //a specific view on the slide
	settings["wheelZoomInDirection"] = "down"; //user-option: zoomin/out direction of wheel, default wheeldown = zoomin
	settings["showCoordinatesPanel"] = false; //user-option: default hide coords panel
	settings["zoom"] = null;
	settings["x"] = null; //the x coordinate (fraction of image) to center on
	settings["y"] = null; //the y coordinate (fraction of image) to center on
	settings["label"] = null; // a single label to be set on the center x,y location
}

/*
 * sets a property in the local associative array 'settings' 
 */
function setLocalSetting(name, value)
{
	settings[name]=value;
}


/*
 * attach handlers
 * 
 * Note 1: touch handlers for adding labels turned off as labels still give an array of bugs on diff browsers/touch devices
 * Note 2: http://www.quirksmode.org/blog/archives/2010/02/do_we_need_touc.html
 * 			but we dont cancel the click events in the touch equivalent because then they are turned off definitively and there is no problem in having them fire both
 */
function setHandlers()
{
	window.onresize = winsize;
	
	if(isiPad)
	{
		//adapt for orientationchange neccessary because of iframe on ipad problem
		//event resize seems to be safer than onorientationchange - http://davidwalsh.name/orientation-change
		window.onresize = function() 
		{
			setForiPad();	
			winsize();
		}
	}
	
	ref("nav").onclick = handleClick;
	ref("nav").ontouchstart = handleClick;
	
	ref("slidesContOverlay").onclick = hideSlideSetsMenuPane;
	ref("slidesContOverlay").ontouchstart = hideSlideSetsMenuPane;
	
	//the flag icon
//	ref("buttonEditLabelsOn").onclick = openSetLabelPanel;
//	ref("buttonEditLabelsOn").ontouchstart = touchOpenSetLabelPanel;
	
	//jQ("buttonEditLabelsOn").click = openSetLabelPanel;
	jQ("buttonEditLabelsOn").on("touchstart",touchOpenSetLabelPanel);
	
	//the flag icon
	ref("buttonEditLabelsOff").onclick = closeSetLabelPanel;
	//ref("buttonEditLabelsOff").ontouchstart = closeSetLabelPanel;
	
	//button in  the labelpanel
	ref("addLabelButton").onclick = addLabel;
	//ref("addLabelButton").ontouchstart = addLabel;
	
	//the x on the labelpanel
	ref("closeLabelPanel").onclick = closeSetLabelPanel;
	//ref("closeLabelPanel").ontouchstart = closeSetLabelPanel;

	//the link icon
	ref("buttonShowUrlBar").onclick = showUrlBar;
	ref("buttonShowUrlBar").ontouchstart = showUrlBar;
	
	//the link icon
	ref("buttonCloseUrlBar").onclick = closeUrlBar;	
	ref("buttonCloseUrlBar").ontouchstart = closeUrlBar;
	
	//the x on the urlbar
	ref("buttonCloseUrlBar2").onclick = closeUrlBar;	
	ref("buttonCloseUrlBar2").ontouchstart = closeUrlBar;
	
	//the buttonWrench icon
	ref("buttonWrench").onclick = showHideSettings;	
	//ref("buttonWrench").ontouchstart = showHideSettings; //this would duplicate and thus close again
	
	//settings in settings panel
	jQ(".wheelZoomDir").change(setWheelZoomDirection);
	jQ("#checkBoxShowCoords").change(showHideCoordsPanel);
	ref("checkBoxShowCoords").ontouchstart = showHideCoordsPanel;
	
	initTooltips();
	slidesCont = ref("slidesCont");

	//debug
	jQ("#log").dblclick(function(){jQ(this).html("")});
}	



/*
 * specific adaptations for iPad -unfortunately neccessary
 * Prevents the iFrame on iPad from expanding by holding it within a containerDiv that is dimensioned here
 * @return nothing
 * @action sets dimensions div#iFrameContainer
 */
function setForiPad()
{
	//Workaround for iPad feature/bug: on iPad an iFrame resizes to accomodate its content, this causes all calculations based on viewport to go astray
	//prevent this by enclosing the iFrame in a div with fixed size, set the size here, unfortunately javaScript neccessary
	//http://dev.magnolia-cms.com/blog/2012/05/strategies-for-the-iframe-on-the-ipad-problem/
	var viewport = getViewportDimensions();
	var viewportWidth  = viewport.width;
	var viewportHeight = viewport.height;
	var iPadInitialWidth = viewportWidth - 220; // 220 = width of menu
	var iPadInitialHeight = viewportHeight;
	//alert("iPadInitialWidth="+iPadInitialWidth+", iPadInitialHeight="+iPadInitialHeight);
	//test
	//var w= iPadInitialWidth -100;
	//var h = iPadInitialHeight -100;
	//force iFrame to stay within the initial dimensions: replace the height settings of the iFrameContainer of 100% by fixed values. Width is no problem: ipad doesn't resize that
	jQ("#iFrameContainer").css({"height" : iPadInitialHeight +"px"});
}

/*
 * In the options menus, checks the options according to the present settings
 */
function checkChosenOptions()
{
	if(settings["wheelZoomInDirection"] == "up") 
	{
		jQ("#optWheelUp").attr('checked','checked'); 
	} 
	else if(settings["wheelZoomInDirection"] == "down") 
	{
		jQ("#optWheelDown").attr('checked','checked'); 
	} 
	ref("checkBoxShowCoords").checked = (settings["showCoordinatesPanel"])? true :false;
}




//////////////////////////////////////////
//
// 	MENU'S
//
////////////////////////////////////////////	

/*
 * From the datacontainer slideSetsMenus creates all slideSetsMenus (presently: menuAnatomicalRegions and menuInstitutionsModules) and places them in the slideSetsMenuPane
 */
function createSlideSetsMenus()
{
	//if the necessary file with links has not yet loaded, retry
	if(slideSetsMenus.length == 0) {setTimeout("createSlideSetsMenu()",250);return;}
	
	for (slideSetMenuName in slideSetsMenus)
		{
			createSlideSetsMenu(slideSetMenuName);
		}
	
	//set show/hide behaviour of SlideSetsMenuPane
	hideSlideSetsMenuPane() //initially hide SlideSetsMenuPane

}

/*
 * calls html creation of slidesetmenu, appends it and attaches accordion behaviour
 * xx-3-2009 NEW
 * 20-5-2009 CHG removed SlideSetsMenuPaneSenser (mut 1 & 2) and set SlideSetsMenuPaneTab to react to mouseover instead of click (mut 3)
 * 15-2-2012 CHG made it to retry with a timeout if the file with the slideSetsMenuData has not yet loaded - first it simply exited
*/
function createSlideSetsMenu(slideSetMenuName)
{
	//create SlideSetsMenu
	var slideSetsMenuHtml = createSlideSetsMenuHtml(slideSetMenuName); 
	//insert the html
	jQ("#SlideSetsMenuPane").append(slideSetsMenuHtml);	
	//set accordion behaviour
	//CHG 15-2-2012 option alwaysOpen:false changed to collapsible: true  AND active:false //was changed in ui 1.7
	jQ(".slideSetsMenu").accordion({collapsible:true,active:false,autoHeight:false});
}


/*
 * Creates the contents of the SlideSetsMenuPane: the menu listing itself
 * from an slideSetsMenuData with this format: 
 *	"menuAnatomicalRegions":
 *	[
 *		{
 *			"header":{showText:"CardioVascular System",infoText:"infoVariants",slides:""},
 *			"sets":[
 *				{showText:"Vessels",infoText:"infoFrontPageChp",slides:"brain,hippocampus_humaan_normaal_he"},
 *				{showText:"BB",infoText:"infoHepVascVar",slides:""},
 *				{showText:"CC",infoText:"inforenVascVar",slides:""}
 *				]
 *		},
 *	.....
 *	]
 */
function createSlideSetsMenuHtml(slideSetMenuName)
{
	var entry;
	loadedSlideSetMenuNames[loadedSlideSetMenuNames.length] = slideSetMenuName;
	var slideSetsMenuData = slideSetsMenus[slideSetMenuName];
	var str="";
	
	//header level
	str+= "<div id='" + slideSetMenuName + "' class='slideSetsMenu'>"; //1st level gets an id
	for (var i=0;i<slideSetsMenuData.length;i++)
     	{
		header = slideSetsMenuData[i]["header"];
		sets = slideSetsMenuData[i]["sets"];
		//create header
		if(header)
		{
		str+="<h3 class='accordionHeader' onclick='loadSlideSet(\""+header.slides+"\")'>" + header.showText + "</h3>";
		}
			//entries below header
			if(sets)
			{
			str+="<div>";
			for(var y=0;y<sets.length;y++)
				{
				entry = sets[y];
				//create an entry 
				str+="<div class='accordionEntry' onclick='loadSlideSet(\""+entry.slides+"\")'>" + entry.showText + "</div>";			
				}
			str+="</div>";
			}
    	} //end for
	str+= "</div>";	

	return str;
}//end function	


/*
 * shows the slideSetsMenuPane and the requested slideSetMenu in it, or hides the pane
 * @param string slideSetMenuName
 */
function toggleSlideSetsMenuPane(slideSetMenuName)
{
	//alert("clicked, currentSlideSetMenu= "+currentSlideSetMenu+ ", slideSetMenuName="+slideSetMenuName);
	if(jQ("#SlideSetsMenuPane").css("display")=="none" || (currentSlideSetMenu != slideSetMenuName)) //pane closed or wrong menu shown
	{
	//alert("Going to show menu "+ slideSetMenuName);
		//clearTimeout(toSlideSetsMenuPane);
		//	jQ("body").bind("mouseover",hideNavAtMouseOut);
		hideAllSlideSetMenus();
		showSlideSetsMenu(slideSetMenuName);
		
		currentSlideSetMenu = slideSetMenuName;
	}
	else
	{
		hideSlideSetsMenuPane();
	}	
}
	
/*
 * shows the requested slideSetMenu in the slideSetMenuPane
 * @param string slideSetMenuName
 */	
function showSlideSetsMenu(slideSetMenuName)
{
	jQ("#"+slideSetMenuName).show();
	jQ("#SlideSetsMenuPane").show();
	jQ("#slidesContOverlay").show();

}

//if click outside SlideSetsMenuPane direct hide SlideSetsMenuPane	
function hideNavAtClick(e)
{
	var onLeftBorder=(e.pageX<=215)? true : false;
	if(!onLeftBorder) {hideSlideSetsMenuPane();}
}	
	
function hideSlideSetsMenuPane()
	{jQ("#SlideSetsMenuPane").hide();
	jQ("#slidesContOverlay").hide();
	}

function hideAllSlideSetMenus()
{
	names= loadedSlideSetMenuNames.join();
	for(var i=0;i<loadedSlideSetMenuNames.length;i++)
	{
		jQ("#"+loadedSlideSetMenuNames[i]).hide();
	}
}




////////////////////////////////////////////
//
//	CREATE SLIDE-THUMBS
//
/////////////////////////////////////////////


/*
 * creates and shows a series of slides in the left panel
 * @param string stringSlideNames e.g. "a,b,c"
 */
function loadSlideSet(stringSlideNames)
{
	if (typeof stringSlideNames != "string"  || stringSlideNames == "") 
	{
		return false;
	}
	
	currentSlideSetSlideNames = stringSlideNames.split(",");
	loadSlideThumbs();
	
	setTimeout("hideSlideSetsMenuPane()",100);
}


/*
* Creates and shows a set of clickable slides (thumb projected on a slide image) in the slide selection panel (=this page)
* @needs global var slides
*/
function loadSlideThumbs()
{
	var slideRequest;
	
	//first remove any existing slides
	removeSlides();
	
	//load only the slides of a specific SlideSet if that is defined
	if(currentSlideSetSlideNames.length != 0) 
	{
		//debug showNames
		//debug(currentSlideSetSlideNames);

		for(var i=0;i<currentSlideSetSlideNames.length;i++)
		{
			//slideRequest may be only a slideName, or a slideName plus an attached '&view=....' 
			//split it to slideName and possible viewName
			slideRequest 	= currentSlideSetSlideNames[i];
			/*
			 * slideRequest 	= slideRequest.split("&");
			slideName 		= slideRequest[0];
			viewName		= (isSet(slideRequest[1]))? slideRequest[1].replace("view=","") : null;
			*/

			if(slideRequest == "ALL")
			{
				loadAllSlides();
			}
			else
			{
				createSlide(slideRequest)
			}
			

			//alert("Testing Is slide  with name: '" + slides[i].name + "' present amongst: "+ showNames);
			//create thumb if this requested slide exists amongst the available slides //here the global var slides is read!!
	/*		else if(slides[slideName] && (viewName)) 
			{
				//alert("Creating slide with name:"+slideName+ " and viewName "+viewName);
				createSlide(slideName,viewName);			
			}
			else if(slides[slideName]) 
			{
				//alert("Creating slide with name:"+slideName);
				createSlide(slideName);			
			}
	*/		
		}	
	}
	//else simply load all slides (is used in this viewer's version without menus/collections)
	//var slides is a global var defined in slides.js
	else
	{
		loadAllSlides();
	}

	//load ALL available slides in the thumb menu
	function loadAllSlides()
	{
		for(slideName in slides)
		{
			createSlide(slideName);		
		}			
	}
	
	var timer1 = setTimeout("checkFit()",500);	
	var timer2 = setTimeout("checkFit()",1000);	
}

//removes all loaded slides
function removeSlides()
{
	loadedSlides = {}; //empty the memory
	empty(slidesCont);	//empty the DOM
}


/*
* Creates a clickable slide (thumb projected on a slide image)
* Technically: Creates DOM elements for a slide, and appends it to div with id 'slidescont'
* @param string slideRequest. This may be a slideName or 'view=...'
* @param string viewName [optional]
* @needs globar var 'slides' with the slide-info
*
*/
function createSlide(slideRequest)
{ 
	var slideName, viewName = null;
	
	if(slideRequest.indexOf("view=") != -1)
	{
		viewName= slideRequest.replace("view=","");
		var queryArgs = getViewData(viewName);
		slideName = (queryArgs && queryArgs.slide)? queryArgs.slide : null;
	}
	else
	{
		slideName = slideRequest;
	}
	//safety
	if(typeof slides == "undefined" || ! slides[slideName])
		{return;}
	
	//here the global var 'slides' is read!!
	slideData = slides[slideName];	
	loadedSlides[slideName] = slideData; //store the loaded slide object
	
	var cont = document.createElement("li"); 
	jQ(cont).attr("class","cont");
	jQ(cont).attr("className","cont"); //IE8
	
	var slide = document.createElement("img"); 
	slide.src = urlSlideImg;
	slide.setAttribute("class","slide");
	slide.setAttribute("className","slide"); //IE8
	cont.appendChild(slide);

	var img = document.createElement("img");
	//either a specific provided thumb is used (e.g. if slide is vertical and you want thumb horizontal) or the 0-0-0.jpg image
	var ext= (typeof slideData.thumb!="undefined")? slideData.thumb : "TileGroup0/0-0-0.jpg";
	img.src = slideData.path + ext; 	
	var imgId= "thumb_" + slideName;	
	img.setAttribute("id", imgId); 
	img.setAttribute("class","img"); 
	img.setAttribute("className","img"); //IE
	cont.appendChild(img);
	//l("created:"+imgId)
	
	var caption=slideData.title;
	var captionNode= document.createTextNode(caption);
	var div= document.createElement("div"); 
	div.appendChild(captionNode);
	div.setAttribute("class","caption");
	div.setAttribute("className","caption"); //IE
	cont.appendChild(div);
	if(isSet(viewName))
	{
		jQ(div).append(", <em>(view: "+viewName+")</em>");
	}
	
	var writtenNode= document.createTextNode(caption);
	var div= document.createElement("div"); 
	div.appendChild(writtenNode);
	div.setAttribute("class","written");
	div.setAttribute("className","written"); //IE
	cont.appendChild(div);

	var sensor = document.createElement("img"); 
	sensor.src = urlSensorImg; 
	var sensorId= "sensor_"+slideName;	
	sensor.setAttribute("id", sensorId); 
	sensor.setAttribute("class","sensor");
	sensor.setAttribute("className","sensor"); //IE
	cont.appendChild(sensor);

	slidesCont.appendChild(cont);

	fitThumbToSlide(slideName);	
		
	ref(sensorId).onclick=loadIt;
	
	//closure
	function loadIt()
	{
		//load with mode 'view': that is only use viewName
		if(viewName)
		{
			loadVirtualSlide({"viewName":viewName},"view"); 				
		}
		else
		{
			loadVirtualSlide({"slideName":slideName},"auto"); 	
		}
	} 

}

/*
 * fits thumbnail of microscopy specimen onto image of empty glass slide
 * 
 * //cant this be simpler done using the length and width props if there is no thumb?
 */
function fitThumbToSlide(slideName)
	{
		
	//l("fitting "+imgId)
	var thumbImgId = "thumb_" + slideName;
	var thumbRef=ref(thumbImgId);
	var imgRatio;
	
	//try to get dimensions of this image
	//first try to try to read from slides.js
	
	if(loadedSlides[slideName].thumbwidth && loadedSlides[slideName].thumbheight)
		{imgRatio = loadedSlides[slideName].thumbwidth / loadedSlides[slideName].thumbheight;
		}
	//l("1 "+imgId+", imgRatio="+imgRatio)	
	if(!imgRatio)
		{//try to read the image sizes 'life' from the loaded image
		//Opera incorrectly seems to reads some built-in default image with imageratio 1,77727
		try	{dim = getElemDim(thumbRef);
			imgRatio = dim.width / dim.height;
			}
		catch(e){;}
		}	


	//l("2 "+imgId+", imgRatio="+imgRatio)
	
	if(imgRatio>spaceRatio)
		{thumbRef.style.width = "120px";
		if(imgRatio)
			{var scaledHeight = 120 / imgRatio;
			thumbRef.style.height = scaledHeight + "px"; //needed for IE
			thumbRef.style.top= (Math.round((52 - scaledHeight)/2 + 10)) + "px";
			}
		}
	else
		{thumbRef.style.height = "52px";
		if(imgRatio)
			{var scaledWidth = 52 * imgRatio;
			thumbRef.style.width = scaledWidth + "px";  //needed for IE
//			thumbRef.style.left = (Math.round((120 - scaledWidth)/2 + 15)) + "px";
			}
		}
	
	//succesful? show anyhow at attempt2
	if(imgRatio || fitAttempt>=2)
		{fitDone[slideName]= true;
		thumbRef.style.display="block";
		//l("shown "+imgId);
		}
	else	
		{fitDone[slideName] = false;
		thumbRef.style.display="none";
		//l("hidden "+imgId);
		}
	}	
 
/*
 * support function to re-attempt resizing of thumbnail on slide
 */
function checkFit()
 	{//l("checkFit attempt "+fitAttempt)
	for( slideName in loadedSlides)
		{if(!fitDone[slideName])
			{fitThumbToSlide(slideName);}
		}	
	fitAttempt++;	
	}	



//////////////////////////////////////////////////////////////////////
//
// LOADING VIRTUAL SLIDE IN MAIN PANEL
//
/////////////////////////////////////////////////////////////////////


/*
 * loads the slide requested in the settings into the main panel
 * @param map/object settings - {"slideName":"..","x": ".."} etc
 * @param string mode, options are:
 * 	"auto"		: - uses all settings (+ slideName) entered to create the query 
 * 	"view"		: - uses viewName (+ slideName) and discards other details
 * 	"details" 	: - uses the details (x, y, zoom, labels,..) (+ slideName) and discards viewName
 * 
 */
function loadVirtualSlide(settings, mode)
{	
	var query;
	//debug("LoadVirtSlide1",settings);
	if(settings["query"] && mode == "unchanged")
	{
		query = settings["query"];
	}
	else
	{
		var settings = filterSettings(settings,mode);
		//creates URL aimed at the main window
		query = createQuery(settings,mode);
	}
	var URL = urlViewerFile + "?" + query;	
	//load the URL with the sliderequest in the main (=view) window
	//alert("loading viewerFrame with URL= '"+URL+"'");
	window.viewerFrame.location= URL;
	//debug("loadVirt2",settings);	
}


/*
 * filters the 'settings' object according to mode
 * @param map/object settings - {"slideName":"..","x": ".."} etc
 * @param string mode, options are:
 * 	"auto"		: - uses all settings (+ slideName) entered to create the query 
 * 	"view"		: - uses viewName (+ slideName) and discards other details
 * 	"details" 	: - uses the details (x, y, zoom, labels,..) (+ slideName) and discards viewName
 */
function filterSettings(settings,mode)
{
	//debug("filtersettings1",settings)
	//if mode== view, use only the slideName and the viewName and discard all other settings. The view will define all these settings.
	if(mode == "view")
	{
		var newSettings = {};
		newSettings.slideName = settings.slideName;
		newSettings.viewName = settings.viewName;
	}
	//if mode== "details", remove settings.viewName. The 'view' override the details settings.
	else if (mode == "details")
	{
		var newSettings = {};
		for(prop in settings) //note: it's more efficient to delete settings.viewName, but for now dont want side effect to the global object settings
		{
			if(prop != "viewName")
			{
				newSettings[prop] = settings[prop];
			}
		}
	}
	//else mode "auto" = default. Pass through everything unchanged
	else
	{
		var newSettings = settings;
	}
	
	//debug("filtersettings2",newSettings)
	return newSettings;
	
}

/*
 * this function is called by the document in viewerframe when that is loaded
 * from this function you can call things that should be done after the slide is loaded
 * for now that is: applying any settings to the slide that are not passed via the url 
 */
function slideIsLoaded()
{
	applySettings();
}

/*
 * applies the presently set settings in the viewerframe
 */
function applySettings()
{
	//to prevent user confusion, update url of a an urlbar that may still have been open
	//alert("now.urlViewing="+now.urlViewing)
	if(now.urlViewing && window.viewerFrame.startUrlViewing)
	{
		updateUrl();
		window.viewerFrame.startUrlViewing();//and start url live updating
	}
	if(window.viewerFrame.setWheelZoomInDirection)
	{	
		window.viewerFrame.setWheelZoomInDirection(settings["wheelZoomInDirection"]);
		//l("in wheelzoomdirection<br>");
	}
	
	if(window.viewerFrame.showHideCoordinatesPanel)
	{	
		window.viewerFrame.showHideCoordinatesPanel(settings["showCoordinatesPanel"]);
		//l("in showhidecoords set to <br>"+ settings["showCoordinatesPanel"]);
	}	
	if(now.labelMode == "edit")
	{
		openSetLabelPanel();
	}
}

//////////////////////////////////////////
//
// 	USER SETTINGS AND TOOLS
//
////////////////////////////////////////////	
function touchOpenSetLabelPanel()
{
	
}

function openSetLabelPanel(event)
{
	if(window.viewerFrame.setLabelsToEditMode)
	{
		window.viewerFrame.setLabelsToEditMode();
	}
	else
	{
		showWarningChromeLocal();	
	}
	jQ("#editLabelPanel").show();
	jQ("#buttonEditLabelsOn").hide();
	jQ("#buttonEditLabelsOff").show();	
	now.labelMode = "edit";
}


function closeSetLabelPanel()
{
	if(window.viewerFrame.fixLabels)
	{
		window.viewerFrame.fixLabels();
	}
	//hide the labels panel
	jQ("#editLabelPanel").hide();
	//switch the flag icon
	jQ("#buttonEditLabelsOn").show();
	jQ("#buttonEditLabelsOff").hide();
	now.labelMode = "fixed";
	//open the urlbar if there any labels
	//get data on present view, labels, from the viewerframe
	var presentViewSettings = (window.viewerFrame.getDataForUrl)? window.viewerFrame.getDataForUrl() : {};
	//if the QueryPartLabels is not empty (so there are labels), show the urlbar
	if( presentViewSettings.labels != "")
	{
		showUrlBar();
	}
}


function addLabel()
{
	//alert("add Label")
	if(window.viewerFrame && window.viewerFrame.createNewLabel)
	{
		window.viewerFrame.createNewLabel();
		
	}
	else
	{
		showWarningChromeLocal();
	}	
}

/*
 * Gets and shows url in url-bar, and in the in main window shows sizeindicators and starts url updating
 */
function showUrlBar()
{
	
	if(window.viewerFrame && window.viewerFrame.startUrlViewing)
	{
	var url = createUrl();
	jQ("#urlString").html(url);
	jQ("#urlBar").show();
	now.urlViewing = true;	
	window.viewerFrame.startUrlViewing(); //activates dynamic tracking and showing of sizeindicators
	jQ("#buttonShowUrlBar").hide();
	jQ("#buttonCloseUrlBar").show();
	//let the textarea holding the url resize 
	//jQ("#urlString").autosize({append: "\n"}); //doesnt work well yet
	//jQ("#urlString").trigger('autosize'); //doesnt work well yet
	}
	else
	{
	showWarningChromeLocal();
	}
}



/*
 * closes url-bar
 *  and hides size indicators in main window
 */
function closeUrlBar()
{
	jQ("#urlBar").hide();
	//empty it
	jQ("#urlString").html("");
	jQ("#buttonShowUrlBar").show();
	jQ("#buttonCloseUrlBar").hide();

	//hide sizeIndicators in main
	if(window.viewerFrame && window.viewerFrame.stopUrlViewing)
	{
		window.viewerFrame.stopUrlViewing();
	}
	now.urlViewing = false;
}


/*
 * shows/hides settings panel
 */
function showHideSettings()
{
	//for some reason the prop 'display' from the linked .css file, even though in effect, doesn't seem to be read [also jQuery gives 'undefined'). Workaround: if it is empty "", also show.
	if ( ref("settingsDiv").style.display == "none" || ref("settingsDiv").style.display == "") 
	{
		showSettings();
	}
	else 
	{ 
		hideSettings();
	}
}

function showSettings()
{ref("settingsDiv").style.display="block";	
}

function hideSettings()
{ref("settingsDiv").style.display="none";	
}

/*
 * sets wheelzoomdirection programmatically, eg from URL
 */
function setWheelZoomInDirection(zoomInDirection)
{
	switch(zoomInDirection)
	{
	case "up":
		settings["wheelZoomInDirection"] = "up";
		break;
	case "down":
	default:
		settings["wheelZoomInDirection"] = "down";
		break;
	}	
}

/*
 * applies setting (scroll direction to zoom in) to viewerframe
 */
function setWheelZoomDirection()
{

	var wheelZoomInDirection = readradio("settingsForm","wheelZoomDir");
	//ensure correct setting
	wheelZoomInDirection = (wheelZoomInDirection == "up")? "up" : (wheelZoomInDirection == "down")? "down" : wheelZoomInDirection;
	//store it for placing in the URL query
	setLocalSetting("wheelZoomInDirection", wheelZoomInDirection);
	//effectuate it: push it to viewerframe
	if(window.viewerFrame.setWheelZoomInDirection)
	{
		window.viewerFrame.setWheelZoomInDirection(wheelZoomInDirection);
	}
	else
	{
		showWarningChromeLocal();
	}
} 

/*
 * applies setting (show Coordinates panel) to viewerframe
 */	
function showHideCoordsPanel()
{
	//read checkbox
	var bShowCoordinates = (ref("checkBoxShowCoords").checked)? true : false;
	//store it
	setLocalSetting("showCoordinatesPanel",bShowCoordinates);		
	//effectuate it: push it to viewerframe
	if(window.viewerFrame.showHideCoordinatesPanel)
	{
		window.viewerFrame.showHideCoordinatesPanel(bShowCoordinates);
	}	
	else
	{
		showWarningChromeLocal();
	}
}



function showWarningChromeLocal()
{
	if(!window.viewerFrame.document)
	{
		jQ("#chromeLocalWarning").show().fadeOut(5000);
	}
}




//////////////////////////////////////////////////////////////////////
//
// URL handling
//
/////////////////////////////////////////////////////////////////////

/*
 * reads query and stores the data in settings
 * @param object/map queryArgs
 */
function queryArgsToSettings(queryArgs)
{
	
	if (queryArgs.slide) 				{ settings["slideName"] = queryArgs.slide; }
	if (queryArgs.view) 				{ settings["viewName"] = queryArgs.view; }
	if (queryArgs.showcoords) 			{ settings["showCoordinatesPanel"] = (queryArgs.showcoords == 1)? true : false; } 
	if (queryArgs.wheelzoomindirection) { setWheelZoomInDirection(queryArgs.wheelzoomindirection); }; 
//	if (queryArgs.resunits) 			{ resunits = queryArgs.resunits; } 
	if (queryArgs.zoom)					{ settings["zoom"] = Number(queryArgs.zoom); }
	if (queryArgs.x) 					{ settings["x"] = Number(queryArgs.x); }
	if (queryArgs.y) 					{ settings["y"]  = Number(queryArgs.y); }
	if (queryArgs.label) 				{ settings["label"] = queryArgs.label;}
	if (queryArgs.labels) 				{ settings["labels"] = queryArgs.labels;}
//	if (queryArgs.focus) { focusLabel = queryArgs.focus;}
//	if (queryArgs.hidethumb) {hideThumb = queryArgs.hidethumb;}; 

	//add or replace the requested properties according to how it is set in parentQueryArgs, may overwrite default settings
	//querySettings = mergeObjects(querySettings,queryArgs);
}



/*
 * updates url in url-bar
 */
function updateUrl()
{
	//debug("called updateUrl")
	var url = createUrl();
	jQ("#urlString").html(url);
}

/*
 * Gets/creates URL link to present view
 * 
 */
function createUrl()
{
	var baseUrl = getBaseUrlPart();
	
	//get data on present view, labels, from the viewerframe
	var presentViewSettings = (window.viewerFrame.getDataForUrl)? window.viewerFrame.getDataForUrl() : {};
	var combinedSettings = mergeObjects(settings,presentViewSettings);
	//debug(combinedSettings)
	//create Url in mode "details" - that is: show x, y, zoom, labels etc, evetyhring, but discard viewName 
	var query = createQuery(combinedSettings,"details");
	return baseUrl+query;
}

/*
 * creates the URL query from the settings
 * @param map/object settings - {"slideName":"..","x": ".."} etc
 * @param string mode, options are:
 * 	"auto"		: - uses all settings (+ slideName) entered to create the query 
 * 	"view"		: - uses viewName (+ slideName) and discards other details
 * 	"details" 	: - uses the details (x, y, zoom, labels,..) (+ slideName) and discards viewName
 * return  query e.g. "?name1=value1&name2=value2" 
 * 
 */
function createQuery(settings,mode)
{ 
	//debug("createQuery1",settings,mode)	
	if(!isSet(settings))
	{
		return "";	
	}
	mode= (mode == undefined? "auto" : mode);
	
	var qSlide = 		(!isEmpty(settings.slideName))? 			"slide=" 	+ settings.slideName 	: "";
	var qView = 		(!isEmpty(settings.viewName))?				"&view=" 	+ settings.viewName 	: "";
//	var qShowCoords = 	(!isEmpty(settings.showCoordinatesPanel))? ((settings.showCoordinatesPanel)? "&showcoords=1" : "") : "";
//	var qZoomInDir = 	(!isEmpty(settings.wheelZoomInDirection))? ((settings.wheelZoomInDirection == "up")? "&wheelzoomindirection=up" : "") : "";
	var qZoom =			(!isEmpty(settings.zoom))? 					"&zoom=" 	+ settings.zoom 		: "";
	var qX =			(!isEmpty(settings.x))? 					"&x=" 		+ settings.x 			: "";
	var qY =			(!isEmpty(settings.y))? 					"&y=" 		+ settings.y 			: "";
	var qLabels =		(!isEmpty(settings.labels))? 				"&labels="	+ settings.labels 		: "";
	var qLabel =		(!isEmpty(settings.label))? 				"&label=" 	+ settings.label 		: "";

	if(mode=="auto")
	{
		var query =  qSlide + qView + qZoom + qX + qY + qLabels + qLabel; //+ qZoomInDir + qShowCoords;
	}
	if(mode== "details")
	{
		var query =  qSlide + qZoom + qX + qY + qLabels + qLabel; //+ qZoomInDir + qShowCoords; //Note: no qView here!
	}
	if(mode== "view" )
	{
		var query =  qSlide + qView ; //+ qZoomInDir + qShowCoords;
	}
	
	//debug("createQuery2",settings,"created query=", query)
	return query ;	
}





//////////////////////////////////////////
//
// 	General support scripts
//
////////////////////////////////////////////

//
//

/*
 * Gets the part of the url that is NOT the query, that is: protocol + host + pathname (see JavaScript Definitive Guide, Flanagan 3rd ed. p.854),
 * BaseUrl is not an official name, but used for ease here 
 * 
 */
function getBaseUrlPart()
{
	//oLocation =  getLocationOfRequestedWindow(whichWindow);
	var url = location.href;
	var baseUrlPart = url.split("?")[0];
	return baseUrlPart; 
}


function winsize()
{ 
	var viewport = getViewportDimensions();
	var viewportHeight = (typeof viewport != undefined)? viewport.height : 1000;
	var slidesContHeight = viewportHeight - 282; /*282 = height occupied by logo and openslidebox */
	
	//set height of containerdiv
	ref("slidesCont").style.height=	slidesContHeight + "px"; 
	//alert("Set slidesCont height to: "+ slidesContHeight);
	
}

function handleClick(e)
	{e = (e)? e : window.event;
	if(e)
		{var elem=getSrcElem(e);
		var id=elem.id;

		if(!inElem(elem,ref("settingsDiv")) && id!="buttonWrench")
			{hideSettings();}
		if(inElem(elem,ref("slidesContOverlay")))
			{hideSlideSetsMenuPane();}
		}
	
	}


//workaround because doesn't recognize first time else...

function delayedClose()
	{clearTimeout(settingsCloseTimer);
	settingsCloseTimer = setTimeout("hideSettings()",1000);
	}

function cancelClose()
	{clearTimeout(settingsCloseTimer);
	}


	

	

function readradio(radioFormId, inputName) 
    {
	var choices= document.getElementById(radioFormId)[inputName];
	//loop to check one option after the other..
	for (var i=0;i<choices.length;i++)  
		{if(choices[i].checked) //if this option is the selected one...
			{//..collect the value 
			return choices[i].value;
			} 
		} 
    } 
	 
	 
function getSrcElem(evt) //
    {//W3C/NN: event=object passed to func/ IE: event= prop. of window
	var evt= (evt) ? evt : ((window.event)? window.event : null); 	

	if(evt)
		{return (evt.target)? evt.target : ((evt.srcElement)? evt.srcElement : null); // target=W3C/srcElement=IE
		}
    }	
	
//determines whether elem 'elem' is in elem 'cont'
function inElem(elem,cont) //
    {//safety: if one of the two passed elems does not exist, return 
	if(!elem || !cont)	{return null}	

	var levelxelem=elem //start element
	
	//while loop: all the time go up a parent level, till either the sought for container element is encountered or the document level is reached (document - nodetype==9)
	while(levelxelem && levelxelem.nodeType!=9)
		{//...go one level higher, get a new levelxelemref
		levelxelem=(levelxelem.parentNode)? levelxelem.parentNode : null

		//if we encountered the sought container element..
		if(levelxelem && levelxelem==cont)
			{return true;
			}
		}

	//if the container elem was not encountered..
	return false    
    }

function getElemDim(elemRef) 
{
	dim = {};
	if (window.getComputedStyle) {
		var compStyle = getComputedStyle(elemRef, "");
		dim.width = stripPx(compStyle.getPropertyValue("width"));
		dim.height = stripPx(compStyle.getPropertyValue("height"));
	} else if (elemRef.currentStyle) {// var currStyle=elemRef.currentStyle;
		dim.width = stripPx(elemRef.currentStyle.width);
		dim.height = stripPx(elemRef.currentStyle.height);
	}
	// l("img="+elemRef.id+", w="+dim.width+",h="+dim.height)

	if (isOpera && dim.width == 39 && dim.height == 22) {
		return;
	} // workaround Opera measures some default img values if img is not yet
		// loaded
	return dim;
}


//tests if string is in array - as we only use such a simple test dont use the jquery version, because this script must also work without jQ
function inArray(str, arr)
{
	for(var i=0;i<arr.length;i++)
	{
		if(arr[i] === str)
		{
			return i;
		}
	}
	return -1;
}



function empty(elementRef)
{
	//first remove handlers from the childNodes to prevent memory leaks
	children = elementRef.childNodes;
	if(children)
		{
		nrChildren = children.length;
		for(var i=0; i<nrChildren; i++)
			{
				purge(children[i]);
			}
		}
	//then remove the DOM content
	elementRef.innerHTML = "";
}

/*
* 	destroy handlers on an element and its childelements, to prevent memory leakage on IE
*	Source: http://javascript.crockford.com/memory/leak.html
*	@param DOM-element-reference d
*/
function purge(d) {
    var a = d.attributes, i, l, n;
    if (a) {
        for (i = a.length - 1; i >= 0; i -= 1) {
            n = a[i].name;
            if (typeof d[n] === 'function') {
                d[n] = null;
            }
        }
    }
    a = d.childNodes;
    if (a) {
        l = a.length;
        for (i = 0; i < l; i += 1) {
            purge(d.childNodes[i]);
        }
    }
}



//logging?
function l(msg)
	{var msg2=msg+", <br>";
	logwin.innerHTML+=msg2;
	}
//alias conform the viewerframe
function ih(msg)
	{l(msg);}

