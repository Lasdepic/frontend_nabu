
import { initNavbar } from '../../components/navbar.js';

export default function loginPage() {

	initNavbar('header', true);

	document.body.style.overflow = 'hidden';

	const main = document.querySelector('main') || createMain();
	main.innerHTML = `
		<div class="d-flex justify-content-center align-items-center" style="min-height: 100vh; background-color: #f1f1f1;">
			<div class="card p-5 shadow" style="min-width: 400px; max-width: 500px; border-radius: 10px; margin-bottom: 20vh">
				<h2 class="text-center mb-4" style="color: #343A40; text-decoration: underline;">Connexion</h2>
				<form id="loginForm">
					<div class="mb-3">
						<label for="email" class="form-label">Email :</label>
						<input type="email" class="form-control" id="email" required autocomplete="username">
					</div>
					<div class="mb-4">
						<label for="password" class="form-label">Mot de passe :</label>
						<input type="password" class="form-control" id="password" required autocomplete="current-password">
					</div>
					<div class="d-grid">
						<button type="submit" class="btn btn-primary">Connexion</button>
					</div>
					<div id="loginError" class="mt-3 text-danger text-center" style="display:none;"></div>
				</form>
			</div>
		</div>
	`;

	// Gestion du formulaire
	const form = document.getElementById('loginForm');
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		const errorDiv = document.getElementById('loginError');
		errorDiv.style.display = 'none';
		try {
			const { login } = await import('../../API/auth.js');
			const result = await login(email, password);
			if (result && (result.success === true || result.authenticated === true)) {
				window.location.href = 'index.html';
			} else {
				errorDiv.textContent = 'Email ou mot de passe incorrect.';
				errorDiv.style.display = 'block';
			}
		} catch (err) {
			errorDiv.textContent = 'Email ou mot de passe incorrect.';
			errorDiv.style.display = 'block';
		}
	});
}

function createMain() {
	const main = document.createElement('main');
	document.body.appendChild(main);
	return main;
}

// Enleve le scroll sur cette page
export function cleanupLoginPage() {
	document.body.style.overflow = '';
}
