'use strict';

angular.module('dashboards')
	.controller('StoryboardController', ['$scope','$css','$rootScope','Authentication', 'leafletData',
	function ($scope,$css,$rootScope, Authentication, leafletData) {
	
	$css.remove('modules/dashboards/css/header.css');
	$css.add('modules/dashboards/css/storyboard.css');
	
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

