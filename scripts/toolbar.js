/*
 * Creates toolbar in caskviewer
 * Written 2015 by Paul Gobee, dept. of Anatomy & Embryology, Leiden University Medical Center, the Netherlands, Contact: o--dot--p--dot--gobee--at--lumc--dot--nl
 * See also: http://www.caskanatomy.info/microscopy and www.caskanatomy.info/products/caskviewer
 * You are free to use this software for non-commercial use only, and only if proper credit is clearly visibly given wherever the code is used. 
 * This notification should be kept intact, also in minified versions of the code.
 * 
 *  Dependencies:
 *  jQuery - called as 'jQ'
 *  segmenter.js
 * 
 */

jQ( document ).ready(function() {
	


	///////////////////////////////////////
	//Toolpanel
	///////////////////////////////////////
	
	text["normalMode"] = "Normal mode";
	text["start1"] = "Push button 'New Shape' to start a new drawing.";
	text["start2"] = "Push button 'Draw mode' to continue drawing the shape.";
	text["start3"] = "Push button 'Draw mode' to edit any existing shapes, or push button 'New Shape' to start a new drawing.";
	text["drawMode"] = "Draw mode";
	text["drawModeInfo1"] = "'Click around' a structure to outline it.";
	text["drawModeInfo2"] = "You can interrupt drawing to move or zoom the slide by pushing 'Normal mode'. To insert a point between existing points, click just inside shape border.";
	text["drawModeInfo3"] = "Click a shape or point to edit it. To insert a point between existing points, click just inside shape border.";
	text["drawModeInfo4"] = "Drag around a structure to trace an outline around it.<br>You can correct it afterwards.";
	text["newDrawing"] = "New Shape";
	text["newDrawingInfo"] = "Push button 'New Shape' to start a new drawing, or button 'Normal mode' to stop drawing.";
	text["deletePoint"] = "Delete Point";
	text["deleteShape"] = "Delete Shape";
	text["hideShapes"] = "Hide Shapes";
	text["showShapes"] = "Show Shapes";
	text["dragDraw"] = "Draw by dragging";
	text["dragDrawAdvanced"] = "Draw by dragging - Advanced";
	text["clickDraw"] = "Draw by clicking";
	text["gotIt"] = "Got it!";
	text["dontShowAgain"] = "Don't show this again.";
		
	//create and insert the toolpanel at the bottom
	jQ( "body" ).append( '<div id="dialog"><div id="dialogText"></div> <img id="dialogImage" src="../img/polygon.png"> <form id="dialogCheckbox"> <input type="checkbox" id="showchoice" name="showchoice" value="noshow">'+text["dontShowAgain"]+'</form> </div>'
			+'<ul id="menuDrawMethod" >'
			+'  <li id="menuDrawMethod_dragDraw"><span class="ui-icon ui-icon-blank"></span>'+text["dragDraw"]+'</li>'
			+'  <li id="menuDrawMethod_dragDrawAvanced"><span class="ui-icon ui-icon-blank"></span>'+text["dragDrawAdvanced"]+'</li>'
			+'  <li id="menuDrawMethod_clickDraw"><span class="ui-icon ui-icon-blank"></span>'+text["clickDraw"]+'</li>'
			+'</ul>'
			+'<div id="drawToolPanel">'
			+'<button id="btNormalMode" >'+ text["normalMode"] +'</button>'
			+'<button id="btDrawMode">'+ text["drawMode"] +'</button>'
			+'<span id="drawTools">'	
			+'<button id="btDrawPolygon">&nbsp;</button>' /*for some reason a character must be in button, else button will be displaced downwards*/
			+'<button id="btDrawPolygonOptions">+</button>' /*for some reason a character must be in button, else button will be displaced downwards*/
		//	+'<button id="btNewDrawing">'+ text["newDrawing"] +'</button>'
			+'<button id="btDeletePoint" class="nonActive">'+ text["deletePoint"] +'</button>'
		//	+'<button id="btDeletePolygon" class="nonActive">'+text["deleteShape"]+'</button>'
			+'</span>'	//eof span drawtools
			+'<button id="btShowHideShapes">'+text["hideShapes"]+'</button>'		
			+'<div id="toolBarInfo">'+text["start1"]+'</div>'
			+'</div>' );
	
	jQ( "#menuDrawMethod" ).menu({
		select: function( event, ui ) {
			var chosenItemId = ui.item.attr("id");
			var drawMethod = chosenItemId.substring(15);
			jQ( "#menuDrawMethod > li > span" ).removeClass('ui-icon-check');
			ui.item.find('span').addClass('ui-icon-check');
			DrawTools.activate(drawMethod);
			event.stopPropagation();
			},	
	})
	

//	jQ( "#menuDrawMethod" ).menu( "option", "position", { my: "left top", at: "right-5 top+5", of: "#namePanel"} );
	/*positioning in menu() doesn't seem to work, so call it separately*/
	jQ( "#menuDrawMethod" ).position({ my: "left bottom", at: "left top-18", of: "#btDrawPolygon"}).hide(); //positioning top incorrect on Chrome

	jQ("#showchoice:checkbox").change(function(){
		if(this.checked)
			{ToolButton.settings.showDialog = false}	
	})
	
	// button events
	
	// button 'Normal mode' - action
	jQ('button#btNormalMode').click(function(){
		ToolButton.normalMode();
	});
	
	// button 'Draw mode' - action
	jQ('button#btDrawMode').click(function(){
		ToolButton.drawMode();
	});
	
	// button 'Draw mode' - action
/*	jQ('button#btNewDrawing').click(function(){
		
	});
*/	
	// button 'Delete handlepoint' - action
	jQ('button#btDeletePoint').click(function(){
		ToolButton.deleteHandlePoint();
	});
	
	// button 'Delete handlepoint' - action
/*	jQ('button#btDeletePolygon').click(function(){
		ToolButton.deletePolygon();		
	});
*/	
	// button 'Show/hide shapes' - action
	jQ('button#btShowHideShapes').click(function(){
		ToolButton.toggleShowHideShapes();
	});
	
	// button 'drawpolygon' - action
	jQ('button#btDrawPolygon').click(function(event){
		ToolButton.newPolygon();
	});

	jQ('button#btDrawPolygonOptions').click(function(event){
		ToolButton.chooseDrawMethod(event);
	});
	
	//////////////////////////////////////////////// 
	// End toolpanel
	////////////////////////////////////////////////
	
	//hide temporary elements
	jQ("body").click(function(event) {
		if(event.target && event.target.id != "menuDrawMethod")
		{
			jQ("#menuDrawMethod").hide();			
		}
	});

	//init draw panel
	jQ('button#btNormalMode').click();
	
	jQ( "#dialog" ).dialog({ 
		autoOpen: false, 
		modal:true,
		dialogClass: "noTitleBar",
		  buttons: [
		    {
		      text: text["gotIt"],
		      click: function() {
		        jQ( this ).dialog( "close" );
		      }
		    }
		  ]	
	});		
	
}); //end document ready




