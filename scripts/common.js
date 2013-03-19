

//////////////////////////////////////////////////////////////////////
//
// JavaScript
//
/////////////////////////////////////////////////////////////////////

//TESTING
	
function exists(subject) //
{
	return (typeof subject != "undefined")? true : false;
}

function isSet(subject) //
{
	return ((typeof subject != undefined) && (subject != null))? true : false;
}

function isEmpty(subject)
{
	return (!isSet(subject) || subject === "")? true : false;
}

//MATH
/*
 * Trunks and rounds, as good as 
 * Note: JavaScript has floating point issues at high numbers see diverse online: 
 * http://stackoverflow.com/questions/1379934/large-numbers-erroneously-rounded-in-javascript?rq=1
 * http://stackoverflow.com/questions/4912788/truncate-not-round-off-decimal-numbers-in-javascript
 * but if not too high numbers , seems to work
 * @param number number - the number you want truncated
 * @param number decimals - the number of decimals you want
 * 
 */
function truncate(number,decimals)
{
	multiplier = Math.pow(10,decimals);
	return Math.round(number*multiplier)/multiplier;
}


//STRINGS
/*
 * strips trailing character
 */
function stripChar(str,character)
{
	return (str.slice(-1)==character)? str.slice(0,-1) : str;
}


//ARRAYS

/*
 * searches a certain value in a regular array
 * @param (regular) Array arr - the array to search in
 * @param mixed needle - the thing to search for
 * @return index of the position in array where found or -1 if NOT found.
 */
function searchArray(arr,needle)
{
	var i=0;
	for(i;i<arr.length;i++)
	{
		if(arr[i] === needle) return i;
	}
	return -1;
}

//OBJECTS
/*
 * Counts the number of properties in an object
 * Neccessary because 'length' is not a native property of a javascript object, like it is of an Array.
 * $param the object you want to know the amount of properties ('=length') of
 * @return number - amount of properties ('=length')
 * Source //http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array (modified)
 */
function getObjectLength(obj)
{
    var length = 0, key;
    for (key in obj) 
    {
        if (obj.hasOwnProperty(key)) length++;
    }
    return length;
};

/*
 * Performs a simple merge of two objects/associative arrays
 * //http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically, 
 * jQuery has extend function but not neccessary here
 */
function mergeObjects(obj1,obj2) 
{
    var obj3 = {};
    for (var key in obj1) { obj3[key] = obj1[key]; }
    for (var key in obj2) { obj3[key] = obj2[key]; }
    return obj3;
}


//////////////////////////////////////////////////////////////////////
//
// DOM scripting 
//
/////////////////////////////////////////////////////////////////////

function ref(i) {return document.getElementById(i);}


/*
 * gets a reference to the element the event fired on.
 */
function getTarget(evt) //
{
	//standards: event=object passed to func/ IE: event= prop. of window
	var evt= (evt) ? evt : ((event)? event : null); 	
	
	if(evt)
	{
		return (evt.target)? evt.target : ((evt.srcElement)? evt.srcElement : null); // target=W3C/srcElement=IE
	}
}	


function makeElement(type,id,className)
{
	var el = document.createElement(type); 
	el.setAttribute("id", id);
	el.setAttribute("class", className); 
	el.setAttribute("className", className); //IE
	return el;
}


//////////////////////////////////////////////////////////////////////
//
// Browser 
//
/////////////////////////////////////////////////////////////////////
/*
 * Cross-browser detection of inner dimensions of viewport
 * http://stackoverflow.com/questions/1766861/find-the-exact-height-and-width-of-the-viewport-in-a-cross-browser-way-no-proto
 * @return object {width: ..number..., height: ..number..}
 */
function getViewportDimensions()
{
	var o = {};
	//standards compliant
	if( typeof( window.innerWidth ) == 'number' ) 
	{ 
		o.width = window.innerWidth; 
		o.height = window.innerHeight;
	} 
	//IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
	else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) 
	{ 
		o.width = document.documentElement.clientWidth; 
		o.height = document.documentElement.clientHeight;
	} 
	// older versions of IE
	else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) 
	{ 
		o.width = document.body.clientWidth; 
		o.height = document.body.clientHeight;
	}
	return o;
}
//////////////////////////////////////////////////////////////////////
//
// URL handling 
//
/////////////////////////////////////////////////////////////////////

/*
 * URL encoding method, that seems to adhere to 2005 RFC3986 - http://tools.ietf.org/html/rfc3986
 * Source: http://phpjs.org/functions/urlencode/ 
 * Also see: http://en.wikipedia.org/wiki/Percent-encoding#Types_of_URI_characters
 * Basically it is encodeURIComponent, 	PLUS encoding: !  '  (  ) *  
 * 										PLUS changes encoding of space: original: space becomes %20 (is changed to '+' in this method)
 */
