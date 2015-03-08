require([
    'jquery',
    'bootstrap_dropdown'
], function($) {
    'use strict';

    var DewPlayer = $('#dewplayer')[0],
        $btnPrev = $('.prev'),
        $btnNext = $('.next');
    $btnPrev.on('click', function() {
        DewPlayer.dewprev();
    });
    $btnNext.on('click', function() {
        DewPlayer.dewnext();
    });
});
