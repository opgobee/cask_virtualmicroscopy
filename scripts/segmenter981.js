/*
* Segmenter: to demarcate areas in images
* Dependencies: svg-x.x.x..min.js
*
*/

var svgArea; 

//initialize svg canvas
jQ( document ).ready(function() {
	
	if (SVG.supported) 
	{
		svgArea = SVG('svgContainer');
		svgArea.attr("style", "border: 1px solid #ff0000;");
		svgArea.attr("viewBox", "0 0 12480 25581");
		
	} 
	else 
	{
		alert('Your browser unfortunately does not support SVG, the technique used for segmenting.\nPlease switch to one of the following browsers to allow segmenting:\n\nDESKTOP:\n  Firefox 3+\n  Chrome 4+\n  Safari 3.2+\n  Opera 9+\n  Internet Explorer 9+\n\nMOBILE:\n  iOS Safari 3.2+\n  Android Browser 3+\n  Opera Mobile 10+\n  Chrome for Android 18+\n  Firefox for Android 15+');
	}

	setTimeout("createPoly()",100);
	


}); //end document ready




function createPoly()
{
	var polygon = svgArea.polygon('4992,5888 4512,6336 4320,7648 4928,8480 5824,8416 7072,7424 6560,7584 6176,7072 5120,6784').fill('#0000ff').opacity(0.5).stroke({ width: 3 })
}





function ZoomSvg()
{
	
	//svg.js style
	if(typeof svgArea != "undefined")
	{
		
		var scale = 1 / (Math.pow(2,(gTierCount - 1 - now.zoom)));

		svgArea.scale(scale);
		svgArea.attr("width", imgWidthPresentZoom);
		svgArea.attr("height", imgHeightPresentZoom);
	}
	
/*	
 * native svg - succesful
 **/
 var svgContainer = document.getElementById("imageSegmentations");
	
	if(svgContainer)
	{
		//alert('scale2');
		svgContainer.setAttribute("transform","scale("+0.5+")");
		svgContainer.setAttribute("width", imgWidthPresentZoom);
		svgContainer.setAttribute("height", imgHeightPresentZoom);
	}
 
	
/*
 * viewBox experiment - worked, but not succesful
 * var vb= document.getElementById("imageSegmentations").getAttribute("viewBox");
		
		var scale = Math.pow(2,(now.zoom - 2));
		var dims = new Array();
		dims[0] = 0;
		dims[1] = 0;
		dims[2] = imgWidthMaxZoom / scale;
		dims[3] = imgHeightMaxZoom / scale;
		
		var strDims = dims.join(" ");
		
		svgContainer.setAttribute("viewBox", strDims);
*/
	
/*	jQ( ".svgShape" ).each(function() {
		svgElem= $( this ).get(0);
		svgElem.setAttribute("transform","scale(2)") //does not work

	});
*/
}