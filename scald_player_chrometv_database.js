(function($) { 
    /*
    ################################################################# 
    `videoDatabase` handles local storage
    Use it to add files/text into the browser
    Had accessor/mutator methods to get/set/delete info
    ################################################################# 
    */ 
    videoDatabase = {
 
        videoDatabaseRequest : false,
        videoDatabaseData : false,
        videoDatabaseLocked : false, 
        dbug : 0,


        log : function(arr) {

            if(this.dbug > 0 && arr!==undefined){
     
                //dbug is set to 1 at least, print to console
                console.log("::::::::: Database ::::::::");  
                console.log(arr);  
            }
        },

        /*
        Set up all global settings passed into the object 
        Initiate indexedDB, connect to it, make a new schema
        */
        init : function(options){

            var self = videoDatabase;  
            self.log("init()");

            var deferred = $.Deferred();
            

            self.dbug = (options.dbug !== undefined) ? options.dbug : 0;  

            if(options!==undefined)
                self.log(options);
             
            var self = videoDatabase; 
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
               
            if (!window.indexedDB) {

                self.log("init() fail - no window.indexedDB");
                self.videoDatabaseLocked = true;
                deferred.resolve("from databaseError");
  
            }else{ 
 
                self.log("init() success");
                self.videoDatabaseRequest = window.indexedDB.open("videosDatabase", 2); //@@@ change to 2 when on app 
                
                /*
                Check for errors, if we cannot connect, exit ?
                */  
                self.videoDatabaseRequest.onerror = function(event) {
 
                    self.log("init() videoDatabaseRequest fail");  

                    self.videoDatabaseLocked = true;
                    deferred.resolve("from databaseError");
                } 

                self.videoDatabaseRequest.onsuccess = function(event) {
             
                    self.log("init() videoDatabaseRequest success");

                    self.videoDatabaseData = event.target.result;
                    self.videoDatabaseLocked = false;
                    deferred.resolve("from databaseSuccess");
                } 

                /*
                Make sure that the indexedDB version is above 1, else the `onupgradeneeded` will not fire and
                the table schema will never be stored
                */
                self.videoDatabaseRequest.onupgradeneeded = function(event) {
                    
                    self.log("init() videoDatabaseRequest upgrade"); 

                    self.videoDatabaseData = event.target.result;
                    self.log(self.videoDatabaseData);

                    var objectStore = self.videoDatabaseData;
                    
                    objectStore
                        .createObjectStore('videos', {
                            keyPath:"id"
                        })
                        .createIndex('id', 'id', {
                            unique:true
                        });    
  
                    self.videoDatabaseLocked = false;
                    deferred.resolve("from databaseSuccess & databaseUpgrade");
                }
                return deferred.promise();  
            }    
        },

        /*
        Get cached object based on key
        */
        get : function(){

            console.log('.........');
        }, 

        /*
        Get all db contents, insert into an array
        */
        getAll : function(){

            var self = this; 
            var deferred = $.Deferred();  

            self.log("getAll()");  

            var request = self.videoDatabaseData.transaction(["videos"],"readonly"); 
            request = request.objectStore("videos").getAll();//note - this method is supported only in the most resent chrome version
         
            request.onerror = function(error) {
 
                deferred.resolve(false); 
            }; 
            request.onsuccess = function(event) {   
                
                var data = event.target.result; 
                deferred.resolve(data); 
            }; 
 
            return deferred.promise();
        }, 

        /*
        Fetch files form server based on provided array of urls 
        */
        add : function(data){

            ...