function urlEncode (str) {
	  // http://kevin.vanzonneveld.net
	  // +   original by: Philip Peterson
	  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	  // +      input by: AJ
	  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	  // +   improved by: Brett Zamir (http://brett-zamir.me)
	  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	  // +      input by: travc
	  // +      input by: Brett Zamir (http://brett-zamir.me)
	  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	  // +   improved by: Lars Fischer
	  // +      input by: Ratheous
	  // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
	  // +   bugfixed by: Joris
	  // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
	  // %          note 1: This reflects PHP 5.3/6.0+ behavior
	  // %        note 2: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
	  // %        note 2: pages served as UTF-8
	  // *     example 1: urlencode('Kevin van Zonneveld!');
	  // *     returns 1: 'Kevin+van+Zonneveld%21'
	  // *     example 2: urlencode('http://kevin.vanzonneveld.net/');
	  // *     returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
	  // *     example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
	  // *     returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
	  str = (str + '').toString();

	  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
	  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
	  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
	  replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	}

/*
 * decoder, based on:
 * http://unixpapa.com/js/querystring.html
 * and inverse matched the encoder above
 */
function urlDecode (str)
{
	str = str.replace(/%21/g, '!').replace(/%27/g, "'").replace(/%28/g, '(').replace(/%29/g, ')').replace(/%2A/g, '*').replace(/\+/g,' ')
	try
	{
		return decodeURIComponent(str);	
	}
	catch(e)
	{
		alert("It seems the URL you entered is misformed. Please try to correct it.\nError message:"+ e.message);
	}
}

//////////////////////////////////////////////////////////////////////
//
// HANDLE INPUT 
//
/////////////////////////////////////////////////////////////////////


/*
 * gets variables from the query in the URL
 * src: JavaScript Defin. Guide. Danny Goodman, O'Reilly, 5th ed. p272
 * adapted:
 * @param  map @params [optional] Possible options:
 * "window" 		 	: "self" / ... (windowName)					//read query from another window or frame 
 * "decode" 			: true / false			  					//dont decode at all
 * "dontDecodeKey" 		: "keyName"				  					//one specific key not to decode
 * "dontDecodeKeys" 	: ["keyNameA","keyNameB"] 					//(more than one) specific keys not to decode (specify key names in a regular array)
 * "alternativeQuery" 	: "slide=....&x=..&y=..&labels=(...)(...)" 	//a view : in fact this is a stored query string	
 * @return map {key:value,key:value..}
 */
function getQueryArgs(params)
{
	var pos,argName,argValue;
	var mode={
			"window"			: 	"self",  	//default window self
			"decode"			: 	true,		//default DO decode 
			"dontDecodeKeys"	:	[],			//default no exceptions
			"alternativeQuery"	:	null		//default no alternativequery
	};
	if(params != undefined)
	{
		mode.window  			= (params.window != undefined)? params.window : mode.window; 
		mode.decode  			= (params.decode != undefined)? params.decode : mode.decode;
		mode.alternativeQuery 	= (params.alternativeQuery != undefined)? params.alternativeQuery : mode.alternativeQuery;
		if(params.dontDecodeKey != undefined)
		{
			mode.dontDecodeKeys[mode.dontDecodeKeys.length] = params.dontDecodeKey;
		}
		if(params.dontDecodeKeys != undefined)
		{
			mode.dontDecodeKeys.concat(params.dontDecodeKeys);
		}
	}
	
	var query;
	//use the query that was passed as a parameter (a view : in fact this is a stored query string)
	if(mode.alternativeQuery != null)
	{
		query= mode.alternativeQuery;
	}
	//or read the query from the URL
	else
	{
		var oLocation =  getLocationOfRequestedWindow(mode.window);
		query = oLocation.search.substring(1);
	}
	
	//split query in arg/value pairs
	var pairs = query.split("&"); 
	var args = new Object();
	for(var i=0; i < pairs.length ; i++)
	{
		pos=pairs[i].indexOf("=");
		if(pos == -1) {continue;}
		argName = pairs[i].substring(0,pos);  //get name
		argValue = pairs[i].substring(pos+1); //get value
		if(mode.decode && (searchArray(mode.dontDecodeKeys,argName) == -1 ))
		{
			argValue = decodeURIComponent(argValue);
		}
		//a bit cleaning...
		argValue = preventXss(argValue);
		//alert("argName= "+argName+",argValue= "+argValue)
		args[argName] = argValue;
	}		
	return args	;
}	


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
 * prevent xss
 * cleans input from '<', '>', 'eval(', and 'javascript:'
 * @return cleaned input
 */
