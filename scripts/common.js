
function ref(i) { return document.getElementById(i);}


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
 * @param one or more argumnets to be shown
 */ 
function debug(subjects)
{
	var str="";
	
	for(var i=0;i<arguments.length;i++)
		{
			var subject = arguments[i]; 	
					
			if(typeof subject == "object" && subject instanceof Array)
			{	
				str+= "[Array]\n";
				if (subject.length == 0) {str+= "EMPTY"}
				else
					{
					for(var i=1;i<subject.length;i++)
						{
							str+= i + " : " + subject[i] + "\n";
						}
					}	
			}
			else if(typeof subject == "object" )
			{	
				str+= "[Object]\n";
				counter= 0;
				for(prop in subject)
				{
					str+= prop + " : " + subject[prop]  + "\n";;
					counter++;
				}
				if(counter==0){str+= "EMPTY"}
				
			}	
			else if(typeof subject == "string")
			{
				{
					str= "[string] " + subject;
				}
			}
			else if(typeof subject == "number")
			{
				{
					str= "[number] " + subject;
				}
			}
			else if(typeof subject == "boolean")
			{
				{
					str= "[boolean] " + subject? "TRUE" : "FALSE";
				}
			}
			else if(typeof subject == "undefined")
			{
				{
					str= "undefined";
				}
			}
			else if(subject == null)
			{
				{
					str= "NULL!";
				}
			}	
			str+="\n";
		}//end loop all arguments
	alert(str);
}


