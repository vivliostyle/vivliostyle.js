/* ============================================================================
core.js Version 1.0.0

Melville core JS module. Functions used and shared by different JS modules + common ready().

Last Modified: December 21, 2017                                        

Copyright (c) 2017 by John Wiley & Sons, Inc. 

This stylesheet is proprietary confidential material owned by Wiley, and may be used and disclosed only in connection with agreed Wiley-related work. 
By using the stylesheets, you hereby agree to the terms set forth herein.
=============================================================================== */

var mathJaxConfigObj={
	"HTML-CSS": {
		scale: 95,
		availableFonts:["STIX-Web","TeX"],
		preferredFont: "STIX-Web",
		webFont: "STIX-Web",
		imageFont: "STIX-Web",
		undefinedFamily: "wmlpua"
	},
	"SVG": {
		scale: 95,
		font: "STIX-Web",
		undefinedFamily: "wmlpua"
	},
	"menuSettings": {
		zoom: "Click"
	}
};


$(document).ready(function()
{
	// objectNotes link workaround for Chrome and Safari
	if (window.navigator.userAgent.match("Firefox") != "Firefox" && window.navigator.userAgent.match("MSIE") != "MSIE")
	{
		$('.displayedItem>math[display="block"]').wrap('<div style="display:inline-block;"></div>');
	}

	fix_sub_sup();
	fix_tables();
	
	$(window).resize(fix_tables);
});


function fix_tables()
{
	$('.tabular, .tabularFixed').each(function()
	{
		var figureWidth = $(this).width();
		var table = $(this).find('table');
		var media = $(this).find('.mediaResource, .mediaResourceGroup>.mediaResource');
		var minWidth = 300;
		var width;
		
		if (table.length && media.length && media.length > minWidth) width = media.width();
		else if (table.length)	width = table.width();
		else if (media.length && media.length > minWidth) width = media.width();
		else width = minWidth;

		width = (width < minWidth) ? minWidth : width;
		
		$(this).children('figcaption, .blockFixed, .featureFixed, p, .source, .noteGroup').css({'width': width + 'px', 'margin-left': 'auto', 'margin-right': 'auto'});
		$(this).children('.figure').css({'width': width-20 + 'px', 'margin-left': 'auto', 'margin-right': 'auto'});		
		
		if (width > figureWidth) $(this).addClass('scroll');
		else $(this).removeClass('scroll');
	});
};


function fix_sub_sup()
{
	$('div.displayedItem>.generated-labeling').each(function()
	{
		$supscr = $(this).find('.extraLabel'); 
		$subscr = $(this).find('.extraLabelSub'); 

		if ($supscr.length && $subscr.length)
		{
			var label_x  = ($supscr.width() > $subscr.width()) ? $subscr.width() : $supscr.width();
			var supscr_x = 2;
			var subscr_x = 2 - $supscr.width();
			var supscr_y = $(this).height()/2 - $supscr.height();
			var subscr_y = $subscr.height() - $(this).height()/2;
			var width    = $(this).width() - label_x + 2;
				
			$(this).css({'position': 'absolute', 'width': width + 'px'});
			$supscr.css({'position': 'relative', 'left': supscr_x + 'px', 'top': supscr_y + 'px'});
			$subscr.css({'position': 'relative', 'left': subscr_x + 'px', 'top': subscr_y + 'px'});
		}
	});
};


var paramsForPopupImage = 'directories=no,toolbar=no,menubar=no,width=800,height=600,location=no,resizable=yes,scrollbars=yes,status=no';
var drawImage;

function drawimage(image_n) 
{
	drawImage = window.open('', 'drawImage', paramsForPopupImage);
	drawImage.document.write('<html><head><title>Image</title></head><body><div align="center"><img src="'+image_n+'" /></div></body></html>');
	drawImage.focus();
}

function mathJax_init()
{
	setTimeout(function () {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src  = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=MML_HTMLorMML-full"; //TeX-AMS-MML_SVG-full
		document.getElementsByTagName("head")[0].appendChild(script);
	},2000);
}


function add_buttons()
{
	var table="<table><tr><td/><td class='plus'/><td/></tr><tr><td class='minus'/><td class='minus'/><td class='minus'/></tr><tr><td/><td class='plus'/><td/></tr></table>";
	$('<div class="button"><div class="button-text">ANSWER</div><div class="button-status">' + table + '</div></div>').insertBefore('*[data-online-answer-place="button"]>.answer')
	$('<div class="button"><div class="button-text">ANSWER</div><div class="button-status">' + table + '</div></div>').insertBefore('*[data-online-answer-place="button"]>.answerWrapper')
	$('<div class="button"><div class="button-text">HINT</div><div class="button-status">' + table + '</div></div>').insertBefore('.hint[data-online-place="button"]')
	$('<div class="button"><div class="button-text">WORKED SOLUTION</div><div class="button-status">' + table + '</div></div>').insertBefore('.workedSolution[data-online-place="button"]')

	$('*[data-online-answer-place="button"]>.answer').hide();	
	$('*[data-online-answer-place="button"]>.answerWrapper').hide();		
	$('*[data-online-place="button"]').hide();
	
	$('div.button')
		.click(function(){
			$(this).next().toggle();		
			if($(this).next().is(':visible')) {
				$(this).addClass("minus");
				$(this).find('td.plus').hide();			
			} else {
				$(this).removeClass("minus");
				$(this).find('td.plus').show();
			}
		});
};


