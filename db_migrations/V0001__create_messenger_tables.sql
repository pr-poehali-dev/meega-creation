CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    avatar_color VARCHAR(50) DEFAULT '#FF6B35',
    status VARCHAR(20) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('chat', 'group', 'channel', 'voice')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id),
    user_id INTEGER REFERENCES users(id),
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

INSERT INTO users (username, display_name, avatar_color, status) VALUES
('player_one', 'Player_One', '#FF6B35', 'online'),
('current_user', 'Я', '#1A1A2E', 'online'),
('gamer_pro', 'GamerPro', '#0EA5E9', 'online'),
('team_leader', 'TeamLeader', '#8B5CF6', 'offline')
ON CONFLICT (username) DO NOTHING;

INSERT INTO chats (name, type, created_by) VALUES
('Игровая Команда', 'group', 1),
('Player_One', 'chat', 1),
('Турнир 2024', 'channel', 1),
('Голосовая #1', 'voice', 1),
('Рейд команда', 'voice', 1)
ON CONFLICT DO NOTHING;

INSERT INTO chat_members (chat_id, user_id, role) VALUES
(1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member'),
(2, 1, 'member'), (2, 2, 'member'),
(3, 1, 'admin'), (3, 2, 'member'), (3, 3, 'member'), (3, 4, 'member'),
(4, 1, 'member'), (4, 2, 'member'), (4, 3, 'member'),
(5, 1, 'admin'), (5, 3, 'member')
ON CONFLICT DO NOTHING;

INSERT INTO messages (chat_id, sender_id, content) VALUES
(1, 1, 'Привет! Когда начнём игру?'),
(1, 2, 'Через 10 минут готов!'),
(1, 1, 'Отлично, жду!')
ON CONFLICT DO NOTHING;