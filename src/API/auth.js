// API Login
export async function login (email, password){
    try {
        const res = await fetch('http://localhost/stage/backend_nabu/index.php?action=login', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({email, password}),
        })

        if (!res.ok) {
            throw new Error(`Echec de connexion, statut ${res.status}`)
        }

        return res.json()
    } catch (error) {
        console.error('Erreur lors de la requete de connexion :', error)
        throw error
    }
}

// API Déconnexion
export async function logout() {
	try {
		const res = await fetch('http://localhost/stage/backend_nabu/index.php?action=logout', {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			console.error("Erreur lors de la déconnexion");
		}

		return true;
	} catch (error) {
		console.error("Erreur lors de la déconnexion:", error);
		return false;
	}
}

// Register
export async function register(userData) {
	const res = await fetch('http://localhost/stage/backend_nabu/index.php?action=logout', {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(userData),
	});

	return await jsonDecode(res);
}
