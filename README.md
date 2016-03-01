# chrome-tv

A small project I worked on that lets you play videos offline on a chromebox. 
See the Main class for implementation overview. Relies heavily on jQuery promises to synchronize workflow. 
Note - project is not finished - still need to finish the part that preloads new videos once a new playlist starts playing/fix small animation bugs

# Set up
This project consists of 5 classes:
  1 Database class that simplifies indexedDB interaction through getter/setter/init methods 
  2 Video class that handles fetching new content (links to video files) from a separate server
  3 Display class takes care of animations and transitions
  4 Kaltura class plays the actual video and has methods to reinitiate the player to the next video/play ads/functions that rebuild the player in case the ad happens to break the player
  5 A main class that puts the above 4 classes together
