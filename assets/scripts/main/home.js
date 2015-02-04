require([
    'jquery',
    'bootstrap_dropdown'
], function($) {
    'use strict';

    var dewPlayer = $('#dewplayer'),
        $btnPrev = $('.prev'),
        $btnNext = $('.next');
    $btnPrev.on('click', function() {
        console.log(dewPlayer);
        dewPlayer.dewprev();
    });
    $btnNext.on('click', function() {
        dewPlayer.dewnext();
    });
});
