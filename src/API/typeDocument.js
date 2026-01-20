//###### AFFICHAGE
// API pour récupéré tous type Documents
export async function fetchAllTypeDocument() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=display-type-documents');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupéré un type Docuement
export async function fetchOneTypeDocument() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=display-type-document');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}