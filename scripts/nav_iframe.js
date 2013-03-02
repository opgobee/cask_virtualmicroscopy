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
var initialSlideSet = "carotid_atherosclerosis,brain"; //slideSet to load opening
var urlViewerFile = "../html/main.html";
var urlSlideImg = "../img/slide.jpg";
var urlSensorImg = "../img/emptyimage.gif";
var spaceRatio = 2.307692307692308; //w/h ratio of thumbs projected on slides

//Local Settings in nav  
settings = {}; 
settings["slideName"] = null; //slideName (the code-slidename)
settings["wheelZoomInDirection"] = "down"; //user-option: zoomin/out direction of wheel, default wheeldown = zoomin
settings["showCoordinatesPanel"] = false; //user-option: default hide coords panel
settings["zoom"] = null;
settings["cX"] = null; //the x coordinate (fraction of image) to center on
settings["cY"] = null; //the y coordinate (fraction of image) to center on
settings["label"] = null; // a single label to be set on the center x,y location
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
var settingsCloseTimer;
var slidesCont;
var logwin;
var viewportWidth, viewportHeight;
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
	
	//reads data from different inputs (at present only yet from the URL)
	readDataToSettings();
	
	winsize();//do after onload for IE
	setHandlers();
	//sets default options in the options menu
	checkChosenOptions();
	//creates the menus: Menus: menuAnatomicalRegions and menuInstitutionsModules, containing headers, containing entries (entry refers to a set of slides to be shown in the slide-selection panel [=that is: here])
	createSlideSetsMenus();
	//load an initial slideSet in the slide-selection panel [=that is: here]) 
	loadSlideSet(initialSlideSet);
	//if a slide is requested in the URL, load the requested slide in the main panel
	if(settings["slideName"] != null) //loads the slide that is requested in the query : e.g. '...?slide=carotis'
		{
		loadVirtualSlide(settings["slideName"]); 
		}
	}

/*
 * Reads data from different inputs and sets settings from these data
 */
function readDataToSettings()
{
	//set or adapt globals with query information
	readQueryToSettings();
	//possible other data sources here
	//Note: slides data remain in var 'slides' and are read from there
}

/*
 * reads query and stores the data in settings
 */
function readQueryToSettings()
{
	//read query from URL of parent (the frameset)
	//get variables from query in URL
	var queryArgs= getQueryArgs();
	
	if (queryArgs.slide) 				{ settings["slideName"] = queryArgs.slide; }
	if (queryArgs.showcoords) 			{ settings["showCoordinatesPanel"] = (queryArgs.showcoords == 1)? true : false; } 
	if (queryArgs.wheelzoomindirection) { setWheelZoomInDirection(queryArgs.wheelzoomindirection); }; 
//	if (queryArgs.resunits) 			{ resunits = queryArgs.resunits; } 
	if (queryArgs.zoom)					{ settings["zoom"] = Number(queryArgs.zoom); }
	if (queryArgs.x) 					{ settings["cX"] = Number(queryArgs.x); }
	if (queryArgs.y) 					{ settings["cY"]  = Number(queryArgs.y); }
	if (queryArgs.label) 				{ settings["label"] = queryArgs.label;}
//	if (queryArgs.focus) { focusLabel = queryArgs.focus;}
//	if (queryArgs.hidethumb) {hideThumb = queryArgs.hidethumb;}; 

	//add or replace the requested properties according to how it is set in parentQueryArgs, may overwrite default settings
	//querySettings = merge_options(querySettings,queryArgs);

}



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

function setHandlers()
{
	window.onresize=winsize; 
	ref("nav").onclick=handleClick;
	ref("slidesContOverlay").onclick = hideSlideSetsMenuPane;
	ref("closeUrlBar").onclick = closeUrlBar;
	jQ(".wheelZoomDir").change(setWheelZoomDirection);
	jQ("#checkBoxShowCoords").change(showHideCoordsPanel);
	initTooltips();
	slidesCont = ref("slidesCont");
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
// 	Scripts for the pop-out menu panel with slidesets
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
//	Scripts that handle the forming of the clickable images in the nav pane
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
	loadSlides();
	
	setTimeout("hideSlideSetsMenuPane()",100);

}


