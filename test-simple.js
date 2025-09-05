console.log('Iniciando teste simples...');

const jwt = require('jsonwebtoken');
const http = require('http');

// Gerar token
const token = jwt.sign(
  { 
    user: {
      id: '68b685d369d9338619a52fea',
      tipo: 'admin'
    }
  },
  'guanandi_secret_key_2024',
  { expiresIn: '1h' }
);

console.log('Token criado');

// Fazer requisição
const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/boletos',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

console.log('Fazendo requisição...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Resposta completa:', data);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('JSON parsed:', parsed);
      } catch (e) {
        console.log('Não é JSON válido');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.end();
console.log('Requisição enviada');