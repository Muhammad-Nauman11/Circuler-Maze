document.addEventListener("DOMContentLoaded", function () {
    const texts = [
        { element: "animated-text", text: "THE WORLD IS NOW YOUR OYSTER.\nYOU LEARNED THE RULES AND PLAYED\nTHE GAME WELL, YOU ARE NOW\nCLASSIFIED AS A FREE-MINDED\nCITIZEN. THOSE LEFT BEHIND MAY\nSTART TO VIEW YOU DIFFERENTLY\nAND VICE VERSA. BE PREPARED,\nSTAY FOCUSED, AND KEEP YOUR\nFREQUENCY LEVEL HIGH." },
        { element: "message-text", text: "ENTER YOUR PLAY TO STAY CONNECTED." },
        { element: "emailText", text: "EMAIL " }
    ];
    
    let index = 0;
    let textIndex = 0;
    const speed = 50;
    let email = "";
    let isTypingEnabled = false;

    function typeEffect() {
        const currentText = texts[textIndex];
        const targetElement = document.getElementById(currentText.element);
        
        if (index < currentText.text.length) {
            targetElement.innerHTML += currentText.text.charAt(index);
            index++;
            setTimeout(typeEffect, speed);
        } else {
            targetElement.innerHTML += "<br>"; // New line
            
            if (textIndex < texts.length - 1) {
                textIndex++;
                index = 0;
                setTimeout(typeEffect, speed);
            } else {
                enableEmailTyping();
            }
        }
    }

    function enableEmailTyping() {
        isTypingEnabled = true;
        document.addEventListener("keydown", handleTyping);
    }

    function handleTyping(event) {
        if (!isTypingEnabled) return;

        const allowedCharacters = /^[a-zA-Z0-9@._-]$/;

        if (event.key === "Backspace") {
            email = email.slice(0, -1);
        } else if (event.key === "Enter") {
            validateAndSaveEmail();
            return;
        } else if (allowedCharacters.test(event.key)) {
            email += event.key;
        }

        document.getElementById("emailDisplay").textContent = email;
    }

    function validateAndSaveEmail() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Invalid email. Please enter a valid email.");
            return;
        }

        // Save email to localStorage
        localStorage.setItem("playerEmail", email);

        // Get score from localStorage (or set default if missing)
        const score = localStorage.getItem("score") || "0";
        const playerName = email.split("@")[0]; // Extract name from email

        saveScoreToGoogleSheet(playerName, email, score);
    }

    function saveScoreToGoogleSheet(name, email, score) {
        const sheetDB_URL = "https://sheetdb.io/api/v1/6wiatogjrsk32";

        fetch(sheetDB_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ Player: name, Email: email, Score: score }]),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            window.location.href = "allscores.html"; // Redirect after saving
        })
        .catch(error => console.error("Error:", error));
    }

    typeEffect(); // Start typing effect
});
