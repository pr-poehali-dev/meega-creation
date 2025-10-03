'''
Business: Messenger API для чатов, сообщений и реакций
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id, function_name
Returns: HTTP response dict with chats, messages, или результат операции
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = int(headers.get('x-user-id', headers.get('X-User-Id', '2')))
    
    path = event.get('queryStringParameters', {}).get('path', '')
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            if path == 'chats':
                cur.execute('''
                    SELECT DISTINCT c.id, c.name, c.type, c.created_at,
                           (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) as member_count,
                           (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                           (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                           (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != %s AND m.created_at > COALESCE((SELECT MAX(created_at) FROM messages WHERE chat_id = c.id AND sender_id = %s), '1970-01-01')) as unread_count
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    WHERE cm.user_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                ''', (user_id, user_id, user_id))
                
                chats = []
                for row in cur.fetchall():
                    chat = dict(row)
                    chat['created_at'] = chat['created_at'].isoformat() if chat['created_at'] else None
                    chat['last_message_time'] = chat['last_message_time'].isoformat() if chat['last_message_time'] else None
                    chats.append(chat)
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            elif path.startswith('messages/'):
                chat_id = int(path.split('/')[-1])
                
                cur.execute('''
                    SELECT m.id, m.content, m.created_at, m.sender_id,
                           u.display_name as sender_name, u.avatar_color,
                           ARRAY_AGG(DISTINCT mr.emoji) FILTER (WHERE mr.emoji IS NOT NULL) as reactions
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    LEFT JOIN message_reactions mr ON m.id = mr.message_id
                    WHERE m.chat_id = %s
                    GROUP BY m.id, u.display_name, u.avatar_color
                    ORDER BY m.created_at ASC
                ''', (chat_id,))
                
                messages = []
                for row in cur.fetchall():
                    msg = dict(row)
                    msg['created_at'] = msg['created_at'].isoformat() if msg['created_at'] else None
                    msg['reactions'] = msg['reactions'] if msg['reactions'] and msg['reactions'][0] is not None else []
                    messages.append(msg)
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
            
            elif path == 'voice-rooms':
                cur.execute('''
                    SELECT c.id, c.name, COUNT(cm.user_id) as participants
                    FROM chats c
                    LEFT JOIN chat_members cm ON c.id = cm.chat_id
                    WHERE c.type = 'voice'
                    GROUP BY c.id, c.name
                    ORDER BY c.id
                ''')
                
                rooms = [dict(row) for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'rooms': rooms}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            if path == 'send':
                chat_id = body_data.get('chat_id')
                content = body_data.get('content', '').strip()
                
                if not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Content is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    INSERT INTO messages (chat_id, sender_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                ''', (chat_id, user_id, content))
                
                result = cur.fetchone()
                conn.commit()
                
                cur.execute('''
                    SELECT m.id, m.content, m.created_at, m.sender_id,
                           u.display_name as sender_name, u.avatar_color
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.id = %s
                ''', (result['id'],))
                
                message = dict(cur.fetchone())
                message['created_at'] = message['created_at'].isoformat()
                message['reactions'] = []
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'message': message}),
                    'isBase64Encoded': False
                }
            
            elif path == 'react':
                message_id = body_data.get('message_id')
                emoji = body_data.get('emoji')
                
                cur.execute('''
                    INSERT INTO message_reactions (message_id, user_id, emoji)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (message_id, user_id, emoji) DO NOTHING
                    RETURNING id
                ''', (message_id, user_id, emoji))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif path == 'create-chat':
                name = body_data.get('name')
                chat_type = body_data.get('type', 'group')
                
                cur.execute('''
                    INSERT INTO chats (name, type, created_by)
                    VALUES (%s, %s, %s)
                    RETURNING id
                ''', (name, chat_type, user_id))
                
                chat_id = cur.fetchone()['id']
                
                cur.execute('''
                    INSERT INTO chat_members (chat_id, user_id, role)
                    VALUES (%s, %s, 'admin')
                ''', (chat_id, user_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
