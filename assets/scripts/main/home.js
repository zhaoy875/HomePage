require([
    'jquery',
    'dewplayer',
    'bootstrap_dropdown'
], function($) {
    'use strict';

    var $dewPlayer = $('#dewplayer'),
    	$btnPrev = $('.prev'),
    	$btnNext = $('.next');
    $btnPrev.on('click',function(){
    	$dewPlayer.dewprev();
    });
    $btnNext.on('click',function(){
    	$dewPlayer.dewnext();
    });
    console.dir($dewPlayer);
});
