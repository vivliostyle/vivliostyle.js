/* ============================================================================
articles.js Version 1.0.0

Melville rendering JS module. Articles specific ready().

Last Modified: January 15, 2018

Copyright (c) 2017 by John Wiley & Sons, Inc. 

This stylesheet is proprietary confidential material owned by Wiley, and may be used and disclosed only in connection with agreed Wiley-related work. 
By using the stylesheets, you hereby agree to the terms set forth herein.
=============================================================================== */

$(document).ready(function()
{
	mathJax_init();
	stripy_tables();
	fix_row_separators();
	fix_images();
	
	// Following three are only for print (for Vivliostyle) and are here for testing purposes
	// add_orcid_section();
	// move_creators_affiliations_notes();
	// postprocess();	
	
	$(window).resize(fix_images);
});


function postprocess()
{
	var affiliations = document.querySelectorAll('span.affiliationRef');
	for (var i=0; i<affiliations.length; i++) {
		var str = affiliations[i].innerHTML;
		affiliations[i].innerHTML = str.replace(/,$/,"");
	}
}


function add_orcid_section()
{
	var orcids  = document.querySelectorAll('li.creator span[data-type="orcid"]');
	if (orcids.length)
	{
		var section = document.createElement("section");
		section.setAttribute('class','section');
		section.innerHTML='<header class="titleGroup"><h2 class="title" data-type="main">ORCID</h2></header>';	
		
		for (var i=0; i<orcids.length; i++)
		{
			var url = orcids[i].getAttribute("data-value");
			var div = orcids[i].parentElement.parentElement;
			var name  = div.querySelector('span.personName span[property="schema:name"]').innerHTML;
			var p = document.createElement("p");
			p.innerHTML='<span class="orcidDetails"><span class="personName">' + name + '</span><img src="../../styles/orcid.svg" width="12" height="12" alt="orcid logo"/></span> <span class="url"><a class="urlAnchor" href="' + url + '" target="_blank">' + url + '</a></span>';	
			section.appendChild(p);
		}
		
		// inserting the section
		if (document.querySelector('article>section.letter>section.noteGroup') && document.querySelector('article>section.letter>section.bibliography')) 
		{
			if (document.querySelector('article>section.letter>section.noteGroup').previousElementSibling.getAttribute('class') === 'bibliography'){
				document.querySelector('article>section.letter').insertBefore(section, document.querySelector('article>section.letter>section.bibliography'));
			}
			else {
				document.querySelector('article>section.letter').insertBefore(section, document.querySelector('article>section.letter>section.noteGroup'));
			}
		}
		else if (document.querySelector('article>section.letter>section.noteGroup')) {
			document.querySelector('article>section.letter').insertBefore(section, document.querySelector('article>section.letter>section.noteGroup'));
		}
		else if (document.querySelector('article>section.letter>section.bibliography')) {
			document.querySelector('article>section.letter').insertBefore(section, document.querySelector('article>section.letter>section.bibliography'));
		}
		
		else if (document.querySelector('article>section.noteGroup') && document.querySelector('article>section.bibliography')) 
		{
			if (document.querySelector('article>section.noteGroup').previousElementSibling.getAttribute('class') === 'bibliography'){
				document.querySelector('article').insertBefore(section, document.querySelector('article>section.bibliography'));
			}
			else {
				document.querySelector('article').insertBefore(section, document.querySelector('article>section.noteGroup'));
			}
		}
		else if (document.querySelector('article>section.noteGroup')) {
			document.querySelector('article').insertBefore(section, document.querySelector('article>section.noteGroup'));
		}
		else if (document.querySelector('article>section.bibliography')) {
			document.querySelector('article').insertBefore(section, document.querySelector('article>section.bibliography'));
		}
		
		else if (document.querySelector('article>span.citation[data-type="self"]')) {
			document.querySelector('article').insertBefore(section, document.querySelector('article>span.citation[data-type="self"]'));
		}
		else if (document.querySelector('article>section.appendix')) {
			document.querySelector('article').insertBefore(section, document.querySelector('article>section.appendix'));
		}
		else
			document.querySelector('article').appendChild(section);
	}
}


