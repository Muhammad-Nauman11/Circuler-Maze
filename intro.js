// When the window loads, call the image map resizer to update coordinates dynamically.
window.onload = function() {
  if (typeof imageMapResize === 'function') {
    imageMapResize();
  }
};

function startTransition(event) {
  event.preventDefault(); // Prevent default link behavior

  // Change the background to guide.png
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
}
