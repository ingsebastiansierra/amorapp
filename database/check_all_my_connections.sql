-- Ver TODAS mis conexiones (sin filtrar por status)
SELECT 
    c.id,
    c.user1_id,
    c.user2_id,
    c.status,
    c.created_at,
    u1.name as user1_name,
    u1.email as user1_email,
    u2.name as user2_name,
    u2.email as user2_email,
    CASE 
        WHEN c.user1_id = auth.uid() THEN 'Yo soy user1'
        WHEN c.user2_id = auth.uid() THEN 'Yo soy user2'
        ELSE 'No soy parte de esta conexión'
    END as mi_rol
FROM connections c
LEFT JOIN users u1 ON c.user1_id = u1.id
LEFT JOIN users u2 ON c.user2_id = u2.id
WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
ORDER BY c.created_at DESC;
