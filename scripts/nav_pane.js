


////////////////////////////////////////////
//
//	Scripts that handle the forming of the clickable images in the nav pane
//
/////////////////////////////////////////////


//Settings
//var slides; //global var 'slides' containing the list of slides. Is now defined and set in slides.js
//var slideSets; //global var 'slideSets' containing the list of slideSets. Is now defined and set in slides.js
var initialSlideSet = "demo1"; //slideSet to load opening
var currentSlideSetName = null; 
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


function init()
	{
	winsize();//do after onload for IE
	setHandlers();
	logwin=document.getElementById("log");
	setCurrentSlideSet(initialSlideSet);
	loadSlides();	
	}
	
	
function setHandlers()
{
	window.onresize=winsize; 
	ref("all").onclick=handleClick;
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
	
function loadSlideSet(slideSetName)
{
	if(slideSetExists(slideSetName))
	{
		setCurrentSlideSet(slideSetName);
		loadSlides(slideSetName);
		
		setTimeout("hideNavPane()",100);
	}
}

//tests if a slideSet with this name is amongst the slideSets
function slideSetExists(slideSetName)
{
	if (typeof slideSetName != "string"  || slideSetName == "") 
	{
		return false;
	}
	
	for(var i=0;i<slideSets.length;i++)
	{
		//if this is the requested slideSet, return true
		if(slideSets[i].name && slideSets[i].name == slideSetName)
		{
			return true;
		}
	}	
	return false;
}


function setCurrentSlideSet(slideSetName)		
{
	if(typeof slideSets != "undefined")
	{
		//set the current slideSetName and the array with slideNames in the set
		for(var i=0;i<slideSets.length;i++)
		{
			//if this is the requested slideSet, load it
			if(slideSets[i].name && slideSets[i].name == slideSetName)
			{
				currentSlideSetName = slideSets[i].name;
				currentSlideSetSlideNames = slideSets[i].slideNames;
			}
		}
	}
}

/*
* loads the slides in global slides or a subset as determined by the currentSlideSetName
*/
function loadSlides()
{
	//first remove any existing slides
	removeSlides();
	
	//load only the slides of a specific SlideSet if that is defined
	if(currentSlideSetName != null) 
	{
			//debug showNames
			showNames = currentSlideSetSlideNames.join();
				

		for(var i=0;i<slides.length;i++)
		{
			//alert("Testing Is slide  with name: '" + slides[i].name + "' amongst: "+ showNames);
			//check if this slide's name is amongst the currentSlideSet-SlideNames
			if(slides[i].name && inArray( slides[i].name, currentSlideSetSlideNames) != -1 ) 
			{
				//alert("Creating slide with name:"+slides[i].name);
				createSlide(slides[i]);
			}			
		}	
	}
	//else simply load all slides (is used in this viewer's version without menus/collections)
	//var slides is a global var defined in slides.js
	else
	{
		for(var i=0;i<slides.length;i++)
		{
			createSlide(slides[i]);		
		}	
	}

	var timer1 = setTimeout("checkFit()",500);	
	var timer2 = setTimeout("checkFit()",1000);	
}

//removes the slides
function removeSlides()
{
	loadedSlides = Array(); //empty the memory
	empty(slidesCont);	//empty the DOM
}


/*
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

//fits thumbnail of microscopy specimen onto image of empty glass slide
//cant this be simpler done using the length and width props if there is no thumb?
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
 
//
function getElemDim(elemRef)
	{dim={};
	if(window.getComputedStyle)
		{var compStyle= getComputedStyle(elemRef,"");
		dim.width= stripPx(compStyle.getPropertyValue("width"));
		dim.height= stripPx(compStyle.getPropertyValue("height"));		
		}
	else if (elemRef.currentStyle)
		{//var currStyle=elemRef.currentStyle;
		dim.width= stripPx(elemRef.currentStyle.width);
		dim.height= stripPx(elemRef.currentStyle.height);		
		}	
	//l("img="+elemRef.id+", w="+dim.width+",h="+dim.height)

	if(isOpera && dim.width == 39 && dim.height== 22) {return;} //workaround Opera measures some default img values if img is not yet loaded
	return dim;
	}
	 
	 

	
function checkFit()
 	{//l("checkFit attempt "+fitAttempt)
	for(var i=0;i<loadedSlides.length;i++)
		{if(!fitDone[i])
			{fitToSlide("slide"+i,i);}
		}	
	fitAttempt++;	
	}	

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
// 	Scripts for the pop-out menu panel
//
////////////////////////////////////////////	
	
;
var menuData = {};
var arLinks = Array();

var glb_pathtoroot ="";

//Settings
var useMenu = "collectionsAnatomicalRegions";


function exists(subject) //
    {return (typeof subject != "undefined")? true : false}
/*
xx-3-2009 NEW
20-5-2009 CHG removed navPaneSenser (mut 1 & 2) and set navPaneTab to react to mouseover instead of click (mut 3)
15-2-2012 CHG made it to retry with a timeout if the file with the arLinks has not yet loaded - first it simply exited
*/
function createMenuPane()
	{
	
	chosenMenu = menuData[useMenu]; //define which links collection to use

	//if the necessary file with links has not yet loaded, retry
	if(typeof chosenMenu == "undefined") {setTimeout("createMenuPane()",250);return;}
	
	arLinks = chosenMenu['data'];
	
	//Load navPane texts
	//var newtext=loadXMLcontents_texts(pathNavPaneTexts)	//path temp set in cask_hybrid.js
	//concatenate the general and page-specific texts 
	//note: general texts are overwritten by specific texts with same textid
	//text=concatassocarray(text,newtext)
	
	//create navPane, navPaneSenser and tabNavPane
	var navPane="<div id='navPane'></div>"//mut 1 DEL: <div id='navPaneSenser'></div>
	//insert the html
	jQ("#all").append(navPane);

	//create navPane list
	var linkList=createMenuPaneList(arLinks); 
	//alert(linkList);
	//insert the html
	jQ("#navPane").append(linkList);
	
	//set accordion behaviour
	//CHG 15-2-2012 option alwaysOpen:false changed to collapsible: true  AND active:false //was changed in ui 1.7
	jQ("#navigation").accordion({header:"a.accordionHeader",collapsible:true,active:false,autoHeight:false});

	//set show/hide behaviour of navPane
	hideNavPane() //initially hide NavPane
	//jQ("#navPaneSenser").mouseover(showNavPane); //show navPane at mouseover senser	//mut 2
//	jQ("#slideBoxOpen").click(toggleNavPane); //on IE (i think) tabNavPane with z-index 1000 'burns' through empty navpaneSenser with z-index 10000, so if mouse on tabNavPaneLeft no mousemove event on navPaneSenser, hence this extra option to open navPane is necessary //mut 3
	jQ("body").click(hideNavAtClick); //hide directly at click outside navPane
	
	}


////////////////////////////////////////////////////////////////////////////////
//support functions	
/*creates a navpanelist from an arLinks like so: 
	[{linkText:"frontPage",infoText:"infoFrontPage",url:"ROOT/pages_pg_2002/lsn_mod/frontpage_lesson/page.htm"}, //will NOT become an accordion header (href works)
	{linkText:"variants",infoText:"infoVariants",url:""}, 														//WILL become an accordion header (href doesn't work)
		[{linkText:"hepaticArt",infoText:"infoHepaticArt",url:""}, //!! if entry is an array the previous entry becomes an accordion header, the array contains the sublist
		{linkText:"hepatoGastricLig",infoText:"infoHepatoGastricLig",url:""},
		{linkText:"hepatoDuodenLig",infoText:"infoHepatoDuodenLig",url:"ROOT/pages_pg_2002/e04.936.450_organ_transplantation/c2_anat_lig_hepatoduoden/page.htm"}
		],
	{linkText:"prep",infoText:"infoPrep",url:""},
		[{linkText:"donorCheck",infoText:"infoDonorCheck",url:""},
		{linkText:"theatreCheck",infoText:"infoTheatreCheck",url:""},
		{linkText:"donorTransportation",infoText:"infoDonorTransportation",url:""},
		{linkText:"introdAnesthTeam",infoText:"infoIntrodAnesthTeam",url:""}
		]	
	]
*/
function createMenuPaneList(arLinks,level)
	{var x,xx,expands,typeAnchor;
	var lvl=(exists(level))? level : 0; //start level
	var str= (lvl==0)? "<ul id='navigation' class='greygradient'>" : "<ul>"; //1st level gets an id

	for (var i=0;i<arLinks.length;i++)
     	{
		x=arLinks[i];//the entry
		xx=arLinks[i+1];//the following entry
		expands = (exists(xx) && (xx instanceof Array))? true : false; //if following entry is a lower level list
		typeAnchor = (expands)? " accordionHeader" : "";//if following entry is a lower level list, present entry becomes an accordion header
		header = (expands)? '<div class="menuheader">'+ x.linkText + '</div>' : x.linkText;
		//create a link entry
		str+="<li class='liLvl"+lvl+" greygradient'><a onclick='loadSlideSet(\""+x.slideSet+"\")' class='aLvl"+lvl+typeAnchor+"'>"+ header + "</a>";
		//if follower up is a lower level list
		if(expands) 
			{str+=createMenuPaneList(xx,lvl+1);//recursively create list a level deeper
			i++; //as following entry was a list, skip this entry when continuing list
			}
		str+="</li>"	
     	} //end for
	str+="</ul>";
	return str;
	}//end function	

	
//from the url got, if empty sets 'javascript:' else sets the url, with 'ROOT' setto correct pathtoroot	
function createHref(url)
	{//if no link specified or empty link, set href to "javascript:" to prevent jumping
	var URL=(exists(url) && url!="")? url : "javascript:";
	//replace 'ROOT' in url by the glb_pathtoroot
	URL=URL.replace(/ROOT\//i,glb_pathtoroot); //NOTE: LAST PART OF REPLACE IS NOT A COMMENT!!!
	return URL;
	}



//NavPane behaviour	
function showNavPane()
	{clearTimeout(toNavPane);
	jQ("#navPane").show();
	jQ("body").bind("mouseover",hideNavAtMouseOut);
	}

function toggleNavPane()
	{if(jQ("#navPane").css("display")=="none")
		{
		showNavPane();
		}
	else
		{
		hideNavPane();
		}	
	}
	
//if mouseover outside navPane delayed hides navPane
function hideNavAtMouseOut(e)	
	{
	//mouseover from inside navPane or its senser?
	//no mouseover from scrollbar in navPane, hence elemincont useless, 165=5 pixels spare necessary for good behaviour 
	var onLeftBorder=(e.pageX<=215)? true : false
	if(onLeftBorder) {clearTimeout(toNavPane)}
	//if mouseover from outside go hide the navPane
	else {delayedHideNavPane();}
	}

//if click outside navPane direct hide navPane	
function hideNavAtClick(e)
	{var onLeftBorder=(e.pageX<=215)? true : false;
	if(!onLeftBorder) {hideNavPane();}
	}	
	
function hideNavPane()
	{jQ("#navPane").hide();
	jQ("body").unbind("mouseover",hideNavAtMouseOut)
	}

var toNavPane;
function delayedHideNavPane()
	{clearTimeout(toNavPane);
	toNavPane=setTimeout("hideNavPane()",500);
	}
	






//////////////////////////////////////////
//
// 	General support scripts
//
////////////////////////////////////////////
		
function ref(i) { return document.getElementById(i);}

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
		var cont= ref("settingsDiv")

		if(!inElem(elem,cont) && id!="wrench")
			{hideSettings();}
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