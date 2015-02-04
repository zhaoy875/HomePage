var require = {
    baseUrl: 'assets/scripts',
    waitSeconds: 0,

    paths: {
        // jQuery and plugin
        // jquery: 'lib/jquery/jquery-2.1.1.min',

        ///////////////////////////////////////////////////
        // jQuery是每个页面都会用到的库，所以在这里将jquery
        // 的path指向一个自定义的文件，该文件由jQuery本体以及
        // 一些自己扩展的全局方法组成。
        ///////////////////////////////////////////////////
        jquery: 'lib/jquery/jquery-2.1.1.min',

        // Bootstrap components
        // bootstrap: 'lib/bootstrap/bootstrap',
        // transition: 'lib/bootstrap/transition',
        bootstrap_dropdown: 'lib/bootstrap/dropdown',

        // 音乐播放器dewplayer
        dewplayer:'lib/swfobject',
    },

    shim: {
        bootstrap_dropdown: {
            deps: ['jquery']
        },
    }
};
