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
    /*
        @description 此方法使用console在控制台打印个人信息
        @param {@string} cssStyle
     */
    function stampInfo(){
        //基本信息
        console.log('%c木公-男-华中科技大学','font-size:36px;font-weight:bold;text-shadow:0px 0px 0px #fff,1px 1px 0px #b3b3b3,2px 2px 0px #666;');
        //头像
        console.log('%c','margin-left:100px;padding:80px;border-radius:50%;background:#333 url(http://itec-lds.github.io/musics/assets/images/mugong.jpg) no-repeat center;line-height:200px;');
        //求工作
        console.log('%c网易前端工程师一枚；有好去处求收留','font-size:24px;color:#f75a53;text-shadow:0px 0px 0px #fff,1px 1px 0px #b3b3b3;');
    }
     stampInfo();
});
