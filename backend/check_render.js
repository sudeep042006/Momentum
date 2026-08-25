async function check() {
    try {
        console.log("Fetching refresh from jdcd...");
        const res = await fetch('https://momentum-jdcd.onrender.com/api/users/refresh', {
            method: 'POST',
            headers: {
                'Origin': 'http://localhost:5173',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: 'fake' })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body length:", text.length);
        console.log("Snippet:", text.substring(0, 100));
    } catch(e) {
        console.error("Error jdcd:", e.message);
    }
}

check();
