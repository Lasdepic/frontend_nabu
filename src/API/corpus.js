// API pour récupéré tous les Corpus
export async function fetchAllCorpus() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=display-corpus-all');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

const corpus = await fetchAllCorpus();
console.log(corpus);

// API pour récupéré un Corpus
export async function fetchOneCorpus() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=get-corpus');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}