// Script para fazer login automático no frontend
(function() {
    // Verificar se já está logado
    const token = localStorage.getItem('token');
    if (token) {
        console.log('Usuário já está logado');
        return;
    }

    // Fazer login automático
    const loginData = {
        email: 'admin@test.com',
        senha: '123456'
    };

    // Porta atualizada para corresponder ao backend em execução
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Login automático realizado com sucesso');
            window.location.reload();
        } else {
            console.error('Erro no login automático:', data.message);
        }
    })
    .catch(error => {
        console.error('Erro na requisição de login:', error);
    });
})();