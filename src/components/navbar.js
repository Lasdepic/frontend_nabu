export function createNavbar(isLoginPage = false) {
    if (isLoginPage) {
        return `
            <nav class="navbar navbar-expand-lg" style="background-color: #343A40; padding: 1.5rem 2rem;">
                <div class="container-fluid">
                    <a class="navbar-brand nabu-title text-white fw-bold" href="#">NABU</a>
                </div>
            </nav>
        `;
    }
    return `
        <nav class="navbar navbar-expand-lg" style="background-color: #343A40; padding: 1.5rem 2rem;">
            <div class="container-fluid">
                <a class="navbar-brand nabu-title text-white fw-bold" href="index.html">NABU</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link text-white" href="index.html">Accueil</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link text-white" href="#" id="logoutBtn">Déconnexion</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;
}

export function initNavbar(selector = 'header', isLoginPage = false) {
    const headerElement = document.querySelector(selector);
    if (headerElement) {
        headerElement.innerHTML = createNavbar(isLoginPage);
        if (!isLoginPage) {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                        logoutBtn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            try {
                                const { logout } = await import('../API/auth.js');
                                await logout();
                            } catch (err) {
                                console.error('Erreur lors de la déconnexion', err);
                            }
                            window.location.href = 'index.html';
                        });
            }
        }
    }
}