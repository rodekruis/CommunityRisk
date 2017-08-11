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
		
		
	});

	//})(jQuery);
	$(document).ready(function () {
	  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		$('.main-slick').slick('setPosition');
	  });
	});

}]);

