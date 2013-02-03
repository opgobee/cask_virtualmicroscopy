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
function createNavPane()
	{
	
	chosenMenu = menuData[useMenu]; //define which links collection to use

	//if the necessary file with links has not yet loaded, retry
	if(typeof chosenMenu == "undefined") {setTimeout("createNavPane()",250);return;}
	
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
	var linkList=createNavPaneList(arLinks); 
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
	jQ("#slideBoxOpen").mouseover(showMenuTabs);
	jQ("#slideBoxOpen").mouseout(hideMenuTabs);
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
function createNavPaneList(arLinks,level)
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
			{str+=createNavPaneList(xx,lvl+1);//recursively create list a level deeper
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

function showMenuTabs()
{
	jQ(".menutab").show();
}

function hideMenuTabs()
{
	jQ(".menutab").hide();
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
	