/*
 * stores all button actions
 */
var ToolButton = 
{

	settings: {
		"showDialog": true
	},
	
	normalMode: function ()
	{
		var startText = "";
		//set to normal state
		if(shapeObjects)
		{
			shapeObjects.setStateNormal();
			shapeObjects.deactivateActivePolygon();
			shapeObjects.deactivateActiveHandlePoint();
			
			if( !shapeObjects.hasPolygonUnderConstruction())
			{
				ToolButton.normalizeButtonNewDrawing();
			}
			startText = (shapeObjects.getCountShapes == 0)? text["start1"] : (shapeObjects.hasPolygonUnderConstruction())? text["start2"] : text["start3"];
		}
		jQ('button#btNormalMode').addClass("down");
		jQ('button#btDrawMode').removeClass("down");
		jQ('button#btDrawMode').css("color","#808080");
		jQ('span#drawTools').css("visibility","hidden");
		jQ('div#toolBarInfo').html(startText);
		//return draw layer below the labels
		jQ('#svgContainer').css({"z-index":1});


	},	

	drawMode: function (param)
	{

		jQ('button#btNormalMode').removeClass("down");
		jQ('button#btDrawMode').addClass("down");
		jQ('button#btDrawMode').css("color","#000000");
		jQ('span#drawTools').css("visibility","visible");
		ToolButton.toggleShowHideShapes("show");
		//temporarily put draw layer above the labels to allow receiving all events well on the svg elements
		jQ('#svgContainer').css({"z-index":100});
    	
	},
	
	newPolygon: function ()
	{
		if( !shapeObjects.hasPolygonUnderConstruction() )
		{
			//shapeObjects.deactivateActiveHandlePoint();
			shapeObjects.newPolygon();
			if(settings.drawMethod == "trailDraw")
			{		
				initTrailDraw();
			}
			//switch to drawMode automatically
			ToolButton.drawMode();
			var drawModeText = "";
			//set to draw state
			if(shapeObjects)
			{
				shapeObjects.setStateDrawPolygon();
				//returns to a polygon that is still under construction (but no need to activate a new polygon that has just been activated) 
				if(shapeObjects.hasPolygonUnderConstruction())
				{
					shapeObjects.polygonUnderConstruction.activate();			
				}
				//drawModeText = (shapeObjects.getCountShapes() == 0)?  text["start1"]: (param == "justStartedNew")? text["drawModeInfo1"] : (shapeObjects.hasPolygonUnderConstruction())? text["drawModeInfo2"] : text["drawModeInfo3"];
				//jQ('div#toolBarInfo').html(drawModeText);

			}			
			ToolButton.setPolygonButtonToNew();
			if(ToolButton.settings.showDialog)
			{
				jQ( "#dialogText" ).html(text["drawModeInfo4"])
				jQ( "#dialog" ).dialog( "open" );
			}
			
		}	
	},
	
	setPolygonButtonToNew: function()
	{
		jQ('button#btDrawPolygon').addClass("new");
	},
	
	unsetPolygonButtonToNew: function()
	{
		jQ('button#btDrawPolygon').removeClass("new");
	}, 
	
	activateButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('nonActive').addClass('active');
		jQ('div#toolBarInfo').html(text["newDrawingInfo"]);

	},
	
	normalizeButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('active').removeClass('nonActive');

	},
	
	deactivateButtonNewDrawing: function()
	{
		jQ('button#btNewDrawing').removeClass('active').addClass('nonActive');

	},
	
	//sets the style on button 'delete active handle point' that indicates that there is a handlepoint active, thus may be deleted
	activateButtonDeleteHandlePoint: function()
	{
		jQ('button#btDeletePoint').removeClass('nonActive').addClass('active');
	},

	//sets the style on button 'delete active handle point' that indicates that there is no handlepoint active, thus none can be deleted
	deactivateButtonDeleteHandlePoint:function()
	{
		jQ('button#btDeletePoint').removeClass('active').addClass('nonActive');
	},
	
	deleteHandlePoint: function()
	{
		shapeObjects.deleteActiveHandlePoint();
	},
	
	//sets the style on button 'delete active handle Polygon' that indicates that there is a handlePolygon active, thus may be deleted
	activateButtonDeletePolygon: function()
	{
		jQ('button#btDeletePolygon').removeClass('nonActive').addClass('active');
	},

	//sets the style on button 'delete active handle Polygon' that indicates that there is no handlePolygon active, thus none can be deleted
	deactivateButtonDeletePolygon: function()
	{
		jQ('button#btDeletePolygon').removeClass('active').addClass('nonActive');
	},
	
