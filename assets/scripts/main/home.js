require([
    'jquery',
    'bootstrap_dropdown'
], function($) {
    'use strict';

    var dewPlayer = $('#dewplayer')[0],
        $btnPrev = $('.prev'),
        $btnNext = $('.next');
    $btnPrev.on('click', function() {
        dewPlayer.dewprev();
    });
    $btnNext.on('click', function() {
        dewPlayer.dewnext();
    });
});
