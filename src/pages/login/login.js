
import { initNavbar } from '../../components/navbar.js';

export default function loginPage() {

	initNavbar('header', true);

	document.body.style.overflow = 'hidden';

	const main = document.querySelector('main') || createMain();
	main.innerHTML = `
		<div class="d-flex justify-content-center align-items-center" style="min-height: 100vh; background: #F8F9FA);">
			<div class="card p-5 shadow-lg animate__animated animate__fadeIn" style="min-width: 400px; max-width: 500px; border-radius: 16px; margin-bottom: 20vh">
				<div class="text-center mb-4">
					<img src="public/image/favicon.ico" alt="Logo" style="width: 200px; height: 200px;">
					<h2  style="color: #343A40; font-family: 'Cormorant Garamond', serif;">Connexion</h2>
					<p class="text-muted fw-semibold mb-2" style="font-size: 1rem;">Numérisation Archivage Bibliothèque Universitaire</p>
				</div>
				<form id="loginForm" autocomplete="on" style="margin-top: -10px;">
					<div class="mb-3">
						<label for="email" class="form-label">Email :</label>
						<input type="email" class="form-control" id="email" required autocomplete="username">
					</div>
					<div class="mb-2 position-relative">
						<label for="password" class="form-label">Mot de passe :</label>
						<div class="input-group">
							<input type="password" class="form-control" id="password" required autocomplete="current-password">
							<button class="btn btn-outline-secondary d-flex align-items-center border-start" type="button" id="togglePassword" tabindex="-1" aria-label="Afficher/masquer le mot de passe" style="padding: 0 0.75rem; border-top-left-radius: 0; border-bottom-left-radius: 0; border-left-width: 1px; border-left-style: solid; border-color: #ced4da; background: #fff;">
								<span id="eyeIcon">
									<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#0B6EFD"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
								</span>
							</button>
						</div>
					</div>
					<!-- Lien mot de passe oublié supprimé -->
					<div class="d-grid mb-2 mt-4">
						<button type="submit" class="btn btn-primary">
							<span id="loginSpinner" class="spinner-border spinner-border-sm me-2" style="display:none;" role="status" aria-hidden="true"></span>
							Connexion
						</button>
					</div>
					<div id="loginError" class="mt-3 text-danger text-center" style="display:none;"></div>
				</form>
			</div>
		</div>
	`;

	// Gestion du formulaire
	const form = document.getElementById('loginForm');
	const passwordInput = document.getElementById('password');
	const togglePassword = document.getElementById('togglePassword');
	const eyeIcon = document.getElementById('eyeIcon');
	const spinner = document.getElementById('loginSpinner');
	const errorDiv = document.getElementById('loginError');

	// Afficher/masquer le mot de passe
	if (togglePassword) {
		togglePassword.addEventListener('click', () => {
			const type = passwordInput.type === 'password' ? 'text' : 'password';
			passwordInput.type = type;
			if (eyeIcon) {
				// Changer l'icône SVG selon l'état
				if (type === 'password') {
					eyeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#0B6EFD"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>`;
				} else {
					eyeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#0B6EFD"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm-36-108 224-224q8-8 8-20t-8-20q-8-8-20-8t-20 8l-224 224q-8 8-8 20t8 20q8 8 20 8t20-8Zm36 300q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>`;
				}
			}
		});
	}

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		errorDiv.style.display = 'none';
		spinner.style.display = 'inline-block';
		const email = document.getElementById('email').value;
		const password = passwordInput.value;
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
		} finally {
			spinner.style.display = 'none';
		}
	});

	// Lien mot de passe oublié supprimé
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
