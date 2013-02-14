/*
 * TESTS LOADING DATA FROM .js FILE
 * 
 * testfile:
label.js
Contains:
------------------------------------------	
	var jsLabels = {
		"plaque" :	{"label": "Plaque", "popUpText": "Atheromatous plaque, almost completely occluding vascular lumen", "x": "0.418", "y": "0.29"},
	};
---------------------------------------------
*/

/////////////////////////////////////////////////
// METHOD 1 to load .js: with iFrame
// this method works, but on Chrome it only works from server (localhost), on Chrome from file it gives it gives a cross-domain error. 
// Apparently Chrome uses the whole path as domain. As the path to the html page and the .js file is different it issues the corss-domain error. IE,FF,Saf: no problem
////////////////////////////////////////////////
function loadLabels1(pathToFile)
{
		window.dataLoaderFrame.location= "dataloader.html?path=../slides/P-2/labels.js";
		setTimeout("readDataLoaderFrame()",500);	
}

function readDataLoaderFrame()
{
alert(window.dataLoaderFrame.jsLabels.plaque.label);
}

/*
 * HTML BELONGING TO IT:
 * 
 * iFrame in the html file where you want to get the data :
<html>
<iframe id="dataLoaderFrame" name="dataLoaderFrame" src="blank.html" frameborder="0" marginheight="0" marginwidth="0" scrolling="no" style="visibility:hidden"></iframe>
</html>


//the file dataloader.html that is loaded by the function loadlabels1(), above

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title></title>
</head>
<body>
	
<script>
query = location.search.substring(1);
path= query.substring(5);
//alert("dataloader, loading:"+path)
var string="<SCRIPT  src='"+path+"'><\/SCRIPT>";
document.write(string);
setTimeout("readData()",500);
function readData()
{
//alert(jsLabels.plaque.label);
}
</script>

</body>
</html>
*/
	
/////////////////////////////////////////////////
//METHOD 2 to load .js : DOM scripting to dynamically create <script> tag and append that 
//works, on Chrome, FF, IE, Saf, both local and on server
////////////////////////////////////////////////

function loadLabels2(pathToFile)
{
		loadJs(pathToFile);
}

//creates a new script node and loads a js file in it //note: loading a raw json {..} in this way gives error, which cannot be prevented, so only use if not a raw JSON, e.g. safe js file is=    xxxx ={..}
function loadJs(url)
	{
	try
		{var scrip= document.createElement("script");
		scrip.setAttribute("type","text/javascript");
		scrip.setAttribute("src",url);
		scrip.onload= scrip.onreadystatechange = readData;
		return scrIn=document.body.appendChild(scrip);
		}
	catch(e)
		{return;}	
	} 	

function readData()
{
alert(window.jsLabels.plaque.label);
}


/////////////////////////////////////////////////
//METHOD 3 to load .js : with jQuery.getScript
//works from server, not local
////////////////////////////////////////////////

function loadLabels3(pathToFile)
{
		jQ.getScript(pathToFile, readData);
}		 
		

/////////////////////////////////////////////////
//METHOD 4 to load .js : with jQuery.getScript,  with callback getiing the data 
//works from server, not local
//you get the data in var data
////////////////////////////////////////////////

function loadLabels4(pathToFile)
{
		 jQ.getScript(pathToFile,  function(data, textStatus, jqxhr) {
			 alert(data); //data returned
				alert(textStatus); //success
				 alert(jqxhr.status); //200			
			 });
}			 
		
/////////////////////////////////////////////////
//METHOD 5 to load .json :using jQuery.getJSON,  with callback getiing the data 
//works from server, not local
//works only from server, 
//disadvantage: this function using real json "{...}"  works on the server, the fallback loadjs() that also works from file doesn't accept real json  "{...}" (acoording to previous tests), but needs real js: "var xx= {..}"
//so if you want to use json you also need the real js version, so you need 2 files for the same.
////////////////////////////////////////////////
/*
 * file= labels.json
 * {
	"plaque" :	{"label": "Plaque", "popUpText": "Atheromatous plaque, almost completely occluding vascular lumen", "x": "0.418", "y": "0.29"},
	}

 */
function loadLabels5(pathToFile)
{
		 jQ.getJSON("../slides/P-2/labels.json", function(data, textStatus, jqxhr) {
			 alert(data); //data returned
				alert(textStatus); //success
				 alert(jqxhr.status); //200
				
			 });
}

 ////
//OLD PREVIOUS TESTING on apparently less lucky day:
/*
 * results (afterwards most DID succees see above, but just keep this a moment:
 * /*
 * loading of labels is quite patchy (on FF)
 * if you use XHR and add something to the querystring nothing is loaded without error message
 * if you use loadJs() the file is loaded and executed, but the variable jsLabels in it cannot be accessed, is undefined...
 * if you use jQ.getScript() it gives a cross-domain error
 * if you use jQ with cross-domain = true, then no error, but also no data
 * if you try to load json (adapted so it doesn't contain var jslabels= {}, but only the {..}) , then nothing comes, no error
 * In all cases nothing visible in firebug net panel..?
 * Conclusion: the below function is the best up till now, working mostly, but easily broken. 
 */
 * 
 */


	 