function preventXss(input)
{
	//remove <script> and </script> tags. Second line: also remove url-encoded forms of <script> and </script>
	input = input.replace(/<[.]*?script[.]*?>/g, "").replace(/<\/[.]*?script[.]*?>/g, "");;
	input = input.replace(/%3C[.]*?script[.]*?%3E/g, "").replace(/%3C\/[.]*?script[.]*?%3E/g, "");
	
	//remove < and > JavaScript Def Guide 5th ed. Flanagan. p. 268. Second line: also remove url-encoded forms of < and > 
	input = input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	input = input.replace(/%3C/g, "").replace(/%3E/g, "");
	
	//remove 'eval(', and 'javascript:'  http://weblogs.java.net/blog/gmurray71/archive/2006/09/preventing_cros.html.. 
	//Second line: also remove url-encoded form of eval()
	input = input.replace(/eval[\s]*?\(/, "").replace(/javascript\:/, "");
	input = input.replace(/eval%28/, ""); //
	
	//debug(input)
	return input;
}


function stripPx(value) 
{ 
	if (value == "")
	{ 
		return 0;
	}
	return parseFloat(value.substring(0, value.length - 2));
}


/*
 * Tooltip (how to)
 * 1. add class 'hastooltip' to the thing that you wnat the tooltip to work on   <img class="hastooltip" src=""/>
 * 2. add a html element directly after that element and give it class 'tooltip' <div class="tooltip">this wil appear when you hover over the image</div>
 * 3. have class 'tooltip' in your css with display: none and for the rest custom tooltip styling   
 * 
 */
function initTooltips()
{
	jQ(".hastooltip" ).tooltip({
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
		tooltipClass: "tooltip"
	});
}


/*
 * updates the content shown in a tooltip 
 * Note: assumes that the different possibilities are already there in the html like so:
 * <div class=tooltip"><span id="text1">show bla bla</span><span id="text2">hide blabla</span></div>
 * @TODO still find out how to let this also switch alrady displayed tooltip
 */
function switchTooltipContent(tooltipId,contentId)
{
	jQ("#"+tooltipId).children().hide();
	jQ("#"+tooltipId +" #"+contentId).show();
}

/*
 * TOUCH TEST
 * 
 */

/*
 * document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var touch = e.touches[0];
    alert(touch.pageX + " - " + touch.pageY);
}, false);
 * 
 */

/*
function isTouchDevice()
{
	testEl.ontouchstart = function () {
		testEl.onmousedown = null;
		// initialize touch interface
	}	

}
*/


/*
 * creates alert with debuginfo
 * @param one or more arguments to be shown
 */ 
function debug(subjects)
{
	var str="";
	
	for(var i=0;i<arguments.length;i++)
	{	
		showSubject(arguments[i]);	
		str+="\n";
	}
	
	function showSubject(subject)
	{
		//alert(typeof subject)
		if(typeof subject == "object" && subject instanceof Array)
		{	
			str+= "[Array]\n";
			if (subject.length == 0) 
			{
				str+= "EMPTY"
			}
			else
			{
				for(var i=0;i<subject.length;i++)
				{
					if(typeof subject[i] == "object")
					{
						str+="--------------\n\t";
						showSubject(subject[i]);
						//str+="--------------\n";
					}
					else
					{
						str+= i + " : " + subject[i] + "\n";
					}
				}
			}	
		}
		else if(typeof subject == "object" && subject != null)
		{	
			
			var counter= 0, prop;
			str+= "[Object]\n";
			for(prop in subject)
			{
				if(typeof subject[prop] == "object" && subject[prop] != null)
				{
					str+="--------------\n\t";
					showSubject(subject[prop]);
					//str+="--------------\n";
				}
				else
				{
					str+= prop + " : " + subject[prop]  + "\n";;
				}
				counter++;	
			}
			if(counter==0){str+= "EMPTY"}			
		}	
		else if(typeof subject == "string")
		{
			{
				str+= "[string] " + subject;
			}
		}
		else if(typeof subject == "number")
		{
			{
				str+= "[number] " + subject;
			}
		}
		else if(typeof subject == "boolean")
		{
			{
				str+= "[boolean] " + subject? "TRUE" : "FALSE";
			}
		}
		else if(typeof subject == "undefined")
		{
			{
				str+= "undefined";
			}
		}
		else if(subject == null)
		{
			{
				str+= "NULL!";
			}
		}	
	
	} //end showSubject

	ih(str);
}


