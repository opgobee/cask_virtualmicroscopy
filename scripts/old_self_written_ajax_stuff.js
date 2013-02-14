 //OLD STUFF REMOVED FROM ajax-tiledviewer.js

/////////////////////////////////////////////////////////////////////////////////////////////
// AJAX stuff
/////////////////////////////////////////////////////////////////////////////////////////////

function loadLabels(pathToFile)
{		 
		 /*		//load new labels	
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
		*/		
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
	
