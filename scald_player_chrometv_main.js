(function($) { 

    /* 
    #################################################################
    Main class that initiates the playlist using the objects above 
    #################################################################
    */
    
    main = {
  
        connectionUrl : "http://semur-dev.rxwiki.com/frag/tv/show/b9d45059-3002-4891-ac4e-d787e2400810",
        
        //debugging: 0|1
        dbug : 0,
 
        log : function(arr) {

            if(this.dbug > 0 && arr!==undefined){
     
                //dbug is set to 1 at least, print to console
                console.log("::::::::: Main ::::::::");  
                console.log(arr);  
            }
        },


        /*
        Initiate the videoDatabase class, use it to fetch data from our rxwiki.com server through
        the videoAccessor class.
        */
        init : function(options){

            var self = main;
            self.log("init()");

            self.dbug = (options.dbug !== undefined) ? options.dbug : 0;  


            //initiate display object to change view
            displayAccessor.init();
            
            //initiate the videoAssessor object to be able to get new video links
            videoAccessor.init({
                key : "b9d45059-3002-4891-ac4e-d787e2400810", 
                timeout : 300000,
                videoServerUrl : "http://semur-dev.rxwiki.com/sites/all/themes/tseven/videos/", 
                // videoServerUrl : "http://v1.rxwiki.com/", 
                fileServerUrl : "http://semur-dev.rxwiki.com/", 
                dbug : 0,
                time: 1000, 
            });

            //initiate indexDB for local storage access
            videoDatabase.init({    

                dbug : 0

            }).then(function(){
                
                self.checkConnection()
                    .then(function(data){
                    
                    var connection = data; 

                    //able to connect. either get presaved data or fetch new one if nothing is available in DB
                    if(connection){ 

                        //check db existing stuff
                        videoDatabase.getAll()
                            .then(function(videos){
  
                            //db not empty
                            if(videos && videos.length > 0){

                                displayAccessor.yesInternetYesContent();

                                //make the loading bar fill up fast
                                //and start off the player with cached from DB videos
                                displayAccessor.loadingBarComplete()
                                    .then(function(){
                
                                    displayAccessor.hideEverything()
                                        .then(function(){

                                        self.initiatePlayer(videos);
                                    });
                                }); 
                                 
                            //db empty, fetch new content and fill db
                            }else{

                                displayAccessor.yesInternetNoContent();
                                     
                                //new videos fetched from server, passed into appReloadFromServer to reinitiate the player
                                videoAccessor.getAll()
                                    .then(function(videos){ 

                                        
                                        //add all videos to local storage
                                        for(var val in videos){
                                            videoDatabase.add(videos[val])
                                                .then(function(){

                                                var newWidth = videoAccessor.loadingProgress(); 
                                                displayAccessor.loadingProgress(newWidth); 
                                            });  
                                        }
                                        
                                        //once all videos have been loaded, 
                                        videoAccessor.loadingComplete()
                                            .then(function(){

                                                //load videos into db, show loading progress, initiate player once done 
                                                self.appLoad(videos); 

                                        });  
                                    });  
                            }
                        }); 

                    //not able to connect. either get presaved data or display error mesage
                    }else{
 
                        //check db existing stuff
                        videoDatabase.getAll()
                            .then(function(videos){

                            //db not empty
                            if(videos && videos.length > 0){

                                displayAccessor.noInternetYesContent(); 

                                //make the loading bar fill up fast and start off the player with cached from DB videos
                                displayAccessor.loadingBarComplete()
                                    .then(function(){

                                    displayAccessor.hideEverything()
                                        .then(function(){

                                        self.initiatePlayer(videos);
                                    });
                                });  

                            //db empty, cant fetch new content
                            }else{

                                displayAccessor.noInternetNoContent();
                            }
                        });

                    }//end connection

                });//end checkConnection()

            });//end videoDatabase.then()
        },
 
        /*
        Initiate the kaltura player (with a flag check that will only initiate it once) 
        */
        initiatePlayer : function(videos){

            var self = main;
            self.log("initiatePlayer()");
  
            var initSuccess = kalturaPlayer.init(videos);
            if(!initSuccess)
                displayAccessor.error();
        }, 

        /*
        A recursive helper function that fires up every time we are finished loading content  
        */
        appLoad : function(videos){

            var self = main;  
            self.log("appLoad() loaded videos into DB");
            alert('rework some animation in appLoad()');

            // displayAccessor.hidePlayer().then(function(){


                displayAccessor.hideInfo()
                    .then(function(){

                    //face everything out and start kaltura player
                    displayAccessor.hideEverything()
                        .then(self.initiatePlayer(videos));
                      
                    //if the list of videos changed, fetch new videos right away
                    videoAccessor.isChanged()
                        .then(function(changed){

                        //start fetching new videos if new ones are available right away
                        if(changed){

                            //start fetcing new videos and updating db - i might have to initiate a new table/keystore

                            //wait until playlist ends and then reinitiate player
                            kalturaPlayer.playlistWaitUntilEnded()
                                .then(function(){
                                
                                //new videos are loaded, initiate player
                                alert('ended playlist - didnt finish this part yet');
                                //new videos still loading, replay old ones over again

                                // displayAccessor.replayNewContent();
                                // displayAccessor.replayOldContent();
                            });

                        //no new videos available, replay old ones over again
                        }else{
                            kalturaPlayer.playlistWaitUntilEnded()
                                .then(function(){

                                    displayAccessor.replayOldContent()
                                        .then(function(){

                                            alert('reorganize stuff here - make this a recursive call');
                                            alert('keep appLoad, but take some wrapping functions out into main()');
                                            self.appLoad(videos);
                                        }); 
                                }); 

                        }//end isCHanged
                    }); //end hideInfo

                }); //end hideInfo

            // });//end hidePlayer
        },
  
        /*
        Check if connected to internet
        */
        checkConnection : function(){

            var self = main;
            var deferred = $.Deferred();
            

            $.ajax({
                type: "GET",
                dataType: "JSON",
                url: self.connectionUrl,
                success: function(data) {
 
                    deferred.resolve(true);
                },
                error: function(MLHttpRequest, textStatus, errorThrown) {
  
                    deferred.resolve(false); 
                }
            });
            return deferred.promise();  
        },
    }

    /*
    Drop the databse each time we reload the screen - for testing
    */  
    main.init({
        dbug : 1
    });
    
    

})(jQuery);   