/*
* Creates and shows a set of clickable slides (thumb projected on a slide image) in the slide selection panel (=this page)
* @needs global var slides
*/
function loadSlides()
{
	var slideName;
	
	//first remove any existing slides
	removeSlides();
	
	//load only the slides of a specific SlideSet if that is defined
	if(currentSlideSetSlideNames.length != 0) 
	{
			//debug showNames
			//showNames = currentSlideSetSlideNames.join();
				

		for(var i=0;i<currentSlideSetSlideNames.length;i++)
		{
			slideName = currentSlideSetSlideNames[i];
			
			if(slideName == "ALL")
			{
				//load ALL available slides
				for(slideName in slides)
				{			
					createSlide(slideName);
				}
			}
			//alert("Testing Is slide  with name: '" + slides[i].name + "' amongst: "+ showNames);
			//check if this slide's name is amongst the currentSlideSet-SlideNames
			else if(slides[slideName]) 
			{
				//here the global var slides is read!!
				//alert("Creating slide with name:"+slideName;
				createSlide(slideName);
			}			
		}	
	}
	//else simply load all slides (is used in this viewer's version without menus/collections)
	//var slides is a global var defined in slides.js
	else
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
* @param string slideName
* @needs globar var 'slides' with the slide-info
*
*/
function createSlide(slideName)
	{ 
	
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
	
	var caption=slideData.info;
	var captionNode= document.createTextNode(caption);
	var div= document.createElement("div"); 
	div.appendChild(captionNode);
	div.setAttribute("class","caption");
	div.setAttribute("className","caption"); //IE
	cont.appendChild(div);

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
		{//setQuerySetting("slide",slideName);
		//cleanQuerySettings(); //reset zoom and location on slide to default starting situation
		loadVirtualSlide(slideName);
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
 * reloads the with the present settings (slide requested, showCoords etc) of querySettings 
 * Note: if there was not yet a slide requested in the query, it will add a slide request, if there was already a (previous) slide requested in the query, it will replace it.
 * @param boolean clean TRUE if you want only the slide plus user preferences remaining and the rest cleaned from querySettings
 * @deprecated not used anymore
 */
/*
function reload(clean)
{
	//read URL parts of parent (the frameset)
	//gets the non-query part of the URL e.g. 'http://www.microscopy.org/viewer/full.html'
	baseUrlPart = getBaseUrlPart("parent");
	//gets the queryparts in an associative array/object
	queryArgs= getQueryArgs();
	//add or replace the requested properties 
	querySettings = merge_options(queryArgs,querySettings);
	if(clean)
		{
			cleanQuerySettings();
		}
	//re-create URL and reload
	var query = createQuery(querySettings);
	var URL = baseUrlPart + query;
	//alert("reloading  with URL= '"+URL+"'");
	window.location = URL;	
}
*/

/*
 * loads the slide requested in the settings into the main panel
 * 
 */
function loadVirtualSlide(slideName)
	{	
	//alert("loadVirtualSlide of" + slideName);
	if(slides[slideName])
		{
		settings["slideName"] = slideName;
		//creates URL aimed at the main window 
		var query = createQuery(settings);
		var URL = urlViewerFile + query;	
		//alert("loading viewerFrame with URL= '"+URL+"'");
		//load the URL with the sliderequest in the main (=view) window
		window.viewerFrame.location= URL;
		}
	else
		{
		alert("The requested slide: '"+ slideName + "' is not present in the repository.\nPlease check the name of the slide you requested.");
		}
	}
	
/*
 * creates the URL query from the settings
 * @param object params with format: ["name"= "value"] 
 * return  query e.g. "?name1=value1&name2=value2" 
 * 
 */
function createQuery(params)
{ 
	if(!isSet(params))
	{
		return "";	
	}
	var qSlide = 		(isSet(params["slideName"]))? 				"slide=" + params["slideName"] : "";
	var QShowCoords = 	(isSet(params["showCoordinatesPanel"]))? ((params["showCoordinatesPanel"])? "&showcoords=1" : "") : "";
	var QZoomInDir = 	(isSet(params["wheelZoomInDirection"]))? ((params["wheelZoomInDirection"] == "up")? "&wheelzoomindirection=up" : "") : "";
	var qZoom =			(isSet(params["zoom"]))? 					"&zoom=" + params["zoom"] : "";
	var cX =			(isSet(params["cX"]))? 						"&x=" + params["cX"] : "";
	var cY =			(isSet(params["cY"]))? 						"&y=" + params["cY"] : "";
	var qLabel =		(isSet(params["label"]))? 					"&label=" + params["label"] : "";

//	if (queryArgs.focus) { focusLabel = queryArgs.focus;}
//	if (queryArgs.hidethumb) {hideThumb = queryArgs.hidethumb;}; 
	
	var query = "?" + qSlide + qZoom + cX + cY + qLabel + QZoomInDir + QShowCoords;
	//alert(query)
	return query ;	
}

/*
 * cleans the query settings from all but the requested slide
 */
/*
function cleanQuerySettings()
{
	for(prop in querySettings)
	{
		if(prop == "slide") 
			{continue;}
		else 
			{delete(querySettings[prop]);};
	};
}
*/

/*
 * this function is called by the document in veiwerframe when that is loaded
 * from this function you can call things that should be done after the slide is loaded
 * for now that is: applying any settings to the slide that are not passed via the url 
 */
function slideIsLoaded()
{
	applySettings();
}

//////////////////////////////////////////
//
// 	Functions handling user settings
//
////////////////////////////////////////////	

/*
 * sets a property in the global associative array querySettings, which is used to load the virtual slide with the required settings 
 */
/*function setQuerySetting(name, value)
{
	querySettings[name]=value;
}
*/

/*
 * sets a property in the local associative array 'settings' 
 */
function setLocalSetting(name, value)
{
	settings[name]=value;
}

/*
 * sets the scroll direction to zoom in or out on scroll (up or down)
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

/*
 * applies the presently set settings in the viewerframe
 */
function applySettings()
{
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
}


/*
 * Gets/creates URL link to present view
 * 
 */
function getUrl()
{
	var baseUrl = getBaseUrlPart();
	
//NOte; busy here: you want to get it from viewerframe settings instead of from the url
	//debug(getQueryArgs("viewerFrame"));
	var presentViewSettings = (window.viewerFrame.getPresentViewSettings)? window.viewerFrame.getPresentViewSettings() : {};
	//debug("presentViewSettings",presentViewSettings);
	var combinedSettings = merge_options(settings,presentViewSettings);
	//debug("combinedSettings",combinedSettings);
	var query = createQuery(combinedSettings);

	//var imgCenter = getVisibleImgCenter();
//	url+= "&x=" + imgCenter.x;
//	url+= "&y=" + imgCenter.y;
	return baseUrl+query;

}


function showUrl()
{
	
	if(jQ("#urlBar").css("display") == "block")
		{
		closeUrlBar();
		return;
		}
	else if(window.viewerFrame && window.viewerFrame.showSizeIndicators)
		{
		url = getUrl();
		jQ("#urlString").html(url);
		jQ("#urlBar").show();
		window.viewerFrame.showSizeIndicators()
		}
	else
		{
		showWarningChromeLocal();
		}
}

function updateUrl()
{
	url = getUrl();
	jQ("#urlString").html(url);
}

function closeUrlBar()
{
	jQ("#urlBar").hide();
	if(window.viewerFrame && window.viewerFrame.hideSizeIndicators)
	{
		window.viewerFrame.hideSizeIndicators()
	}
}


function showWarningChromeLocal()
{
	if(!window.viewerFrame.document)
	{
		jQ("#chromeLocalWarning").show().fadeOut(5000);
	}
}



//////////////////////////////////////////
//
// 	General support scripts
//
////////////////////////////////////////////

//
//
/*
 * gets location object!! (not string URL) from the requested window
 * 
 */
function getLocationOfRequestedWindow(whichWindow)
{
	var whichWindow =(typeof whichWindow == "undefined")? "self" : whichWindow;
	if(whichWindow == "undefined" || whichWindow == "self")
	{
		oLocation = location;
	}
	else 
	{
		oLocation = window[whichWindow].location;
	}		
	return oLocation;
}

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

/*
 * gets variables from the query in the URL
 * src: JavaScript Defin. Guide. Danny Goodman, O'Reilly, 5th ed. p272
 * @param string whichWindow "self", "viewerFrame". If not specified, it will take this window self
 */
function getQueryArgs(whichWindow)
	{var URL,pos,argName,argValue,query;
	var args = new Object();
	
	oLocation =  getLocationOfRequestedWindow(whichWindow);
	query = oLocation.search.substring(1);
	//query = location.search.substring(1);
	
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




function stripPx(value) { if (value == ""){ return 0;}
return parseFloat(value.substring(0, value.length - 2));}

function winsize()
	{ viewportWidth = 1300; viewportHeight = 1000; if( typeof( window.innerWidth ) == 'number' ) { viewportWidth = window.innerWidth; viewportHeight = window.innerHeight;} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) { viewportWidth = document.documentElement.clientWidth; viewportHeight = document.documentElement.clientHeight;} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { viewportWidth = document.body.clientWidth; viewportHeight = document.body.clientHeight;}
	
	//set height of containerdiv
	ref("slidesCont").style.height=	(viewportHeight - 282) + "px"; /*282 = height occupied by logo and openslidebox */
	}

function handleClick(e)
	{e = (e)? e : window.event;
	if(e)
		{var elem=getSrcElem(e);
		var id=elem.id;

		if(!inElem(elem,ref("settingsDiv")) && id!="wrench")
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

function showHideSettings()
	{//for some reason the prop 'display' from the linked .css file, even though in effect, doesn't seem to be read [also jQuery gives 'undefined'). Workaround: if it is empty "", also show.
	if ( ref("settingsDiv").style.display == "none" || ref("settingsDiv").style.display == "") 
		{showSettings();}
	else { hideSettings();}
	}

function showSettings()
	{ref("settingsDiv").style.display="block";	
	}
function hideSettings()
	{ref("settingsDiv").style.display="none";	
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

/*
 * Performs a simple merge of two objects/associative arrays
 * //http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically, 
 * jQuery has extend function but not neccessary here
 */
function merge_options(obj1,obj2) 
{
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
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

