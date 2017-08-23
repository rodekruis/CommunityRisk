'use strict';

angular.module('dashboards')
	.controller('StoryboardController', ['$scope','$css','$rootScope','$compile','Authentication', 'leafletData',
	function ($scope,$css,$rootScope,$compile, Authentication, leafletData) {
	
	$css.remove('modules/dashboards/css/header.css');
	$css.add('modules/dashboards/css/storyboard.css');
	
	//Determine which storyboard is loaded through URL (for loading corresponding data-file)
	var url = window.location.href;
	var n  = url.indexOf('_');
	var storyboard = url.substring(n+1,url.length);
	
	//Load data, which contains text and images to fill the storyboard
	d3.dsv(';')('modules/dashboards/data/storyboard_' + storyboard + '.csv', function(data) {
		
		for (var i=0;i<data.length;i++) {
			var record = data[i];
						
			//Fill menu-bar at top
			var menu = document.getElementById('menu-items');
			if (!document.getElementById('menu-'+record.section)) {
				var li = document.createElement('li'); 
				li.setAttribute('id','menu-'+record.section);
				menu.appendChild(li);
				var a = document.createElement('a');
				a.setAttribute('href','#' + record.section);
				a.innerHTML = record.label;
				li.appendChild(a);	
				//$compile(a)($scope);			
			}
			
			//Create sections
			if (!document.getElementById(record.section)) {
				var section = document.createElement('section');
				section.setAttribute('id',record.section);
				section.setAttribute('class','home-section text-center');
				var sibling = document.getElementById('intro');
				sibling.parentNode.insertBefore(section,document.getElementById('last-child'));				
				var div = document.createElement('div');
				div.setAttribute('class','heading-about');
				section.appendChild(div);
				var div1 = document.createElement('div');
				div1.setAttribute('class','container');
				div.appendChild(div1);
				var div2 = document.createElement('div');
				div2.setAttribute('class','row');
				div1.appendChild(div2);
				var div3 = document.createElement('div');
				div3.setAttribute('class','col-lg-12');
				div2.appendChild(div3);
				var div3a = document.createElement('div');
				div3a.setAttribute('class','section-heading');
				div3.appendChild(div3a);
				var h2 = document.createElement('h2');
				h2.innerHTML = record.label_long;
				div3a.appendChild(h2);
				var span = document.createElement('span');
				span.setAttribute('class','page-scroll');
				h2.appendChild(span);
				var a2 = document.createElement('a');
				a2.setAttribute('href','#');
				a2.setAttribute('class','next-section');
				span.appendChild(a2);
				var i_el = document.createElement('i');
				i_el.setAttribute('class','fa fa-angle-double-down');
				a2.appendChild(i_el);				
				var div3b = document.createElement('div');
				div3b.setAttribute('class','main-img');
				div3.appendChild(div3b);
				var ul = document.createElement('ul');
				ul.setAttribute('class','slider');
				div3b.appendChild(ul);
				//var footer = document.createElement('footer');
				//sibling.parentNode.insertBefore(footer,document.getElementById('last-child'));	
				
			}
			
			//Fill sections with slides
			var li = document.createElement('li');
			ul.appendChild(li);
			var div4 = document.createElement('div');
			div4.setAttribute('class','section-info');
			li.appendChild(div4);	
			var h3 = document.createElement('h3');
			h3.innerHTML = record.subitem_name;
			div4.appendChild(h3);
			var p = document.createElement('p');
			p.innerHTML = record.subitem_text;
			div4.appendChild(p);
			var img = document.createElement('img');
			img.setAttribute('style','width:'+record.img_width);
			img.setAttribute('src',record.subitem_img);
			div4.appendChild(img);
		
		}
		
		if ($('.slider').length !== 0) {
			$('.slider').slick({
				dots: true,
				infinite: false,
				speed: 300,
				slidesToShow: 1,
				adaptiveHeight: true,
				fade: true,
				centerMode: true,
			});
		};
		 
	
		

	//(function ($) {

		new WOW().init();

		jQuery(window).load(function() { 
			jQuery("#preloader").delay(100).fadeOut("slow");
			jQuery("#load").delay(100).fadeOut("slow");
		});


		//jQuery to collapse the navbar on scroll
		$(window).scroll(function() {
			if ($(".navbar").offset().top > 50) {
				$(".navbar-fixed-top").addClass("top-nav-collapse");
			} else {
				$(".navbar-fixed-top").removeClass("top-nav-collapse");
			}
		});

		//jQuery for page scrolling feature - requires jQuery Easing plugin
		$(function() {
			$('.navbar-nav li a').bind('click', function(event) {
				var $anchor = $(this);
				$('html, body').stop().animate({
					scrollTop: $($anchor.attr('href')).offset().top
				}, 1500, 'easeInOutExpo');
				event.preventDefault();
			});
			$('.next-section').bind('click', function(event) {
				var $anchor = $(this);
				var $next = $anchor.parent().parent().parent().parent().parent().parent().parent().parent().next();
				console.log($next);
				$('html, body').animate({scrollTop: $($next).offset().top}, 1500, 'easeInOutExpo');
				event.preventDefault();
			});
			$('.page-scroll .btn-circle').bind('click', function(event) {
				var $anchor = $(this);
				$('html, body').stop().animate({
					scrollTop: $($anchor.attr('href')).offset().top
				}, 1500, 'easeInOutExpo');
				event.preventDefault();
			});
		});
		
		function makePDF() {

			var quotes = document.getElementById('container-fluid');

			html2canvas(quotes, {
				onrendered: function(canvas) {

				//! MAKE YOUR PDF
				var pdf = new jsPDF('p', 'pt', 'letter');

				for (var i = 0; i <= quotes.clientHeight/980; i++) {
					//! This is all just html2canvas stuff
					var srcImg  = canvas;
					var sX      = 0;
					var sY      = 980*i; // start 980 pixels down for every new page
					var sWidth  = 900;
					var sHeight = 980;
					var dX      = 0;
					var dY      = 0;
					var dWidth  = 900;
					var dHeight = 980;

					window.onePageCanvas = document.createElement("canvas");
					onePageCanvas.setAttribute('width', 900);
					onePageCanvas.setAttribute('height', 980);
					var ctx = onePageCanvas.getContext('2d');
					// details on this usage of this function: 
					// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Slicing
					ctx.drawImage(srcImg,sX,sY,sWidth,sHeight,dX,dY,dWidth,dHeight);

					// document.body.appendChild(canvas);
					var canvasDataURL = onePageCanvas.toDataURL("image/png", 1.0);

					var width         = onePageCanvas.width;
					var height        = onePageCanvas.clientHeight;

					//! If we're on anything other than the first page,
					// add another page
					if (i > 0) {
						pdf.addPage(612, 791); //8.5" x 11" in pts (in*72)
					}
					//! now we declare that we're working on that page
					pdf.setPage(i+1);
					//! now we add content to that page!
					pdf.addImage(canvasDataURL, 'PNG', 20, 40, (width*.62), (height*.62));

				}
				//! after the for loop is finished running, we save the pdf.
				pdf.save('Test.pdf');
			}
		  });
		}
		
		
	});

	//})(jQuery);
	$(document).ready(function () {
		
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			$('.main-slick').slick('setPosition');
		});
		
		var specialElementHandlers = {
			'#editor': function (element,renderer) {
				return true;
			}
		};
		
		$('#cmd').click(function () {
			
			var quotes = document.getElementById('pdf-target');

			html2canvas(quotes, {
				onrendered: function(canvas) {

				//! MAKE YOUR PDF
				var pdf = new jsPDF('p', 'pt', 'letter');

				for (var i = 0; i <= quotes.clientHeight/980; i++) {
					//! This is all just html2canvas stuff
					var srcImg  = canvas;
					var sX      = 0;
					var sY      = 980*i; // start 980 pixels down for every new page
					var sWidth  = 900;
					var sHeight = 980;
					var dX      = 0;
					var dY      = 0;
					var dWidth  = 900;
					var dHeight = 980;

					window.onePageCanvas = document.createElement("canvas");
					onePageCanvas.setAttribute('width', 900);
					onePageCanvas.setAttribute('height', 980);
					var ctx = onePageCanvas.getContext('2d');
					// details on this usage of this function: 
					// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Slicing
					ctx.drawImage(srcImg,sX,sY,sWidth,sHeight,dX,dY,dWidth,dHeight);

					// document.body.appendChild(canvas);
					var canvasDataURL = onePageCanvas.toDataURL("image/png", 1.0);

					var width         = onePageCanvas.width;
					var height        = onePageCanvas.clientHeight;

					//! If we're on anything other than the first page,
					// add another page
					if (i > 0) {
						pdf.addPage(612, 791); //8.5" x 11" in pts (in*72)
					}
					//! now we declare that we're working on that page
					pdf.setPage(i+1);
					//! now we add content to that page!
					pdf.addImage(canvasDataURL, 'PNG', 20, 40, (width*.62), (height*.62));

				}
				//! after the for loop is finished running, we save the pdf.
				pdf.save('Test.pdf');
			}
		  });
			
			/* var pdf = new jsPDF();
			pdf.addHTML(document.body, function() {
				pdf.save('sample-file.pdf');
				//pdf.output('dataurlnewwindow');
			}); */
			/* console.log($('body').get(0));
			pdf.fromHTML($('body').get(0), 15, 15, {
				'width': 170,
				'pagesplit': true,
				'elementHandlers': specialElementHandlers
			});
			//console.log(pdf);
			pdf.save('sample-file.pdf');
			//pdf.output('dataurlnewwindow'); */
		});
		
	});
	
	

}]);

