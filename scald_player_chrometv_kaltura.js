
(function($) {
     
    /*
    Record a custom event for google analytics
    */ 
    $.gaEvent = function(name,label,value) {
        if(label==null || label===undefined || value==null || value===undefined || name==null || name===undefined)
            ga('send', 'event', 'kaltura-events', 'undefined', 'undefined', false, {'nonInteraction': 1});
        else
            ga('send', 'event', 'kaltura-events', name, label, value, {'nonInteraction': 1}); 
    }
   
    /*
    Get parameters from url
    uri: the uri we are parseing
    name: parameter we need
    */ 
    $.getQuery = function(uri, name) {

        var results = new RegExp('[\?&amp;]' + name + '=([^&amp;#]*)').exec(uri);
        return (results != null) ? (results[1] || 0) : false;
    };

    /*
    Check if a value is in an array
    fn: the array to search
    val: value to search in array
    */ 
    $.arrayContains = function(arr,val) {

        if(arr===undefined || val===undefined)
            return false;
        return arr.indexOf(val) != -1;
    };
    
    kalturaPlayer = {
 
        /*
        Settings from kaltura-server/
        */ 
        playerId : false,
        kalturaId : false,
        kalturaUi : false,

        /*
        Ad url tag
        */ 
        adTagUrl : false,

        /*
        Debugging flag
        */  
        dbug : false,

        /*
        Switch to `false` to disable all video ads
        */ 
        enableAds : false,

        /*
        Enable controls (skipping video), used for debugging
        */ 
        enableControls : false,

        /*
        Switch to `false` to disable all video ads
        Note that this is only applicable to the news pages, not the playlists
        */ 
        adReplay : false,
   
        enablePreroll : false,
        enableMidroll : false,
        enablePostroll : false,

        adLimit : false,
 
        adTimeout : false,
        playlist : 0,
        videoPlaylist : false,
        videoPlaylistFirst : false,
        videoUrl : false,
                        
        videoThumbnailUrl : false,
        videoName         : false,
        videoDescription  : false,
        videoDuration     : false,

        /*
        We support these providers. To add another provider, enter a url which to look for in the XML
        that the adTagUrl (which can be found in the DFP XML) response. 
        Note - this array is sorted by preference - we will pick yumenetworks over any other ad provider
        when there are more than 1 in the ad response
        Note - indecies must match
        */  
        supportedProviders :{
            url  : ["yumenetworks.com", "daptv.advertising.com","bnmla.com","optimatic.com","btrll.com","fastclick.net"],
            type : ["yumenetworks",     "adapttv",              "bnmla",    "optimatic",    "btrll",    "fastclick"]
        },
            
        /*
        These providers are nested. I have no way of figuring this out until I make a second ajax call
        to the ad which could mess up the ad delivery. So if you need to add another provider whose 
        ads are nested (a provider valls another provider who in turn calls another provider who finally serves the ad)
        check the DFP XML response, click through to the adTagUrl link. If that XML contains another adTagUrl, this provider is nested
        */   
        supportedProvidersNested : ["bnmla","fastclick"],
  
        /*
        Settings object which holds ad tags and ad UI configuration
        */ 
        flashvars : {},

        /*
        Kaltura makes no distinction between the ad video or an actual video finishing
        This lock is a workaround that will distinguish between 3 events
        Ad finished
        Ad, and then the video finished
        Just the video finished (it didn't have an ad)

        Playlist is just a flag that allows videos to switch on completion
        */ 
        adlock : 0,

        /*
        A way to track ajax completion and wait until the lock is lifted
        Plus the XML that this ad call returns
        */ 
        globallock : 0,
        nestedXML  : false,

        /*
        Safeguard against JS errors caused by whatever external scripts we
        load - prevent it from reloading the player indefinitely
        */ 
        faillock : 0,

        /*
        Media proxy handles custom video urls and the thumbnail url for video previews
        Link: http://player.kaltura.com/modules/KalturaSupport/tests/StandAlonePlayerMediaProxyOverride.html
        */  
        mediaProxy : {},

        /*
        The next video to be played in the playlist
        */ 
        videoNext : 0,

        /*
        Just a flag to define if we are able to play multiple videos, set to true only on medications pages
        */ 
        playlist : false,
        playlistLimit : 0,

        /*
        About the only clean way to return from a nested ajax call that I could think of
        */ 
        nestedObject : false,

        /*
        Output to a box on the page
        elem: string or object to print
        */ 
        log : function(arr) {

            var self = this;
            if(self.dbug > 0 && arr!==undefined){
     
                //dbug is set to 1 at least, print to console
                console.log(arr);  
            }
        },

        /* ############################ Settings ############################ */ 
        init : function(videos){
 
            var self = kalturaPlayer;
             
            if(videos===undefined || videos==false || videos==null || !videos.length)
                return false;
            /*
            Kaltura Player options 
            */
            options = {
                
                //kaltura server settings
                playerId  : "video-player-chrometv",
                kalturaId : 101,
                kalturaUi : 23448200,

                //debugging: 0|1|2|3
                dbug : 3, 

                //ads settings
                enableAds : false, 
                enableControls : true,

                adTagUrl : "http://pubads.g.doubleclick.net/gampad/ads?sz=560x315&iu=/14312752/FlashPreRoll&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=http%3A%2F%2Fwww.rxwiki.com%2Fabilify&correlator=1454973980&description_url=http%253A%252F%252Fwww.rxwiki.com%252Fabilify&cust_params=PR_URL%3Dfde69917-91bf-4b2b-8095-dcb51f4a382e%26PR_PageTyp%3Drx_brand%26PR_Cndtns%3DAutism+Spectrum+Disorders%2CBipolar+Disord",
                adType : "pre",  // options: pre | mid[not implemented] | post
                adTimeout : 12500, //wait this long on an ad to load, relad player if it doesn't
                adReplay : false, //check true if you want ads when the user clicks "replay" on the video

                videoPlaylist : videos.slice(),
                adLimit : 1,
            }

            /*
            Settings from kaltura-server/
            */ 
            self.playerId =  (options.playerId !== undefined) ? options.playerId : 'videoPlayer';
            self.kalturaId = (options.kalturaId !== undefined) ? options.kalturaId : 101;
            self.kalturaUi = (options.kalturaUi !== undefined) ? options.kalturaUi : 23448200;

            /*
            Ad url tag
            */ 
            self.adTagUrl = (options.adTagUrl !== undefined) ? options.adTagUrl : "";

            /*
            Debugging flag
            */  
            self.dbug = (options.dbug !== undefined) ? options.dbug : 0;

            /*
            Switch to `false` to disable all video ads
            */ 
            self.enableAds = (options.enableAds !== undefined) ? options.enableAds : false;

            /*
            Enable controls (skipping video), used for debugging
            */ 
            self.enableControls = (options.enableControls !== undefined) ? options.enableControls : false;

            /*
            Switch to `false` to disable all video ads
            Note that this is only applicable to the news pages, not the playlists
            */ 
            self.adReplay = (options.adReplay !== undefined) ? options.adReplay : false;
       
            /*
            A switch for enabling either the preroll or the posrtoll ads.
            Only one has to be set to true, esle I will pick any at random
            */ 

            self.enablePreroll = (options.adType !== undefined) ? options.adType == "pre" : false;
            self.enableMidroll = (options.adType !== undefined) ? options.adType == "mid" : false; //not implemented yet since kaltura doesn't really support it
            self.enablePostroll = (options.adType !== undefined) ? options.adType == "post" : false;

            /*
            Disable ads after they have played on the same page `adLimit` times
            */ 
            self.adLimit = (options.adLimit !== undefined) ? options.adLimit : 2;
            self.log("Maximum number of video ads: "+self.adLimit);
  
            /*
            Wait for this much in case an ad fails before skipping the failed ad
            */           
            self.adTimeout = (options.adTimeout !== undefined) ? options.adTimeout : 10000;
            
            /*
            Wait for this much in case an ad fails before skipping the failed ad
            */ 
            self.videoPlaylist = (options.videoPlaylist !== undefined) ? options.videoPlaylist : [];
            self.playlist = Object.keys(self.videoPlaylist).length; //true or a number
            self.playlistLimit = (self.playlist) ? Object.keys(self.videoPlaylist).length : 1;
             
            /*
            Url for the main video to be played after the ad (without the extension: mp4, webm)
            Description, name, duration of the video and the thumbnail
            */   
            self.videoPlaylistFirst = self.videoPlaylist.length > 0 ? self.videoPlaylist[0] : false; 
            
            self.videoUrl = (options.videoUrl !== undefined) ? options.videoUrl : 
                            (self.videoPlaylistFirst != false) ? window.URL.createObjectURL(self.videoPlaylistFirst.file): 
                            "";
                            
            self.videoThumbnailUrl = (options.videoThumbnailUrl !== undefined) ? options.videoThumbnailUrl : "";
            self.videoName         = (options.videoName !== undefined) ? options.videoName : 
                                     (self.videoPlaylistFirst != false) ? self.videoPlaylistFirst.title : 
                                     "";
            self.videoDescription  = (options.videoDescription !== undefined) ? options.videoDescription : "";
            self.videoDuration     = (options.videoDuration !== undefined) ? options.videoDuration : 
                                     (self.videoPlaylistFirst != false) ? self.videoPlaylistFirst.duration : 
                                     "";  

            //reset next video index 
            self.videoNext = 0;

            /*
            Kickoff player 
            */
            $.ajax({
                type: "GET",
                dataType: "XML",
                url: self.adTagUrl,
                success: function(data) {

                    var ad = self.sortAdTypes(data);
                    
                    if(ad){
                        self.log("Providers available in this ad response");
                        self.log(ad);
                    }else
                        self.log("Ad is empty"); 
                    /*
                    The ad has multiple nested adTagUrls, make nested ajax calls
                    until we reach the media file
                    */ 
                    if(ad && ad.nested){
  
                        self.globallock = 1;
                        self.nestedAjax(ad[0]);

                        /*
                        Idle loop until ajax is processed
                        This will hang the player if an unexpected error happens
                        */ 
                        setTimeout(function(){
                            if(self.globallock==0){
                                self.globallock = 1;

                                if(self.nestedObject){ 
                                    // at this point `nestedObject` is set (check nestedAjax to see what sets it)
                                    self.log(self.nestedObject);

                                    //add debugging buttons for copying tags to clipboard
                                    self.log("VAST uri: <input type='button' class='clipboard-button' data-info='" +self.nestedObject.link+"' value='copy to clipboard'> ");
                                    self.log("DFP   uri: <input type='button' class='clipboard-button' data-info='"+self.adTagUrl+"' value='copy to clipboard'> ");
                                    self.log("Ad    XML: <input type='button' class='clipboard-button' data-info='"+self.nestedXML+"' value='copy to clipboard'> ");
                                    self.log("Page  url: <input type='button' class='clipboard-button' data-info='"+document.location+"' value='copy to clipboard'> ");
                                    self.log("Video url: <input type='button' class='clipboard-button' data-info='"+self.videoUrl+"' value='copy to clipboard'> ");
                                }
                                // skip ads if there are no ads in the XML response
                                self.buildVideoPlayer(self.nestedObject);
                            }
                        },500);

                    } else {

                        self.log('Ad is not nested');

                        ad = self.selectAdType(ad);
 
                        //add debugging buttons for copying tags to clipboard
                        self.log("VAST uri: <input type='button' class='clipboard-button' data-info='"+ad.link+"' value='copy to clipboard'> ");
                        self.log("Page  uri: <input type='button' class='clipboard-button' data-info='"+document.location+"' value='copy to clipboard'> ");
                        self.log("Video uri: <input type='button' class='clipboard-button' data-info='"+self.videoUrl+"' value='copy to clipboard'> ");

                        self.buildVideoPlayer(ad);
                    }
                },
                error: function(MLHttpRequest, textStatus, errorThrown) {

                    self.log("DFP url returned an empty/corrupted/broken response. Initiating the player without an ad");   
                    self.buildVideoPlayer(false);
                }
            }); 

            return true;
        }, 

        /*
        Reset the next video name, assumes
        more than 1 elements
        */  
        updateNextVideo : function() {  

            var self = this;
            var counter = 1;
            var length = Object.keys(self.videoPlaylist).length-1;

            if(self.videoNext==length)
                self.videoNext = 0;
            else
                self.videoNext+=1; 
        },

        /*
        Reinitialize the player with half empty falshvars, without any ads
        Note that if the ad fails due to a timeout built in this file
        (since there is an error that Kaltura can't catch) the player would need a second tap to autoplay
        */  
        rebuildPlayerWithoutAds : function() { 

            var self = this;

            self.flashvars = {
                mediaProxy: self.mediaProxy,
                watermark: {
                    "plugin" : false,
                    "img" : "",
                    "href" : "",
                    "cssClass" : "topRight"
                }, 
                forceMobileHTML5: true,
                autoPlay: true,
                adsOnReplay: false,
                enableCORS: true,
                debugMode: self.dbug==3,
                debugLevel: (self.dbug==3) ? 2 : 0,
                autoMute: false,
            }

            if(!self.enableControls){

                flashvars.controlBarContainer = {
                    "plugin": false, 
                }; 
                flashvars.largePlayBtn = {
                    "plugin": false, 
                };
                flashvars.loadingSpinner = {
                    "plugin": false, 
                };
            }

            self.log("Rebuilding player"); 

            kWidget.destroy(self.playerId);
            kWidget.embed({
                'targetId': self.playerId,
                'wid': '_' + self.kalturaId,
                'uiconf_id': self.kalturaUi,

                'flashvars': self.flashvars,
            }); 
        },

        /*
        Call on rebuildPlayer to destroy the kWIdget player
        and reinitialize it with
        */  
        rebuildPlayer : function() { 

            var self = this;
            
            //reset videoNext
            self.updateNextVideo(); 

            var kdp = $('#' + self.playerId).get(0);

            //get next video object
            var video = self.videoPlaylist[self.videoNext]; 
               console.log(self.videoPlaylist);
               console.log(video);
               console.log(self.videoNext);
            //get old video sources and update them with the next video object
            var sources = self.mediaProxy.sources;
             
            sources[0].src = window.URL.createObjectURL(video.file); 
 
            //update the new video palyer sources, thumbnail, description
            self.mediaProxy.sources = sources; 
            self.mediaProxy.entry.description = video.description;
            self.mediaProxy.entry.duration = video.duration;
            self.mediaProxy.entry.name = video.title;
            self.flashvars.mediaProxy = self.mediaProxy; 
 

            /*
            We have reached the max number of times we can display an ad
            Note: was nessesary to put this reset here since there was no way to catch the replay event
            when the user presses it
            */  
            /*
            Disable ads on replay. Note that this prevents ads from replaying after the playlist has ended
            since this is the only way here to disable ads when the user presses the replay button and not
            the "next video button" that rebuilds the player
            */   
            if (self.adLimit <= 0) {     
                self.adReplay = false; 
                self.flashvars.vast = {};

                kdp.sendNotification('cleanMedia'); 
                kdp.setKDPAttribute("vast","prerollUrl","");
                kdp.setKDPAttribute("flashvars","adsOnReplay",self.adReplay && !self.playlistEnded());
                
                self.log("Ads play count reached their limit");  
            } 

            self.log("Rebuilding player"); 
            
            kdp.sendNotification('cleanMedia'); 
            kdp.sendNotification('changeMedia', { 'mediaProxy': self.mediaProxy });
        },
  
        /*
        Repopulate the next video element
        Rebuild kWidget
        videoId: name of th enext video we will play - video[1|2]
        */ 
        initiateVideo : function(videoId) {

            var self = this;
            //default to the global nextVideo
            if(videoId === undefined)
                videoId = self.videoNext;
   
            self.log("Next video: " + videoId);

            //set the next video to be played
            //either from the next button, the playlist dropdown, or through an automatic switch on video completion
            self.videoNext = videoId;

            //disable ad skipping if video is rebuilt
            faillock = 0;
        },
   
        /*
        Append pre or post roll ad parameters to the flashvars.vast object
        obj: has to be the flashvars.vast object
        ad: the ad object with a tag url, parsed from the XML response
        */ 
        appendAdsVAST : function(obj, ad) {
            
            var self = this; 
            if (self.enablePreroll) {

                var temp = {
                    "prerollUrl": ad.link,
                    "prerollUrlJs": ad.link, //enable support for mobile ads
                    "numPreroll": "1",
                    "prerollStartWith": "1",
                    "prerollInterval": "1",
                    "preSequence": "1",
                }

            } else if (self.enablePostroll) {
                var temp = {
                    "postrollUrl": ad.link,
                    "postrollUrlJs": ad.link, //enable support for mobile ads
                    "numPostroll": "1",
                    "postrollStartWith": "1",
                    "postrollInterval": "1",
                    "postSequence": "1",
                }
            }
            for (var val in temp)
                obj[val] = temp[val];

            return obj;
        },

        /*
        Wait until the playlist ends, return a deferred object taht resolves when playlistEnded() returns true
        */
        playlistWaitUntilEnded : function(){

            var deferred = $.Deferred();
            var self = this;  
            var interval = setInterval(function(){

                //after i get this working, i should start fetching stuff
                //after intial content load to have it available right away
                var ended = self.playlistEnded();
                if(ended){  
                    clearInterval(interval);
                    deferred.resolve(true);
                } 
            },1000);
            
            return deferred.promise();   
        },

        /*
        Check if the playlist (when it is available) ended
        (which means we have watched all the videos in the playlistArrayEn)
        */ 
        playlistEnded : function() {

            var self = this;  
            // false if not a playlist page
            if (!self.playlist)
                return false;
 
            // false if played entire playlist
            var autoPlay = self.playlistLimit <= 0;
            self.log("\n\n\nPlaylist autoplay is disabled: "+autoPlay+" | remaining: "+self.playlistLimit);

            return autoPlay;
        },

        /*
        Submit an ajax request to a parsed impression link so that DFP
        records this ad as 'viewed'
        ad: ad object form which we will get the impression url
        NOTE: try parsing the other impression link instead - viewable impression. see if this works first
        */ 
        sendImpression : function(ad){

            var self = this;
            // if(ad.link != ""){
            //     $("body").append("<img src='"+ad.link+"' style='display:none;'>");
            //     self.log("\n\n\nDFP impression triggered: "+ad.link);  
            // }else
            //     self.log("\n\n\nDFP impression not triggered, this provider doesn't support it"); 
        },

        /*
        Submit an ajax request to a parsed error link so that DFP
        records this ad as 'not viewed'
        ad: ad object form which we will get the error url
        */ 
        sendError : function(ad){
            
            var self = this;
            // if(ad.link != ""){
            //     $("body").append("<img src='"+ad.link+"' style='display:none;'>");
            //     self.log("\n\n\nDFP error triggered: "+ad.link);
            // }else
            //     self.log("\n\n\nDFP error not triggered, this provider doesn't support it"); 
        },

        /*
        To be reworked
        ad  -  type:  optimatic
                       yumenetworks
                       bnmla
                       doubleclick
                       other
                link:  url to the ad
                impression: track error impression
                error: track error event
        Note - ad can be false-in which case no ads will be played
        */ 
        buildVideoPlayer : function(ad) {
            
            var self = this;
            /*
            Only initiate the ad if the ad exists
            */   
            if(ad){

                // self.log("VAST url: "+ad.link);
                self.log("Provider: " + ad.type); 
                self.log("Ad impression uri: "+ad.impression);
                self.log("Ad error uri: "+ad.error); 

                // if the ad is from our tested providers
                if (false) { //disbale doubleclick for now

                    /*
                    DoubleClick for the DFP plugin
                    http://player.kaltura.com/docs/DoubleClick
                    */ 
                    self.flashvars = {
                        /*
                       * Doubleclick not working with mediaproxy custom URLs, use generic vast instead below
                       */ 
                        "doubleClick": {
                            "plugin": true,
                            "path": "http://cdnbakmi.kaltura.com/content/uiconf/ps/veria/kdp3.9.1/plugins/doubleclickPlugin.swf",
                            "adTagUrl": self.adTagUrl,
                            "disableCompanionAds": true,
                        },
                    }

                } else {

                    /*
                    Generic VAST for other providers
                    */ 
                    self.flashvars = {

                        "vast": {
                            "plugin": true,
                            "position": "before",
                            "timeout": "30",
                            "relativeTo": "PlayerHolder",
                        }, 

                        "skipBtn": {
                            "skipOffset" : "60",
                            "label" : "Skip Ad"
                        },

                        "adsOnReplay": self.adReplay && !self.playlist,
                        "inlineScript": false,
                        "ForceFlashOnDesktopSafari": false,
                    }
             
                    self.flashvars.vast = self.appendAdsVAST(self.flashvars.vast, ad);
                }

                /*
                Ad response is empty, dont load any ads
                */ 
                if (ad.link == "") { 
                    self.flashvars = {};
                    self.log("Ads link empty. Disabling ads.");
                }

                /*
                All mobile ads are disabled, clear flashvars and disable ads
                */ 
                if (!self.enableAds) {

                    self.flashvars = {};
                    self.log("Ads disabled in settings.");
                }  
            } 


            /*
            Erase left bottom corner watermark on the video
            */ 
            self.flashvars.watermark = {
                "plugin" : false,
                "img" : "",
                "href" : "",
                "cssClass" : "topRight"
            } 

            /*
            Set up custom video sources
            */ 
            self.mediaProxy.preferedFlavorBR = -1;


                                     
            self.mediaProxy = {
                'entry': {
                    "thumbnailUrl": self.videoThumbnailUrl,
                    "name": self.videoName,
                    "description": self.videoDescription,
                    "duration": self.videoDuration
                },
                'sources': [{
                    "src": self.videoUrl,
                    "width": "624",
                    "height": "352",
                    "bandwidth": "740352",
                    "type": "video/webm; codecs='vp8, vorbis'",
                }]
            };

            self.flashvars.mediaProxy = self.mediaProxy; 
  
            /*
            Enable hover controls
            */ 
            if(!self.enableControls){

                self.flashvars.controlBarContainer = {
                    "plugin": false, 
                }; 
                self.flashvars.largePlayBtn = {
                    "plugin": false, 
                };
                self.flashvars.loadingSpinner = {
                    "plugin": false, 
                };
            } 

            /*
            Disable ads on replay. Note that this prevents ads from replaying after the playlist has ended
            since this is the only way here to disable ads when the user presses the replay button and not
            the "next video button" that rebuilds the player
            */ 
            self.flashvars.adsOnReplay = self.adReplay && !self.playlist;

            /*
            Disable autoplay on mobile only
            */ 
            self.flashvars.autoPlay = true;

            /*
            Enable debugging when needed,
            send cross domain headers to prevent console warnings,
            prevent ads form playing after video starts from beginning
            */  
            self.flashvars.enableCORS = true;
            self.flashvars.debugMode = self.dbug==3,
            self.flashvars.debugLevel = (self.dbug==3) ? 2 : 0,
            self.flashvars.autoMute = false;
            self.flashvars.externalInterfaceDisabled = false;  

            self.flashvars.EmbedPlayer = {
                DisableEntryCache : false
            };
 
            kWidget.embed({

                'targetId': self.playerId,
                'wid': '_' + self.kalturaId,
                'uiconf_id': self.kalturaUi,
 
                'KalturaSupport.LeadWithHTML5': true,
                'EmbedPlayer.NativeControls': true,
                'EmbedPlayer.CodecPreference': 'webm',

                'flashvars': self.flashvars,
                'readyCallback': function(playerId) {
                     
                    var kdp = $('#' + self.playerId).get(0);

                    $("#kaltura-player-wrap").css({display:"table"});  

                    /*
                    Force autoplay in case of an error on page
                    Only if it is a preroll ad
                    */ 
                    if (self.enablePreroll)
                        kdp.sendNotification("doPlay");

                    /*
                    Ad error events catches
                    Ads will be skipped automatically on this event, but need to disable the timeout
                    function [faillock] from rebuilding the player.
                    */ 
                    kdp.kBind('adErrorEvent', function(qPoint) {

                        self.log("\n\n\n\nadErrorEvent\n\n\n\n");
                        self.faillock = 0;  

                        //record ad as not shown since there was an error
                        self.sendError(ad); 
                        $.gaEvent("gaError","type","adErrorEvent"); 
                    });
                    kdp.kBind('adLoadError', function(qPoint) {

                        self.log("\n\n\n\adLoadError\n\n\n\n");
                        self.faillock = 0;
                        self.adlock = 0;
                        self.rebuildPlayerWithoutAds(); 

                        //record ad as not shown since there was an error
                        self.sendError(ad);
                        $.gaEvent("gaError","type","adLoadError"); 
                    });
                    kdp.kBind('mediaError', function(qPoint) {

                        self.log("\n\n\nmediaError\n\n\n"); 

                        //record ad as not shown since there was an error
                        self.sendError(ad);
                        $.gaEvent("gaError","type","nmediaError"); 
                    });
                    kdp.kBind('entryFailed', function(qPoint) {

                        self.log("\n\n\nentryFailed\n\n\n"); 

                        //record ad as not shown since there was an error
                        self.sendError(ad);
                        $.gaEvent("gaError","type","entryFailed"); 
                    });

                    /*
                    Safeguard against failure - skip to the video if ads fail to play
                    Initiate if we are on Desktops or if we are on mobile and are serving a supported provider while mobile ads are enabled
                    Enable ad lock check if the ad did start. Wait for it to start playing for 10
                    seconds and skip it if it doesn't start in this time (since it probably failed to load)
                    */   
                    kdp.kBind('adStart', function(qPoint) {

                        self.log("\n\n\nAd provider begins delivery...");
 
                        self.faillock = 1;
                        setTimeout(function() {

                            if (self.faillock == 1) {

                                self.log("Ad took more than "+self.adTimeout+" milliseconds, cut to content video");

                                /* In case if it is a postroll ad and a playlist page, we skip to the next
                                video and hope that this time the ad plays.
                                else reload the video with no ads */ 
                                if (self.playlist && self.enablePostroll) {   
                                    self.rebuildPlayer();
                                } else {
                                    self.adlock = 0;
                                    self.rebuildPlayerWithoutAds();
                                } 

                                //record ad as not shown since there was an error
                                self.sendError(ad);
                                $.gaEvent("gaError","type","atTimeout"); 
                            }

                        }, self.adTimeout); 
                    });


                    /*
                    enable ad lock check if the ad did start
                    Note - adLimit would ideally be decremented when the ad ends
                    since this way the user can click through the player and force the
                    ad replay to be disabled on playlist end. Problem is, adEnd event is fired
                    when the video is skipped as well and it's not a priority to build a workaround for this now
                    */ 
                    kdp.kBind('onAdPlay', function(start) {

                        self.adLimit -= 1;
                        self.log("Possible ads remaining: "+self.adLimit);

                        self.log("Ad started playing");
                        //disable timeout that will rebuild the video player
                        self.faillock = 0;

                        //record ad as shown if it begins playing
                        self.sendImpression(ad);

                        $.gaEvent("gaImpression","provider",ad.type);  
                    });


                    // fire when ad is finished playing
                    if (self.enablePreroll)
                        kdp.kBind('adEnd', function(qPoint) {

                            self.adlock = 1;
                            self.faillock = 0;
                            self.log("Preroll Ad ended");

                            $.gaEvent("gaAd","interaction","ad ended");  
                        });

                    /*
                    Since kaltura doesnt have a way to distinuish between
                    the start of a video or an ad, we need a workaround with counters. ALso
                    we need to have 2 ways of distinuishing video/ad start end events,
                    for pre and post roll ads.
                    */ 
                    kdp.kBind('playbackComplete', function(eventData) {
                        
                        if (self.enablePreroll) {

                            /*
                            Catch the end of video event, disable ads when user presses replay
                            */  
                            if (self.adLimit <= 0) {    
                                self.adReplay = false; 

                                kdp.setKDPAttribute("flashvars","vast",{});
                                kdp.setKDPAttribute("flashvars","adsOnReplay",self.adReplay && !self.playlistEnded());

                                self.log("Ads play count reached their limit");
                            } 

                            //ad finished playing, and then the video
                            if (self.adlock == 2) {
                                self.log("Ad and video finished. Rebuilding player");

                                self.adlock = 0;

                                // block autoplay if the playlist has reached its limit
                                if (self.playlistEnded())
                                    return; 
                                self.rebuildPlayer(); 

                                $.gaEvent("gaAd","interaction","ad and video ended"); 
                                return;

                            //there was no ad on this page, so only the video played
                            } else if (self.adlock == 0) {

                                self.log("Video finished. Rebuilding player");
 
                                self.adlock = 0;
                                 
                                /*
                                Video played, decrement ad counter after which ads will 
                                stop playing. Note that if you put this decrement into onAdPlay
                                the playlist will not stop until an ad plays, which will not happen if the ad 
                                originally returns empty XML.
                                */ 
                                self.playlistLimit-=1; 

                                // block autoplay if the playlist has reached its limit
                                if (self.playlistEnded())
                                    return;
 
                                self.rebuildPlayer();

                                $.gaEvent("gaAd","interaction","video ended"); 
                                return;

                                //the ad finished
                            } else if (self.adlock == 1) {

                                self.adlock = 2;
                                self.log("Ad finished");
                            }
                        }  
                    });
                     

                    // fire when ad starts playing
                    if (self.enablePostroll)
                        kdp.kBind('adEnd', function(qPoint) { 
                            self.log("Postroll Ad ended");
                        }); 

                    //register an ad click
                    kdp.kBind('adClick', function(){
                        $.gaEvent("gaAd","interaction","click"); 
                    }); 

                    //register player pause
                    kdp.kBind('playerPaused', function(){
                        $.gaEvent("gaVideo","interaction","pause"); 
                    }); 

                    //register player pause
                    kdp.kBind('mute', function(){
                        $.gaEvent("gaVideo","interaction","mute"); 
                    }); 

                    //register player quartiles
                    kdp.kBind('firstQuartile', function(){
                         
                        $.gaEvent("gaVideo","quartile","first"); 
                    }); 
                    kdp.kBind('secondQuartile', function(){
                         
                        $.gaEvent("gaVideo","quartile","second"); 
                    }); 
                    kdp.kBind('thirdQuartile', function(){
                       
                        $.gaEvent("gaVideo","quartile","third"); 
                    }); 
                    kdp.kBind('playerPlayEnd', function(){
                         
                        $.gaEvent("gaVideo","quartile","fourth"); 
                    });   
                     
                } //ready callback ended
            }); 
        },


        /*
        Select which ad type it is based on the given url
        url: link to the VAST XML that holds the ad
        */ 
        getAdType : function(adUrl){ 

            var self = this;
            for(var index in self.supportedProviders.url){

                var url = self.supportedProviders.url[index]; 
                if(adUrl.indexOf(url) != -1)
                    return self.supportedProviders.type[index];
            } 
            return "other";
        },

        /*
        Sort ad types so that the least broken ones are served first
        Return an array of provider objects if found, false otherwise
        */ 
        sortAdTypes : function(data) {

        ....
