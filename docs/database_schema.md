# Schéma de Base de Données - Urban Foot Center

## Utilisation des UUID comme clés primaires

Toutes les tables utilisent des UUID (Universally Unique Identifier) comme clés primaires au lieu d'identifiants auto-incrémentés, conformément aux exigences de sécurité. PostgreSQL dispose du type `uuid` natif et de l'extension `uuid-ossp` pour générer ces identifiants.

```sql
-- Activation de l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Tables Principales

### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'admin', 'super_admin')),
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token UUID,
    reset_password_token UUID,
    reset_token_expires_at TIMESTAMP WITH TIME ZONE
);
```

### 2. fields (terrains)
```sql
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    size VARCHAR(50) NOT NULL, -- par exemple "5v5", "7v7"
    surface_type VARCHAR(50) NOT NULL, -- par exemple "gazon synthétique", "futsal"
    price_per_hour DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. time_slots (créneaux horaires)
```sql
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = dimanche, 1 = lundi, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    base_price DECIMAL(10, 2) NOT NULL, -- Prix de base, peut être modifié par des promotions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_field_time_slot UNIQUE (field_id, day_of_week, start_time)
);
```

### 4. reservations
```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    promo_code_id UUID REFERENCES promo_codes(id),
    CONSTRAINT unique_reservation UNIQUE (field_id, reservation_date, start_time)
);
```

### 5. payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'wave', 'orange_money', 'cash'
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255), -- ID externe du système de paiement
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receipt_url VARCHAR(255),
    payment_details JSONB -- Stocke les détails spécifiques au mode de paiement
);
```

### 6. teams
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    captain_id UUID NOT NULL REFERENCES users(id),
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

### 7. team_members
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, user_id)
);
```

### 8. promo_codes
```sql
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 9. notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reservation_reminder', 'promo', 'cancellation', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    related_entity_id UUID, -- Peut référencer une réservation, une promotion, etc.
    related_entity_type VARCHAR(50) -- Indique le type d'entité référencée
);
```

### 10. special_events
```sql
CREATE TABLE special_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price_per_participant DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 11. holidays_and_closures
```sql
CREATE TABLE holidays_and_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    reason VARCHAR(255),
    affects_all_fields BOOLEAN DEFAULT TRUE,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (affects_all_fields = TRUE OR field_id IS NOT NULL)
);
```

## Vues et Fonctions

### 1. Vue des disponibilités
```sql
CREATE VIEW available_slots AS
SELECT 
    f.id AS field_id, 
    f.name AS field_name,
    ts.id AS time_slot_id,
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    ts.base_price,
    ts.is_available,
    NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.field_id = f.id
        AND r.reservation_date = CURRENT_DATE + ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::integer
        AND r.start_time = ts.start_time
        AND r.status NOT IN ('cancelled')
    ) AS is_free_today
FROM fields f
JOIN time_slots ts ON f.id = ts.field_id
WHERE f.is_active = TRUE
ORDER BY f.name, ts.day_of_week, ts.start_time;
```

### 2. Fonction de recherche de créneaux disponibles
```sql
CREATE OR REPLACE FUNCTION find_available_slots(
    search_date DATE,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    field_size VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    field_id UUID,
    field_name VARCHAR,
    start_time TIME,
    end_time TIME,
    price DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id AS field_id,
        f.name AS field_name,
        ts.start_time,
        ts.end_time,
        ts.base_price AS price
    FROM fields f
    JOIN time_slots ts ON f.id = ts.field_id
    WHERE f.is_active = TRUE
    AND ts.is_available = TRUE
    AND (field_size IS NULL OR f.size = field_size)
    AND (start_time IS NULL OR ts.start_time >= start_time)
    AND (end_time IS NULL OR ts.end_time <= end_time)
    AND ts.day_of_week = EXTRACT(DOW FROM search_date)::integer
    AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.field_id = f.id
        AND r.reservation_date = search_date
        AND r.start_time = ts.start_time
        AND r.status NOT IN ('cancelled')
    )
    AND NOT EXISTS (
        SELECT 1 FROM holidays_and_closures hc
        WHERE (hc.affects_all_fields = TRUE OR hc.field_id = f.id)
        AND hc.date = search_date
    )
    ORDER BY f.name, ts.start_time;
END;
$$ LANGUAGE plpgsql;
```

## Indexes pour optimiser les performances

```sql
-- Index pour accélérer la recherche de réservations
CREATE INDEX idx_reservations_date_time ON reservations(field_id, reservation_date, start_time);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Index pour les créneaux horaires
CREATE INDEX idx_time_slots_field_day ON time_slots(field_id, day_of_week);

-- Index pour les paiements
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Index pour les équipes
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Index pour les notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```
