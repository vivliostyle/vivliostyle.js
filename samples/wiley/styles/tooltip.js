/* ============================================================================
tooltip.js Version 1.0.0

Tooltips

Last Modified: January 26, 2017                                         

Copyright (c) 2017 by John Wiley & Sons, Inc. 

This stylesheet is proprietary confidential material owned by Wiley, and may be used and disclosed only in connection with agreed Wiley-related work. 
By using the stylesheets, you hereby agree to the terms set forth herein.
=============================================================================== */

$(document).ready(function()
{
	$('body')
		.on('click', '.note-label, .term-label', tooltip_create)
		.mousemove(function(event){
			if (deltaX != 0 && deltaY != 0)
			{
			    $('#tooltip')
					.css('left', (event.pageX - deltaX) + 'px')
					.css('top',  (event.pageY - deltaY) + 'px');	
			}
		})
		.mouseup(function(){deltaX = deltaY = 0;});
	
	$(window).resize(tooltip_move);
});


var current_tooltip = null;
var deltaX = deltaY = 0;	

function tooltip_create(event)
{
	if ($('#tooltip').length) $('#tooltip').remove();

	if (this === current_tooltip) current_tooltip = null
	else
	{
		current_tooltip = this;
		
		if ($(this).is('.note-label'))
		{
			var title  = ($(this).children('img').length) ? '&#xA0;' : $(this).text();
			var note   = ($(this).is('a')) ? $('body').find($(this).attr('href')) : $('body').find($(this).attr('data-href'));
			note.children('.generated-labeling').remove();
		
			$(this).off();
		  
			$('<div id="tooltip"><div id="tooltip-header">' + title + '<div id="tooltip-close">&#xD7;</div></div><div id="tooltip-content">' + note.html() + '</div></div>').appendTo('body');
		}
		if ($(this).is('.term-label'))
		{
			var id = $(this).attr('data-definition-ref').replace(/^(#|urn:x-wiley:[^:]+:xml-component:[^:]+:)/, '');
			var definition  = $('body').find('#'+id).html();
			var displayForm = ($(this).prev().parent('.termGroup').children('.type-displayForm').length) ? $(this).prev().parent('.termGroup').children('.type-displayForm').html() : ($(this).children('.term').length) ? $(this).children('.term').html() : $(this).prev().html();
	
			$(this).find('.term-label').off();
			
			$('<div id="tooltip"><div id="tooltip-header">&#xA0;<div id="tooltip-close">&#xD7;</div></div><div id="tooltip-content"><div class="displayForm">' + displayForm + '</div>' + definition + '</div></div>').appendTo('body');
		}
		
		tooltip_move(event);
				
		$('#tooltip-close')
			.click(function(){
				$('#tooltip').remove();
				current_tooltip = null;
			});

		// drag tooltip
		$('#tooltip-header')
			.mousedown(function(event){
				deltaX = event.pageX - $(this).offset().left;
				deltaY = event.pageY - $(this).offset().top;
				event.preventDefault();				
			});
	}
};


function position (_event, _this)
{
	var offset 	= 10;
	var offsetT = -10;

	var ttW     = $('#tooltip').outerWidth() + offset;
	var ttH     = $('#tooltip').outerHeight() + offset;
	var windowW = $(window).width();
	var windowH = $(window).height();
	var windowT = $(window).scrollTop();
	var windowL = $(window).scrollLeft();
	var linkT   = $(_this).offset().top;	
	var linkL   = $(_this).offset().left;
	var linkW   = $(_this).width();
	var linkH   = $(_this).height();
	var posX, posY;
	
	linkL = (linkL == 0) ? _event.pageX : linkL;
	linkT = (linkT == 0) ? _event.pageY : linkT;
	
	if ((linkL + linkW + ttW + offset) <= (windowL + windowW) || (linkL - ttW - offset) >= windowL)
	{
	    if ((linkL + linkW + ttW + offset) <= (windowL + windowW))	posX = linkL + linkW + offset + 5; 		// float right
	        else													posX = linkL - ttW - offset;			// float left
	        
	    if ((ttH >= windowH) || (linkT + offsetT) < windowT)		posY = windowT;                 		// top
	        else if ((linkT + ttH + offsetT) > (windowT + windowH))	posY = windowT + windowH - ttH; 		// bottom    
	        else													posY = linkT + offsetT;         		// float middle
	}
	else
	{
	    var baseline = linkL + (linkW - ttW)/2;
	    
	    if (ttW >= windowW || baseline <= windowL)					posX = windowL;                         // left
	        else if ((baseline + ttW) > (windowL + windowW))		posX = windowL + windowW - ttW;    		// right
	        else													posX = baseline;                        // float
	        
	    if ((linkT + linkH + offset + ttH) <= (windowT + windowH))	posY = linkT + linkH + offset;     		// below
	        else if ((linkT - offset - ttH) >= windowT)				posY = linkT - offset - ttH;       		// abobe
	        else													posY = windowT + (windowH - ttH)/2; 	// float middle
	};
	
	return {X: posX, Y: posY};
};


function tooltip_move(event)
{
	if ($('#tooltip').length)
	{
		var pos = position(event, current_tooltip);
		$('#tooltip').css({'left': pos.X + 'px', 'top': pos.Y + 'px'});
	}
};
