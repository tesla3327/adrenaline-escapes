/*
Name: 			Finance
Written by: 	Okler Themes - (http://www.okler.net)
Theme Version:	5.4.0
*/
// Demo Config
(function($) {

	'use strict';

	// Slider Options
	var sliderOptions = {
		sliderType: 'standard',
		sliderLayout: 'auto',
		fullScreenOffsetContainer: '#header',
		delay: 5000,
		disableProgressBar: 'on',
		responsiveLevels: [4096, 1200, 991, 500],
		gridwidth: [1170, 970, 750],
		gridheight: 650,
		lazyType: "none",
		shadow: 0,
		spinner: "off",
		shuffle: "off",
		autoHeight: "off",
		fullScreenAlignForce: "off",
		fullScreenOffset: "",
		disableProgressBar: "on",
		hideThumbsOnMobile: "off",
		hideSliderAtLimit: 0,
		hideCaptionAtLimit: 0,
		hideAllCaptionAtLilmit: 0,
		debugMode: false,
		fallbacks: {
			simplifyAll: "off",
			nextSlideOnWindowFocus: "off",
			disableFocusListener: false,
		},
		navigation: {
			keyboardNavigation: "on",
			keyboard_direction: "horizontal",
			mouseScrollNavigation: "on",
			onHoverStop: "off",
			touch: {
				touchenabled: "on",
				swipe_threshold: 75,
				swipe_min_touches: 1,
				swipe_direction: "horizontal",
				drag_block_vertical: false
			},
			arrows: {
				enable: false
			}
		}
	}

	// Slider Init
	$('#revolutionSlider').revolution(sliderOptions);

}).apply(this, [jQuery]);