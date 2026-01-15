// API pour récupéré tous les users
export async function fetchAllusers() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=get-users');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupéré un user
export async function fetchOneUser() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=get-user');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}