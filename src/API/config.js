const API_URL =
	window.location.hostname === 'localhost'
		? 'http://localhost/stage'
		: 'https://nabu.scdi-montpellier.fr/';

export default API_URL;
