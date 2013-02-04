//Settings
//var slides; //global var 'slides' containing the list of slides. Is now defined and set in slides.js
//var slideSets; //global var 'slideSets' containing the list of slideSets. Is now defined and set in slides.js
var initialSlideSetMenu = "collectionsAnatomicalRegions"; //default
var currentSlideSetMenu = null;
var loadedSlideSetMenuNames = Array(); //array with names of the slideSetsMenus that have been created and inserted in the slideSetsMenuPane
var initialSlideSet = "carotid_atherosclerosis,brain"; //slideSet to load opening
//var currentSlideSetName = null; 
var currentSlideSetSlideNames = Array(); //array of the slideNames in the current slideSet
var loadedSlides = Array(); //array with the slides-objects that are loaded

var viewerFile = "../html/ajax-viewer.html";
var urlSlideImg = "../img/slide.jpg";
var urlSensorImg = "../img/emptyimage.gif"
var spaceRatio = 2.307692307692308; //w/h ratio of thumbs projected on slides
var fitDone=[],fitAttempt=1;
var isIE= (navigator.userAgent.indexOf("MSIE") != -1)? true : false; //for IE workarounds
var isOpera= (navigator.userAgent.indexOf("Opera") != -1)? true : false;
var hasJquery = (typeof jQ != "undefined")? true : false; //because this same script file may also be used in simpler version without Jq
var scrollDirection = 1; //determines zoomin/out direction of scroll 
var presentSlideInfo= null; //used for reloading
var settingsCloseTimer;
var slidesCont;
var logwin;
var viewportWidth, viewportHeight;

//var slideSetMenu = "collectionsAnatomicalRegions"; //default
var slideSetsMenus = {};
var slideSetsMenuData = Array();
//var glb_pathtoroot ="";





function init()
	{
	winsize();//do after onload for IE
	setHandlers();
	logwin=document.getElementById("log");
	createSlideSetsMenus();
	loadSlideSet(initialSlideSet);
	loadSlides();	
	}
	
	
function setHandlers()
{
	window.onresize=winsize; 
	ref("all").onclick=handleClick;
	ref("slidesContOverlay").onclick = hideSlideSetsMenuPane;
	ref("settingsDiv").style.display="none";
	ref("settingsForm")["scrollDir"][0].checked=true;
	slidesCont = ref("slidesCont");
	
	if(isIE)
		{ref("optScrollUp").onclick= setScrollDir;
		ref("optScrollDown").onclick= setScrollDir;
		}
	else
		{ref("settingsForm").onchange= setScrollDir;
		}
}	

//////////////////////////////////////////
//
// 	Scripts for the pop-out menu panel with slidesets
//
////////////////////////////////////////////	

/*
 * From the datacontainer slideSetsMenus creates all slideSetsMenus and places them in the slideSetsMenuPane
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
//	jQ("body").click(hideSlideSetsMenuPane); //hide directly at click outside SlideSetsMenuPane

}

/*
 * 
 * xx-3-2009 NEW
 * 20-5-2009 CHG removed SlideSetsMenuPaneSenser (mut 1 & 2) and set SlideSetsMenuPaneTab to react to mouseover instead of click (mut 3)
 * 15-2-2012 CHG made it to retry with a timeout if the file with the slideSetsMenuData has not yet loaded - first it simply exited
*/
function createSlideSetsMenu(slideSetMenuName)
	{
	//create SlideSetsMenu
	var slideSetsMenuHtml = createSlideSetsMenuHtml(slideSetMenuName); 
	//alert(linkList);
	//insert the html
	jQ("#SlideSetsMenuPane").append(slideSetsMenuHtml);
	
	//set accordion behaviour
	//CHG 15-2-2012 option alwaysOpen:false changed to collapsible: true  AND active:false //was changed in ui 1.7
	jQ(".navigation").accordion({header:"a.accordionHeader",collapsible:true,active:false,autoHeight:false});
	}


