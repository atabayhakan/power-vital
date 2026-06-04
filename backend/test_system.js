const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  try {
    console.log('1. Registering Root Admin...');
    const admin = await request('POST', '/api/v1/auth/register', {
      name: 'Admin User 2',
      email: 'admin2@powervital.com',
      password: 'password123'
    });
    console.log('Admin Register:', admin.status, admin.data);

    console.log('\n2. Logging in...');
    const login = await request('POST', '/api/v1/auth/login', {
      email: 'admin2@powervital.com',
      password: 'password123'
    });
    console.log('Login:', login.status, login.data.message);
    const token = login.data.token;
    const adminId = login.data.user.id;

    console.log('\n3. Creating Product...');
    const product = await request('POST', '/api/v1/products', {
      name: 'Power Shake 2',
      barcode: 'PS1002',
      basePriceUsd: 50,
      stockQuantity: 100
    }, token); // Assuming we don't have strict auth on products yet
    console.log('Product:', product.status, product.data.name);

    console.log('\n4. Making a Purchase with Sponsor...');
    const order = await request('POST', '/api/v1/orders/checkout', {
      customerName: 'Guest Purchaser',
      cart: [{ productId: product.data.id, price: 5000, quantity: 1 }],
      sponsorId: adminId
    });
    console.log('Checkout:', order.status, order.data);

    console.log('\n5. Waiting 3 seconds for BullMQ to process bonus...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n6. Checking Admin Wallet...');
    const me = await request('GET', '/api/v1/auth/me', null, token);
    console.log('Admin Wallet:', me.status, me.data.walletBalanceKgs);
    
    console.log('\n7. Checking System Stats...');
    const stats = await request('GET', '/api/v1/system/config');
    console.log('System Stats:', stats.data.stats);

  } catch (err) {
    console.error('Test Failed:', err);
  }
}

runTest();
