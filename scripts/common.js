

//////////////////////////////////////////////////////////////////////
//
// JavaScript
//
/////////////////////////////////////////////////////////////////////

function ref(i) { return document.getElementById(i);}

function exists(subject) //
{
	return (typeof subject != "undefined")? true : false;
}

function isSet(subject) //
{
	return ((typeof subject != undefined) && (subject != null))? true : false;
}

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
// HANDLE INPUT 
//
/////////////////////////////////////////////////////////////////////


/*
 * gets variables from the query in the URL
 * src: JavaScript Defin. Guide. Danny Goodman, O'Reilly, 5th ed. p272
 * @param string whichWindow "self", "viewerFrame". If not specified, it will take this window self
 */
function getQueryArgs(whichWindow)
{
	var pos,argName,argValue;
	var args = new Object();
	var oLocation =  getLocationOfRequestedWindow(whichWindow);
	var query = oLocation.search.substring(1);
	//split query in arg/value pairs
	var pairs = query.split("&"); 
	
	for(var i=0; i < pairs.length ; i++)
	{
		pos=pairs[i].indexOf("=");
		if(pos == -1) {continue;}
		argName = pairs[i].substring(0,pos); //get name
		argValue = pairs[i].substring(pos+1); //get value
		argValue = decodeURIComponent(argValue);
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
	//remove < and > JavaScript Def Guide 5th ed. Flanagan. p. 268 
	var output = input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	//remove 'eval(', and 'javascript:'  http://weblogs.java.net/blog/gmurray71/archive/2006/09/preventing_cros.html
	output = output.replace(/eval\(/, "").replace(/javascript\:/, "")
	return output;
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
 * Tooltip:
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
				for(var i=1;i<subject.length;i++)
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

	alert(str);
}


