-- Seed default CXO agents
INSERT INTO agents (id, tenant_id, name, agent_type, description, vote_weight, can_read, can_execute, can_propose, can_vote, can_challenge, rag_enabled, is_active, llm_model, temperature, max_tokens, created_at, updated_at)
VALUES 
(UUID(), 'default', 'CEO - Chief Executive Officer', 'ceo', 'Strategic oversight and final decision authority', 2.0, 1, 1, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CFO - Chief Financial Officer', 'finance', 'Financial planning, budgeting, and fiscal responsibility', 1.5, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CHRO - Chief Human Resources Officer', 'hr', 'Talent management, culture, and organizational development', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'COO - Chief Operations Officer', 'ops', 'Operational efficiency and process optimization', 1.5, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CRO - Chief Revenue Officer', 'sales', 'Revenue generation and market expansion', 1.5, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CLO - Chief Legal Officer', 'legal', 'Legal compliance and risk mitigation', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CISO - Chief Information Security Officer', 'it_security', 'Cybersecurity and data protection', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CPO - Chief Product Officer', 'product', 'Product strategy and innovation', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CCO - Chief Customer Officer', 'customer_success', 'Customer satisfaction and retention', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW()),
(UUID(), 'default', 'CPO - Chief Procurement Officer', 'procurement', 'Strategic sourcing and vendor management', 1.0, 1, 0, 1, 1, 1, 1, 1, 'gpt-4-turbo', 0.7, 4096, NOW(), NOW());

