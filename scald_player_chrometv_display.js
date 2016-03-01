(function($) { 

    /* 
    #################################################################
    Display class that handles the way the page looks
    #################################################################
    */

    //if no connection and no db data - show loading screen that prompts connecting to internet
    //if no connection - play what's in db and try to start prefetch every 30 seconds
    //if yes connection and no db data - show loading screen and fetch stuff
    //if yes connection and yes db data - show db data and start prefetching new content

    //if video is playing and content fetched - show a white screen saying new playlist will start soon and a loading bar that takes 5 seconds
    //if video is playing and content hasnt fetched - show loading screen? or loop around?

    displayAccessor = {
        
        //how long the info messages remain visible
        time : 5000,
        //how fast the screen will fade out when info is shown
        fade : 500,
        //how fast the loading bar changes width
        progress : 2000,

        dbug : 1,

        elementWrap : $("#video-info"),
        elementPlayer : $("#kaltura-player-wrap"),
        elementInfo : $("#text-info"),
        elementLoadingBar : $("#video-progress-bar"),
        elementLoadingWheel : $("#loader"),

        log : function(arr) {

            if(this.dbug > 0 && arr!==undefined){
     
                //dbug is set to 1 at least, print to console
                console.log("::::::::: Display ::::::::");  
                console.log(arr);  
            }
        },

        init : function(options){

            var self = displayAccessor; 

            self.elementInfo.html("loading..."); 
            
            self.elementWrap.animate({
                opacity : 1
            },self.fade);  
        },

        /*
        Hide the info bar after `self.time` ms
        */
        hideInfo : function(){

            var self = displayAccessor;
            var deferred = $.Deferred(); 

            setTimeout(function(){

                self.elementInfo.css({
                    opacity : 0
                });
                deferred.resolve(true); 

            },self.time);

            return deferred.promise(); 
        },

        /*
        Hide the info bar after `self.time` ms
        */
        hidePlayer : function(){

            var self = displayAccessor;
            var deferred = $.Deferred(); 

            setTimeout(function(){

                self.elementPlayer.css({
                    opacity : 0
                });
                deferred.resolve(true); 

            },self.time);

            return deferred.promise(); 
        },

        /*
        Hide the whole screen after `self.fade` ms
        */
        hideEverything : function(){

            var self = displayAccessor;
            var deferred = $.Deferred(); 
  
            self.elementWrap.animate({
                opacity : 0
            },self.fade, function(){

                deferred.resolve(true);
            });  

            return deferred.promise(); 
        }, 

        /*
        Show the whole screen after `self.fade` ms
        */
        showEverything : function(){

            var self = displayAccessor;
            var deferred = $.Deferred(); 
  
            self.elementWrap.animate({
                opacity : 1
            },self.fade, function(){

                deferred.resolve(true);
            });  

            return deferred.promise(); 
        }, 


        /*
        Show the info bar after `self.time` ms
        */
        showPlayer : function(){

            var self = displayAccessor;
            var deferred = $.Deferred(); 

            setTimeout(function(){

                self.elementPlayer.css({
                    opacity : 1
                });
                deferred.resolve(true); 

            },self.time);

            return deferred.promise(); 
        },

        error : function(){

            var self = displayAccessor;
            var deferred = $.Deferred();

            self.elementPlayer.hide();
            self.elementLoadingBar.hide(); 
            self.elementLoadingWheel.animate({
                opacity : 0
            },self.fade);
    
            self.elementInfo
                .removeClass("green")
                .removeClass("red")
                .addClass("red")
                .html("player error")
                .animate({
                    opacity : 1
                },self.fade);
            return deferred.promise();  
        },

        /*
        Increment the amount ov videos we have loaded, display info on screen
        */
        loadingProgress : function(newWidth){

            var self = this;
            self.log("loadingProgress()");

            var deferred = $.Deferred();  

            self.elementLoadingBar.find("span").animate({
                width : newWidth+"%"
            }, self.progress, function(){
 
                deferred.resolve(true);  
            });

            return deferred.promise();
        },

        replayOldContent : function(){

            var self = displayAccessor;

            var deferred = $.Deferred();

            self.elementLoadingBar.find("span").css({
                width : 0
            });

            self.elementLoadingWheel.css({
                opacity : 0
            });

            self.showEverything().then(function(){

                self.elementPlayer.animate({
                    opacity : 0
                },self.fade,function(){

                    self.elementLoadingWheel.css({
                        opacity : 1
                    });

                    self.elementLoadingBar.find("span").animate({
                        width : "100%"
                    },self.time, function(){

                        self.elementWrap.css({opacity:0});
                        self.elementPlayer.css({opacity:1});
                        deferred.resolve(true);

                        alert("animation doesnt work well here");

                        self.elementWrap.animate(function(){
                            opacity : 0
                        },self.time,function(){
                            alert('hide elementWrap');
                            self.elementPlayer.animate(function(){
                                opacity : 1
                            },self.time,function(){

                            alert('show elementPlayer');
                                deferred.resolve(true);
                            });
                        }); 
                    }); 
         
                    ...
