
(function($) {
 
    /* 
    #################################################################
    `videoAccessor` accepts a required videoDatabase object / any other object with get/set functions
    It fetches a playlist from v1.rxwiki.com if videos aren't available in local storage, or 
    loads them from local if they are available. Handles buffering up more videos on signal interrupts,
    initiates the kaltura player object 
    ################################################################# 
    */ 
    videoAccessor = {
    
        /*
        Host of where we get our videos from [videoServerUrl] 
        and where the js/html/initial playlist files are hosted [fileServerUrl]
        */
        videoServerUrl : "", 
        fileServerUrl : "",
  
        videoCount : 0,//count of currently loaded videos
        videosCount : 0,//count of all loaded videos
        
        /*
        Array of video objects populated from a call to the `fileServerUrl`
        {
            duration: 55
            id: "16"
            title: "Rx A New Type of ADHD Rx"
            type: "video"
            uuid: "f027dc1c-b8d1-4a58-89ac-f4ac65fb3c90" 
            url : "http://v1.rxwiki.com/f027dc1c-b8d1-4a58-89ac-f4ac65fb3c90.webm"
        }
        */
        videos : [], 

        /*
        Don't know why we would need those
        */
        key : "", 
        timeout : 0,  
  
        //debugging: 0|1
        dbug : 0,
 
        log : function(arr) {

            if(this.dbug > 0 && arr!==undefined){
     
                //dbug is set to 1 at least, print to console
                console.log("::::::::: Accessor ::::::::");  
                console.log(arr);  
            }
        },

        /*
        Set up all global settings passed into the object 
        */
        init : function(options){

            var self = this; 
            self.log("init()"); 
              
            if(options!==undefined)
                self.log(options);

            /*
            Set up default settings
            id and key are leftovers, might not use
            */
            self.videoServerUrl = (options.videoServerUrl !== undefined) ? options.videoServerUrl : "http://v1.rxwiki.com"; 
            self.fileServerUrl = (options.fileServerUrl !== undefined) ? options.fileServerUrl : "http://rxwiki.com"; 
            
            self.key = (options.key !== undefined) ? options.key : "";  

            self.timeout = (options.timeout !== undefined) ? options.timeout : 300000; 
            self.dbug = (options.dbug !== undefined) ? options.dbug : 0;   
            self.time = (options.time !== undefined) ? options.time : 2000; 
        }, 

        /*
        Make a call to fileServerUrl and get all video urls
        */
        /*
        @@@@@@@@@@@@@@@@@
        url: http://semur-dev.rxwiki.com/frag/scald/player/chrometv

        so i need to set allow cross origin, i cant ot that on a file specificaly
        need to set it up for the whole container, and give access to my dev

        cant do this through the cdn, need to use commands?
        whoever set this system up - need to ask how much i can mess with it
        //https://github.com/rackspace/pyrax/issues/364
        //https://developer.rackspace.com/docs/cloud-files/v1/developer-guide/#cors-objects

        PUT /v1/977043/video_out/0002a238-7b63-4a7                  0-925f-da24d125a612.webm HTTP/1.1
        Host: semur-dev.rxwiki.com
        X-Auth-Token: yourAuthToken ???????????
        Origin: http://semur-dev.rxwiki.com
        */
        getAll : function(){

            var self = videoAccessor;
            self.log("loadVideosIntoCache()"); 
  
            var deferred = $.Deferred();   
 
            var url = self.fileServerUrl+"frag/tv/show/" + self.key;
            $.getJSON(url, function(result) {
 
                self.log("loadVideosIntoCache() getJSON"); 
                 
                //temporal override
                result = {
                    "name": "RxWIki Show",
                    "segments": [{
                            "title": "1 Rx In Late Preterm Births, This Rx Could Help Baby's Lungs",
                            "duration": 93,
                            "type": "video",
                            "uuid": "0002a238-7b63-4a70-925f-da24d125a612"
                    }/*, {
                            "title": "1 Bydureon",
                            "duration": 45,
                            "type": "video",
                            "uuid": "0008cf96-50fa-4207-bef9-c28521ad2210"
                    }, {
                            "title": "2 Bydureon",
                            "duration": 45,
                            "type": "video",
                            "uuid": "0025d68f-3b15-4181-b201-5a2e1b6f1487"
                    }, {
                            "title": "3 Bydureon",
                            "duration": 45,
                            "type": "video",
                            "uuid": "00257e5f-9e98-4d14-a693-6e74bd399c64"
                    }, {
                            "title": "4 Bydureon",
                            "duration": 45,
                            "type": "video",
                            "uuid": "000ce37f-951c-43c3-9c5f-b07b87718ff0"
                    }*/],
                    "type": "tv_show",
                    "uuid": "b9d45059-3002-4891-ac4e-d787e2400810"
                };

                if(result==null){
                    self.log("no results found");
                    return false;
                }

                result = result.segments;
                self.videosCount = result.length;//initiate total video count
                
                ...
