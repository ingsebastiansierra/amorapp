-- Verificar mis conexiones activas
SELECT 
    c.*,
    CASE 
        WHEN c.user1_id = auth.uid() THEN u2.name
        ELSE u1.name
    END as other_user_name
FROM connections c
LEFT JOIN users u1 ON c.user1_id = u1.id
LEFT JOIN users u2 ON c.user2_id = u2.id
WHERE (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
AND c.status = 'accepted';
