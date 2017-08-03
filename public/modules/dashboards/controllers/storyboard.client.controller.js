'use strict';

angular.module('dashboards')
	.controller('StoryboardController', ['$scope','$css','$rootScope','Authentication', 'leafletData',
	function ($scope,$css,$rootScope, Authentication, leafletData) {
	
	$css.remove('modules/dashboards/css/header.css');
	$css.add('modules/dashboards/css/storyboard.css');
	
	d3.dsv(';')("modules/dashboards/data/storyboard_echo2.csv", function(data) {
		
		for (var i=0;i<data.length;i++) {
			var record = data[i];
					
			var div = document.createElement('li');
			var parent = document.getElementById(record.section+'-items');
			parent.appendChild(div);
			var div0 = document.createElement('div');
			div0.setAttribute('class','section-info');
			div.appendChild(div0);	
			var h3 = document.createElement('h3');
			h3.innerHTML = record.subitem_name;
			div0.appendChild(h3);
			var p = document.createElement('p');
			p.innerHTML = record.subitem_text;
			div0.appendChild(p);
			var img = document.createElement('img');
			img.setAttribute('style','width:90%');
			img.setAttribute('src',record.subitem_img);
			div0.appendChild(img);
		}
		
	});
	
	
	$(document).ready(function() {
		
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
	});
	
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
			$('.page-scroll a').bind('click', function(event) {
				var $anchor = $(this);
				$('html, body').stop().animate({
					scrollTop: $($anchor.attr('href')).offset().top
				}, 1500, 'easeInOutExpo');
				event.preventDefault();
			});
		});

	//})(jQuery);

}]);

