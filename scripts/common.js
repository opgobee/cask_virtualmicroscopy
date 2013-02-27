
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