// Preload all images before transition starts
function preloadImages(sources, callback) {
  let loadedImagesCount = 0;
  const totalImages = sources.length;

  // Create image elements for each source
  sources.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedImagesCount++;
      if (loadedImagesCount === totalImages) {
        // Once all images are loaded, execute the callback
        callback();
      }
    };
    img.onerror = () => {
      loadedImagesCount++;
      if (loadedImagesCount === totalImages) {
        // Even if some images fail to load, proceed with callback
        callback();
      }
    };
  });
}

// Function to start the transition after all images are loaded
function startTransition(event) {
  event.preventDefault(); // Prevent default link behavior
  
  // List of images to preload
  const imagesToPreload = [
    'assets/title.png',    // Title image
    'assets/leaderboard.png', // Leaderboard button image
    'assets/guide.png'     // Guide background image
  ];

  preloadImages(imagesToPreload, function() {
    // Change the background to guide.png once all images are loaded
    document.body.style.background = "black url('assets/guide.png') no-repeat center center";
    document.body.style.backgroundSize = "contain";

    // Hide the title image to reveal the new background
    document.getElementById('titleImage').style.display = 'none';
    // Hide the leaderboard button
    document.getElementById('leaderboard').style.display = 'none';
    // Redirect to maze.html after 2 seconds (2000 milliseconds)
    setTimeout(() => {
      window.location.href = "maze.html";
    }, 4000);
  });
}

// When the window loads, call the image map resizer to update coordinates dynamically
window.onload = function() {
  if (typeof imageMapResize === 'function') {
    imageMapResize();
  }
};