/*
 * Creates the contents of the SlideSetsMenuPane: the menu listing itself
 * from an slideSetsMenuData like so: 
	"menuAnatomicalRegions":
	[
		{
			"header":{linkText:"CardioVascular System",infoText:"infoVariants",slideSet:""},
			"list":[
				{linkText:"Vessels",infoText:"infoFrontPageChp",slideSet:"vessels"},
				{linkText:"BB",infoText:"infoHepVascVar",slideSet:""},
				{linkText:"CC",infoText:"inforenVascVar",slideSet:""}
				]
		},
*/
function createSlideSetsMenuHtml(slideSetMenuName)
	{
	var entry;
	loadedSlideSetMenuNames[loadedSlideSetMenuNames.length] = slideSetMenuName;
	var slideSetsMenuData = slideSetsMenus[slideSetMenuName];
	var str="";
	
	str+= "<ul id='" + slideSetMenuName + "' class='navigation greygradient'>"; //1st level gets an id
	for (var i=0;i<slideSetsMenuData.length;i++)
     	{
		header = slideSetsMenuData[i]["header"];
		list = slideSetsMenuData[i]["list"];
		//create a header link entry
		str+="<li class='liLvl0 greygradient'><a onclick='loadSlideSet(\""+header.slides+"\")' class='aLvl0 accordionHeader'>"+ header.linkText + "</a>";
			str+="<ul>";
			for(var y=0;y<list.length;y++)
				{
				entry = list[y];
				//create an entry link entry
				str+="<li class='liLvl1 greygradient'><a onclick='loadSlideSet(\""+entry.slides+"\")' class='aLvl1'>"+ entry.linkText + "</a></li>";			
				}
			str+="</ul>";
		str+="</li>";	
     	} //end for
	str+="</ul>";
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
* from the global var slides, loads all slides or a subset, as determined by the currentSlideSetName
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
			showNames = currentSlideSetSlideNames.join();
				

		for(var i=0;i<currentSlideSetSlideNames.length;i++)
		{
			slideName = currentSlideSetSlideNames[i];
			//alert("Testing Is slide  with name: '" + slides[i].name + "' amongst: "+ showNames);
			//check if this slide's name is amongst the currentSlideSet-SlideNames
			if(slides[slideName]) 
			{
				//alert("Creating slide with name:"+slideName;
				createSlide(slides[slideName]);
			}			
		}	
	}
	//else simply load all slides (is used in this viewer's version without menus/collections)
	//var slides is a global var defined in slides.js
	else
	{
		for(slideName in slides)
		{
			createSlide(slides[slideName]);		
		}	
	}

	var timer1 = setTimeout("checkFit()",500);	
	var timer2 = setTimeout("checkFit()",1000);	
}

//removes all loaded slides
function removeSlides()
{
	loadedSlides = Array(); //empty the memory
	empty(slidesCont);	//empty the DOM
}


/*
* Creates DOM elements for a slide, and appends it to div with id 'slidescont'
* @param object slideInfo 
*
*/
function createSlide(slideInfo)
	{ //l(slideInfo.info)
	
	var imgIndex = loadedSlides.length;
	loadedSlides[imgIndex] = slideInfo; //store the loaded slide object
	//l("loading into loadedSlides location:"+imgIndex);	
	
	var cont = document.createElement("li"); 
	cont.setAttribute("class","cont");
	cont.setAttribute("className","cont"); //IE
	
	var slide = document.createElement("img"); 
	slide.src = urlSlideImg;
	slide.setAttribute("class","slide");
	slide.setAttribute("className","slide"); //IE
	cont.appendChild(slide);

	var img = document.createElement("img");
	//either a specific provided thumb is used (e.g. if slide is vertical and you want thumb horizontal) or the 0-0-0.jpg image
	var ext= (typeof slideInfo.thumb!="undefined")? slideInfo.thumb : "TileGroup0/0-0-0.jpg";
	img.src = slideInfo.path + ext; 	
	var imgId= "slide"+imgIndex;	
	img.setAttribute("id", imgId); 
	img.setAttribute("class","img"); 
	img.setAttribute("className","img"); //IE
	cont.appendChild(img);
	//l("created:"+imgId)
	
	var caption=slideInfo.info;
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
	var sensorId= "sensor"+imgIndex;	
	sensor.setAttribute("id", sensorId); 
	sensor.setAttribute("class","sensor");
	sensor.setAttribute("className","sensor"); //IE
	cont.appendChild(sensor);

	slidesCont.appendChild(cont);

	fitToSlide(imgId,imgIndex);	
		
	ref(sensorId).onclick=loadIt;
	
	function loadIt()
		{loadVirtualSlide(slideInfo);}

	} 

/*
 * fits thumbnail of microscopy specimen onto image of empty glass slide
 * 
 * //cant this be simpler done using the length and width props if there is no thumb?
 */