function move_creators_affiliations_notes()
{
	var type = document.querySelector('body').getAttribute('data-unit-type');
	if (type==='bookReview' || type==='mediaReview' || type==='editorial' || type==='letter' || type==='obituary')
	{	
		// select header notes referenced only from creator/@noteRef (below) and move them to fall after correspondenceTo/affiliationGroup/creators (further below)
		var movingNotes = document.createElement('ol');
		movingNotes.className = "notes";
		var notes = document.querySelectorAll('div[role="contentinfo"]>section.noteGroup>ol>li'); // all header notes
		var cRefs = document.querySelectorAll('section.creators li.creator span.link[data-note_label="yes"]:not([data-href])>a'); // all creators refs
		var oRefs = document.querySelectorAll('article header span.link[data-note_label="yes"][data-href]>a, article div[role="contentinfo"] span.link[data-note_label="yes"][data-href]>a'); // all other refs
		if (notes.length && cRefs.length)
		{
			for (var n=0; n<notes.length; n++) 
			{
				var data_type = notes[n].getAttribute('data-type');
				if (data_type==="authorRelated" || data_type==="equal") { // move notes of these types any way
					movingNotes.appendChild(notes[n]);
				}
				else
				{
					var noteId = "#" + notes[n].getAttribute('id');
					for (var r=0; r<cRefs.length; r++) 
					{
						if (noteId === cRefs[r].getAttribute('href')) // check creators refs
						{
							var amongOther = false;
							for (var o=0; o<oRefs.length; o++)
								if (noteId === oRefs[o].getAttribute('href')) {
									amongOther = true; // exclude other refs
									break;
								}
							
							if (amongOther == false) movingNotes.appendChild(notes[n]);
						}
					}
				}
			}
			
			// remove noteGroup if it's now empty
			var remainNotes = document.querySelectorAll('div[role="contentinfo"]>section.noteGroup>ol>li');
			if (!remainNotes.length) {		
				var noteGroup = document.querySelector('div[role="contentinfo"]>section.noteGroup');
				noteGroup.parentNode.removeChild(noteGroup);
			}
		}
		
		// If there is a <figure class="blockFixed" data-type="signatureBlock"> that occurs at the end of the article, hide authors/affiliations/correspondence
		if (document.querySelector('article>section:last-of-type figure.blockFixed[data-type="signatureBlock"]')) 
		{
			document.querySelector('section.creators').setAttribute('style','display:none;');
			if (document.querySelector('section.affiliationGroup')) {
				document.querySelector('section.affiliationGroup').setAttribute('style','display:none;');
			}
			if (document.querySelector('div.correspondenceTo')) {
				document.querySelector('div.correspondenceTo').setAttribute('style','display:none;');
			}
		}
		else
		{
			var fragment = document.createDocumentFragment();
			
			if (document.querySelector('section.keywordGroup')) {
				var keywordGroups = document.querySelectorAll('section.keywordGroup')
				for (i=0; i<keywordGroups.length; i++)
					fragment.appendChild(keywordGroups[i]);
			}
			
			fragment.appendChild(document.querySelector('section.creators'));
			if (!document.querySelector('section.affiliationGroup') && !document.querySelector('div.correspondenceTo') && movingNotes.querySelector('li')) {
				fragment.appendChild(movingNotes);
			}
			
			if (document.querySelector('section.affiliationGroup')) {
				fragment.appendChild(document.querySelector('section.affiliationGroup'));
				if (!document.querySelector('div.correspondenceTo') && movingNotes.querySelector('li')) {
					fragment.appendChild(movingNotes);
				}
			}
			if (document.querySelector('div.correspondenceTo')) {
				fragment.appendChild(document.querySelector('div.correspondenceTo'));
				if (movingNotes.querySelector('li')) {
					fragment.appendChild(movingNotes);
				}				
			}

			if (document.querySelector('article>section.letter>section.noteGroup') && document.querySelector('article>section.letter>section.bibliography')) 
			{
				if (document.querySelector('article>section.letter>section.noteGroup').previousElementSibling.getAttribute('class') === 'bibliography'){
					document.querySelector('article>section.letter').insertBefore(fragment,document.querySelector('article>section.letter>section.bibliography'));	
				}
				else {
					document.querySelector('article>section.letter').insertBefore(fragment,document.querySelector('article>section.letter>section.noteGroup'));
				}
			}
			else if (document.querySelector('article>section.letter>section.noteGroup')) {
				document.querySelector('article>section.letter').insertBefore(fragment,document.querySelector('article>section.letter>section.noteGroup'));
			}
			else if (document.querySelector('article>section.letter>section.bibliography')) {
				document.querySelector('article>section.letter').insertBefore(fragment,document.querySelector('article>section.letter>section.bibliography'));
			}
			
			else if (document.querySelector('article.displayed-content>section.noteGroup') && document.querySelector('article.displayed-content>section.noteGroup'))
			{
				if (document.querySelector('article.displayed-content>section.noteGroup').previousElementSibling.getAttribute('class') === 'bibliography'){
					document.querySelector('article.displayed-content').insertBefore(fragment,document.querySelector('article.displayed-content>section.bibliography'));				
				}
				else {
					document.querySelector('article.displayed-content').insertBefore(fragment,document.querySelector('article.displayed-content>section.noteGroup'));
				}
			}
			else if (document.querySelector('article.displayed-content>section.noteGroup')) {
				document.querySelector('article.displayed-content').insertBefore(fragment,document.querySelector('article.displayed-content>section.noteGroup'));
			}
			else if (document.querySelector('article.displayed-content>section.bibliography')) {
				document.querySelector('article.displayed-content').insertBefore(fragment,document.querySelector('article.displayed-content>section.bibliography'));
			}
			
			else if (document.querySelector('article.displayed-content>span.citation[data-type="self"]')) {
				document.querySelector('article.displayed-content').insertBefore(fragment,document.querySelector('article.displayed-content>span.citation[data-type="self"]'));
			}
			else
				document.querySelector('article.displayed-content').appendChild(fragment);
			
			// if <body>/@data-unit-type equals "editorial" then for a creator whose <span class="jobTitle"> contains the word "editor" we need to make this jobTitle visible
			if (type==='editorial')
			{
				var jobs = document.querySelectorAll('section.creators li.creator span.jobTitle')
				for (i=0; i<jobs.length; i++) 
					if (jobs[i].innerHTML.toLowerCase().indexOf('editor') >= 0)
						jobs[i].setAttribute('class','jobTitle editor');
			}
		}
		
		// change orcid icon size
		var orcidImg = document.querySelector('img[alt="orcid link"]');
		if (orcidImg) {
			orcidImg.setAttribute('width','12');
			orcidImg.setAttribute('height','12');
		}
		
		// IF the author is marked with data-corresponding="yes" AND if <div class="correspondenceTo"> doesn't exist AND IF <li class="creator">/<div property="schema:author">/<span class="contactDetails">/<a class="email"> exists THEN display email under author name.
		if (!document.querySelector('div.correspondenceTo')) 
		{
			var creators = document.querySelectorAll('li.creator[data-corresponding="yes"]'); 
			for (c=0; c<creators.length; c++)  {
				var email = creators[c].querySelector('a.email');
				if (email) {
					creators[c].appendChild(email);
				}
			}
		}
		
		// wrap all authors and corresponding text within h1 citaions in <span class="authors-set"> and free text before citation in <span class="main-title">
		if (document.querySelectorAll('h1>.title>.RDFa>.citation').length)
		{
			// search and wrap free text before first <citation>
			var rdfa = document.querySelector('h1>.title>.RDFa');
			var citationPassed = false,
				freeText = false;			
			var main;
			for (var n=0; n<rdfa.childNodes.length; n++)
			{
				var curNode = rdfa.childNodes[n];
				if (curNode.nodeName === "#text") {
					if (curNode.nodeValue.match(/\S/) && !citationPassed && !freeText) {
						main = document.createElement("span");
						main.setAttribute('class','main-title');
						main.appendChild(curNode);
						freeText = true;
						n--;						
					}
				}
				else if (curNode.getAttribute("class") === 'citation' && !citationPassed) {
					citationPassed = true;
					if (freeText) {
						rdfa.insertBefore(main, curNode);
					}
				}
			}
						
			// mark h1		
			var h1 = document.querySelector('h1');
			h1.setAttribute('formatting','yes');
			
			// wrap authors
			var citations = document.querySelectorAll('h1>.title>.RDFa>.citation');
			for (var c=0; c<citations.length; c++)
			{
				var citation = citations[c];
				var authors = document.createElement("span");
				authors.setAttribute('class','authors-set');
				var titlesPassed = false, 
					insertionPassed = false;
				var insertionPoint;
				for (var i=0; i<citation.childNodes.length; i++) {
					var curNode = citation.childNodes[i];
					if (curNode.nodeName === "#text") {
						if (curNode.nodeValue.match(/\S/) && titlesPassed && !insertionPassed) {
							authors.appendChild(curNode);
							i--;						
						}
					}
					else {
						var curNodeClass = curNode.getAttribute("class")
						if (curNodeClass === 'bookTitle' || curNodeClass === 'bookSeriesTitle' || curNodeClass === 'articleTitle' || curNodeClass === 'journalTitle' || curNodeClass === 'chapterTitle' || curNodeClass === 'otherTitle' || curNodeClass === 'statuteTitle') {
							titlesPassed = true;
						}
						else if (curNodeClass === 'author' || curNodeClass === 'editor' || curNodeClass === 'groupName ') {
							authors.appendChild(curNode);
							i--;
						}
						else if (!insertionPassed) {
							insertionPoint = curNode;
							insertionPassed = true;
						}
					}
				}
				citation.insertBefore(authors, insertionPoint);
			}
		}
	}
}