var pages = [
/*  {title:"Base Leaflet with corrected scale bar",folder:"Leaflet-slideviewer"},
    {title:"Leaflet with minimap",folder:"Leaflet-minimap"},
    {title:"Leaflet with minimap and measure",folder:"Leaflet-ruler"},
    {title:"Leaflet with minimap, measure and annotation",folder:"Leaflet-annotate"},
    {title:"Leaflet with view updated in url",folder:"Leaflet-url-view"},
    {title:"Leaflet with minimap, measure and annotation (Using Leaflet.Toolbar)",folder:"Leaflet-annotate-toolbar"},
*/  {title:"Leaflet with geojson properties support, export/import",folder:"Leaflet-geojson"},
    {title:"Leaflet: Annotated Zebrafish",folder:"Leaflet-annotated_zf"},

    ]
    
$(function(){
    if($('.navbar-brand').length)
    {
        var pathArray = window.location.pathname.split( '/' ),
            dir = pathArray[pathArray.length-2];
        pages.forEach(function(element)
        {

            if(element.folder.toLowerCase() == dir.toLowerCase())
            {
               $('.navbar-brand').html(element.title)
            }
        })
    }
});
