SET FOREIGN_KEY_CHECKS=0;

INSERT INTO transactions_transaction
(transaction_id, amount, currency, status, payment_message, created_at, updated_at, card_id, user_id)
VALUES
('37faef58-b287-4059-853b-258bf4e36e06', 1.00, 'INR', 'SUCCESS', 'Payment processed successfully.', '2026-10-05 10:30:26.033827', '2026-10-05 10:30:27.351952', 1, 2),
('5ae1a71b-539b-4fbf-b168-917529f34c0a', 2000.00, 'INR', 'SUCCESS', 'Payment processed successfully.', '2026-10-05 10:43:35.808499', '2026-10-05 10:43:36.642704', 1, 2),
('314f73da-ccf8-4218-99c9-9a3aa01532a9', 30000.00, 'INR', 'FAILED', 'Payment processing failed.', '2026-10-07 08:34:22.234580', '2026-10-07 08:34:22.605524', 1, 2),
('4956b075-96cb-492a-842f-1e9eccab467e', 20000.00, 'INR', 'SUCCESS', 'Payment processed successfully.', '2026-10-07 08:34:51.654349', '2026-10-07 08:34:51.707805', 1, 2),
('9d898f07-d7be-4fb4-8092-47e4ff556b47', 5000.00, 'INR', 'SUCCESS', 'Payment processed successfully.', '2026-10-07 08:35:14.489628', '2026-10-07 08:35:14.522009', 1, 2),
('0ff5f9ef-de8c-4fbc-955f-307542ca3a96', 634.00, 'INR', 'FAILED', 'Payment processing failed.', '2026-10-07 08:35:43.685883', '2026-10-07 08:35:43.769634', 1, 2),
('1ba09a5b-6b95-4f41-b8f8-88322136994b', 6000.00, 'INR', 'SUCCESS', 'Payment processed successfully.', '2026-10-08 08:04:50.388186', '2026-10-08 08:04:53.633025', 1, 2);

SET FOREIGN_KEY_CHECKS=1;