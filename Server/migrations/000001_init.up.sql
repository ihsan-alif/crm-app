CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'sales',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(255),
    tag VARCHAR(50),
    source VARCHAR(20) DEFAULT 'manual',
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    number VARCHAR(30) UNIQUE NOT NULL,
    total DECIMAL(15,2),
    status VARCHAR(10) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);

CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    name VARCHAR(200) NOT NULL,
    qty INTEGER NOT NULL,
    price DECIMAL(15,2),
    subtotal DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_items_transaction ON transaction_items(transaction_id);