function fix_row_separators()
{
	$('th[data-rowsep="1"]').each(function()
	{
		if (!($(this).attr('href') || $(this).prev().attr('href')))	{
			$(this).removeClass('eR').append('<div class="eR"/>');
		}
	});
};


function fix_images()
{
	$('img.mediaResource').each(function()
	{
		var maxWidth = $(this).parent().width();
		if ($(this).width() > maxWidth) {$(this).css({'width': maxWidth + 'px'});}
	});
};


function stripy_tables() 
{
	var tables = document.getElementsByTagName('table');
	
	for (var table = 0; table < tables.length; table++) 
	{
		var colnum = tables[table].getAttribute('data-tgroup_cols');
		var tbodys = tables[table].getElementsByTagName('tbody');
		
		for (var tbody = 0; tbody < tbodys.length; tbody++)
		{
			var rowspan = 0
			var tds = tbodys[tbody].getElementsByTagName('td');
			for (var td = 0; td < tds.length; td++)	
				if (tds[td].hasAttribute('rowspan')) {rowspan = 1; break;}
			
			if (rowspan == 1)
			{
				var rows = tbodys[tbody].getElementsByTagName('tr');
				var map = new Array(colnum);
		
				for (var row = 0; row < rows.length; row++)
				{
					var columns = rows[row].getElementsByTagName('td');
					var index = 0;
		
					if (row == 0)
					{
						for (var j = 0; j < colnum; j++)
						{
							var value = columns[index].hasAttribute('rowspan') ? columns[index].getAttribute('rowspan')-1 : 0;

							if (columns[index].hasAttribute('colspan'))
							{								
								for (var i = 0; i < columns[index].getAttribute('colspan'); i++) map[j+i] = value;
								j += columns[index].getAttribute('colspan')-1;	
							}
							else
								map[j] = value;

							if (columns[index].hasAttribute('rowspan')) columns[index].removeAttribute('rowspan');
							index++;							
						}
					}
					else
					{
						var newmap = new Array(colnum);
						
						for (var j = 0; j < colnum; j++)
						{
							if (map[j] != 0) 
								newmap[j] = map[j] - 1;
							else 
								if (columns[index].hasAttribute('colspan'))
								{
									for (var i = 0; i < columns[index].getAttribute('colspan'); i++)
										newmap[j+i] = (map[j+i] != 0) ? map[j+i] - 1 : (columns[index].hasAttribute('rowspan') ? columns[index].getAttribute('rowspan')-1 : 0);
									j += columns[index].getAttribute('colspan')-1;	
								}
								else 
									newmap[j] = (columns[index].hasAttribute('rowspan') ? columns[index].getAttribute('rowspan')-1 : 0);
								
							if (map[j] == 0) index++;
						}
	
						for (var j = 0; j < columns.length; j++)
							if (columns[j].hasAttribute('rowspan')) columns[j].removeAttribute('rowspan');
						
						var insert = "before";
						var columns_length = columns.length - 1;
						index = 0;
	
						for (var j = 0; j < colnum; j++)
						{
							var td = columns[index];
							var colspan = (td.hasAttribute('colspan')) ? td.getAttribute('colspan') : 0;
	
							if (map[j] != 0) 
							{
								var empty_td = document.createElement("TD");
								if (insert === "before")
								{
									rows[row].insertBefore(empty_td,td);
									index++;
								}
								else
									rows[row].appendChild(empty_td);							
							}
							else
							{
								if (colspan > 0) j += colspan - 1;
								if (index < columns_length) 
									index++;
								else
									insert = "after";
							}
						}
							
						map = newmap;
					}
					if ((row+1)%2 == 0 && !rows[row].hasAttribute('data-shaded')) rows[row].setAttribute('data-shaded','yes');
				}
			}
			else
			{
				var rows = tbodys[tbody].getElementsByTagName('tr');
	
				for (var row = 0; row < rows.length; row++)
					if ((row+1)%2 == 0 && !rows[row].hasAttribute('data-shaded')) rows[row].setAttribute('data-shaded','yes');
			}
		}
	}
}