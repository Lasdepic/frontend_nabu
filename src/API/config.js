const API_URL =
	window.location.hostname === 'localhost'
		? 'http://localhost/'
		: 'https://nabu.scdi-montpellier.fr/';

export default API_URL;
