
<script language="JavaScript" type="text/javascript">
var slidesCont=ref("slidesCont");
var spaceRatio= 2.307692307692308;
var viewportWidth, viewportHeight;
var logwin=document.getElementById("log"); 
var fitDone=[],fitAttempt=1;
var isOpera= (navigator.userAgent.indexOf("Opera") != -1)? true : false;

function l(msg)
	{var msg2=msg+", <br>";
	logwin.innerHTML+=msg2;
	}
	
window.onresize=winsize; 
	
function init()
	{winsize();//do after onload for IE
	}

function createSlide(slideInfo,i)
	{ //l(slideInfo.info)
	var cont = document.createElement("div"); 
	cont.setAttribute("class","cont");
	cont.setAttribute("className","cont"); //IE
	
	var slide = document.createElement("img"); 
	slide.src = "slide.jpg"; 
	slide.setAttribute("class","slide");
	slide.setAttribute("className","slide"); //IE
	cont.appendChild(slide);

	var img = document.createElement("img");
	//either a specific provided thumb is used (e.g. if slide is vertical and you want thumb horizontal) or the 0-0-0.jpg image
	var ext= (typeof slideInfo.thumb!="undefined")? slideInfo.thumb : "TileGroup0/0-0-0.jpg";
	img.src = slideInfo.path + ext; 	
	//l("created:"+imgId)
	var imgId= "slide"+i;	
	img.setAttribute("id", imgId); 
	img.setAttribute("class","img"); 
	img.setAttribute("className","img"); //IE
	cont.appendChild(img);

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
	sensor.src = "emptyimage.gif"; 
	var sensorId= "sensor"+i;	
	sensor.setAttribute("id", sensorId); 
	sensor.setAttribute("class","sensor");
	sensor.setAttribute("className","sensor"); //IE
	cont.appendChild(sensor);
	
	slidesCont.appendChild(cont);

	fitToSlide(imgId,i);	
		
	ref(sensorId).onclick=loadIt;
	function loadIt()
		{loadVirtualSlide(slideInfo);}

	} 

//fits thumbnail of microscopy specimen onto image of empty glass slide
function fitToSlide(imgId,i)
	{
//l("fitting "+imgId)
	var img2=ref(imgId);
	var imgRatio;
	
	//try to get dimensions of this image
	//first try to try to read from slides.js
	//
	
	if(slides && slides[i].thumbwidth && slides[i].thumbheight)
		{imgRatio = slides[i].thumbwidth / slides[i].thumbheight;
		}
	//l("1 "+imgId+", imgRatio="+imgRatio)		
	if(!imgRatio)
		{//try to read the image sizes 'life' from the loaded image
		//Opera incorrectly seems to reads some built-in default image with imageratio 1,77727
		try	{dim = getElemDim(img2);
			imgRatio = dim.width / dim.height;
			}
		catch(e){;}
		}	


	//l("2 "+imgId+", imgRatio="+imgRatio)
	
	if(imgRatio>spaceRatio)
		{img2.style.width = "120px";
		if(imgRatio)
			{var scaledHeight = 120 / imgRatio;
			img2.style.height = scaledHeight + "px"; //needed for IE
			img2.style.top= (Math.round((52 - scaledHeight)/2 + 10)) + "px";
			}
		}
	else
		{img2.style.height = "52px";
		if(imgRatio)
			{var scaledWidth = 52 * imgRatio;
			img2.style.width = scaledWidth + "px";  //needed for IE
			img2.style.left = (Math.round((120 - scaledWidth)/2 + 15)) + "px";
			}
		}
	
	//succesful? show anyhow at attempt2
	if(imgRatio || fitAttempt>=2)
		{fitDone[i]= true;
		ref(imgId).style.display="block";
		//l("shown "+imgId);
		}
	else	
		{fitDone[i] = false;
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
	 
	 
 function create(slides)
 	{for(var i=0;i<slides.length;i++)
		{createSlide(slides[i],i);
		}	
	var timer1 = setTimeout("checkFit()",500);	
	var timer2 = setTimeout("checkFit()",1000);	
	}
	
	
function checkFit()
 	{//l("checkFit attempt "+fitAttempt)
	for(var i=0;i<slides.length;i++)
		{if(!fitDone[i])
			{fitToSlide("slide"+i,i);}
		}	
	fitAttempt++;	
	}	

function loadVirtualSlide(slideInfo)
	{var URL="ajax-viewer.html?path="+slideInfo.path;
	
	for(var prop in slideInfo)
		{if(prop != "path" && prop != "thumb" && prop != "thumbwidth" && prop != "thumbheight" && prop != "info")
			{ URL+= "&" + prop + "=" + slideInfo[prop]; }
		}
	
	parent.view.location= URL;
	}
		
function ref(i) { return document.getElementById(i);}

function stripPx(value) { if (value == ""){ return 0;}
return parseFloat(value.substring(0, value.length - 2));}

function winsize()
	{ viewportWidth = 1300; viewportHeight = 1000; if( typeof( window.innerWidth ) == 'number' ) { viewportWidth = window.innerWidth; viewportHeight = window.innerHeight;} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) { viewportWidth = document.documentElement.clientWidth; viewportHeight = document.documentElement.clientHeight;} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { viewportWidth = document.body.clientWidth; viewportHeight = document.body.clientHeight;}
	
	//set height of containerdiv
	ref("slidesCont").style.height=	(viewportHeight - 120) + "px";
	}

		
create(slides);	
 
