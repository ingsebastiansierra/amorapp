-- Crear una conexión de prueba entre dos usuarios
-- Reemplaza USER1_ID y USER2_ID con los IDs reales de dos usuarios

INSERT INTO connections (user1_id, user2_id, status, created_at, updated_at)
VALUES (
    'USER1_ID',  -- Reemplaza con tu user ID
    'USER2_ID',  -- Reemplaza con el ID del otro usuario
    'accepted',
    NOW(),
    NOW()
);

-- Para ver tus conexiones después:
SELECT * FROM connections WHERE user1_id = auth.uid() OR user2_id = auth.uid();
