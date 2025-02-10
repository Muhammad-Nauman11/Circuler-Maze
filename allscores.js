document.addEventListener("DOMContentLoaded", function () {
    const leaderboardBody = document.querySelector("#leaderboard tbody");
    const sheetDB_URL = "https://sheetdb.io/api/v1/6wiatogjrsk32";

    // Fetch and display leaderboard data
    fetch(sheetDB_URL)
        .then(response => response.json())
        .then(data => {
            // Convert data to leaderboard format
            const scores = data.map(entry => ({
                user: entry.Player ? entry.Player.trim() : "Unknown",
                email: entry.Email ? entry.Email.trim() : "N/A",
                score: entry.Score ? parseInt(entry.Score.trim()) : 0
            }));

            // Sort scores from highest to lowest
            scores.sort((a, b) => b.score - a.score);

            // Populate leaderboard
            scores.forEach((entry, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${index + 1}</td><td>${entry.user}</td><td>${entry.email}</td><td>${entry.score}</td>`;
                leaderboardBody.appendChild(tr);
            });
        })
        .catch(error => console.error("Error loading leaderboard:", error));

    // Export Leaderboard as CSV (Protected by Password)
    document.getElementById("downloadExcel").addEventListener("click", function () {
        const password = prompt("Enter password to export:");
        if (password !== "Media@2211") {
            alert("Unauthorized access! Only authorized personnel can export.");
            return;
        }

        let csvContent = "Rank,Player,Email,Score\n"; // CSV headers

        document.querySelectorAll("#leaderboard tbody tr").forEach((row) => {
            const columns = row.querySelectorAll("td");
            const rowData = Array.from(columns).map(td => td.innerText);
            csvContent += rowData.join(",") + "\n";
        });

        // Create a CSV file and trigger download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Leaderboard.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