/*	deletePolygon: function()
	{
		if (confirm( text["confirmDeleteShape"] ) == true) 
		{
			shapeObjects.deleteActivePolygon();
	    } 
	},
*/		
	/*
	 * normal it toggles, but can also be steered directly with param "show" or "hide"
	 */
	toggleShowHideShapes: function(param)
	{
		param = (typeof param != "undefined")? param : null;
		
		if( param == "hide" || ( !param && jQ('#'+idSvgContainer).css("visibility") == "visible" ) )
		{
			jQ('#'+idSvgContainer).css("visibility", "hidden");
			jQ('button#btShowHideShapes').html(text["showShapes"]);	
			ToolButton.normalMode();
			jQ('div#toolBarInfo').html("");
			
		}
		else if(param == "show" || ( !param && jQ('#'+idSvgContainer).css("visibility") == "hidden") )
		{
			jQ('#'+idSvgContainer).css("visibility", "visible");
			jQ('button#btShowHideShapes').html(text["hideShapes"]);
		}
	},
	
	chooseDrawMethod: function(event)
	{
		jQ( "#menuDrawMethod" ).toggle();
		event.stopPropagation();
	}
	
}; //eof ToolButton


var DrawTools = 
{

	activate: function (drawToolName)
	{
		switch(drawToolName) 
		{
	    case "dragDraw":
	    case "dragDrawAdvanced":
	    default:
	    	settings.drawMethod = "trailDraw";
	        break;
	    case "clickDraw":
	    	settings.drawMethod = "clickDraw";
	        break;

		} 

	}
}
	