function fitToSlide(imgId,imgIndex)
	{
		
	//l("fitting "+imgId)
	var imgRef=ref(imgId);
	var imgRatio;
	
	//try to get dimensions of this image
	//first try to try to read from slides.js
	//
	
	if(loadedSlides[imgIndex].thumbwidth && loadedSlides[imgIndex].thumbheight)
		{imgRatio = loadedSlides[imgIndex].thumbwidth / loadedSlides[imgIndex].thumbheight;
		}
	//l("1 "+imgId+", imgRatio="+imgRatio)	
	if(!imgRatio)
		{//try to read the image sizes 'life' from the loaded image
		//Opera incorrectly seems to reads some built-in default image with imageratio 1,77727
		try	{dim = getElemDim(imgRef);
			imgRatio = dim.width / dim.height;
			}
		catch(e){;}
		}	


	//l("2 "+imgId+", imgRatio="+imgRatio)
	
	if(imgRatio>spaceRatio)
		{imgRef.style.width = "120px";
		if(imgRatio)
			{var scaledHeight = 120 / imgRatio;
			imgRef.style.height = scaledHeight + "px"; //needed for IE
			imgRef.style.top= (Math.round((52 - scaledHeight)/2 + 10)) + "px";
			}
		}
	else
		{imgRef.style.height = "52px";
		if(imgRatio)
			{var scaledWidth = 52 * imgRatio;
			imgRef.style.width = scaledWidth + "px";  //needed for IE
			imgRef.style.left = (Math.round((120 - scaledWidth)/2 + 15)) + "px";
			}
		}
	
	//succesful? show anyhow at attempt2
	if(imgRatio || fitAttempt>=2)
		{fitDone[imgIndex]= true;
		ref(imgId).style.display="block";
		//l("shown "+imgId);
		}
	else	
		{fitDone[imgIndex] = false;
		ref(imgId).style.display="none";
				//l("hidden "+imgId);
		}

	}	
 
/*
 * support function to re-attempt resizing of thumbnail on slide
 */
function checkFit()
 	{//l("checkFit attempt "+fitAttempt)
	for(var i=0;i<loadedSlides.length;i++)
		{if(!fitDone[i])
			{fitToSlide("slide"+i,i);}
		}	
	fitAttempt++;	
	}	

/*
 * loads the clicked slide into the main panel
 * @param object slideInfo 
 */
function loadVirtualSlide(slideInfo)
	{var URL = viewerFile;

	var count= 0;
	if( slideInfo && slideInfo.path && slideInfo.path != "")
		{for(var prop in slideInfo)
			{//if not a property meant for nav, but a property meant for the main page
			if(prop != "thumb" && prop != "thumbwidth" && prop != "thumbheight" && prop != "info") 
				{if(count == 0) //first arg, prepend the query questionmark
					{ URL+= "?" + prop + "=" + slideInfo[prop]; count=1;}
				else  //next args, prepend ampersand
					{ URL+= "&" + prop + "=" + slideInfo[prop]; }
				}
			}	
		if (scrollDirection=="-1") 	{URL+= "&scrolldirection=-1"; }
		parent.view.location= URL;
		presentSlideInfo=slideInfo; //for reloading
		}
	}
	


//////////////////////////////////////////
//
// 	Functions handling user settings
//
////////////////////////////////////////////	

/*
 * sets the scroll direction to zoom in or out on scroll (up or down)
 */
function setScrollDir()
	{scrollDirection = readradio("settingsForm","scrollDir");
	//alert(scrollDirection)
	if(presentSlideInfo)
		{loadVirtualSlide(presentSlideInfo);}
	else //if page has been reloaded the slide in the view frame will have been reloaded, but nav frame doesn't have the presentSlideInfo
		{try
			{if(parent && parent.view && parent.view.location)
				{var URL=parent.view.location;
				URL=URL.toString();//is object originally
				var x= URL.indexOf("blank.html")
				if(URL.indexOf("blank.html")==-1) //if not the blank start page
					{parent.view.location=URL + "&scrolldirection=" + scrollDirection;}
				}
			}
		catch(e) {}			
		}	
	} 

	





//////////////////////////////////////////
//
// 	General support scripts
//
////////////////////////////////////////////
		
function ref(i) { return document.getElementById(i);}

function exists(subject) //
	{return (typeof subject != "undefined")? true : false}

function stripPx(value) { if (value == ""){ return 0;}
return parseFloat(value.substring(0, value.length - 2));}

function winsize()
	{ viewportWidth = 1300; viewportHeight = 1000; if( typeof( window.innerWidth ) == 'number' ) { viewportWidth = window.innerWidth; viewportHeight = window.innerHeight;} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) { viewportWidth = document.documentElement.clientWidth; viewportHeight = document.documentElement.clientHeight;} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { viewportWidth = document.body.clientWidth; viewportHeight = document.body.clientHeight;}
	
	//set height of containerdiv
	ref("slidesCont").style.height=	(viewportHeight - 120) + "px";
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
	{if ( ref("settingsDiv").style.display=="none") {showSettings()}
	else { hideSettings()}
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