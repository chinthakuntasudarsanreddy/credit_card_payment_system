\# Credit Card Payment System



A full-stack credit card payment management system built with \*\*React, Tailwind CSS, Django REST Framework, FastAPI, and MySQL\*\*.



The application separates business responsibilities between Django and FastAPI:



\* \*\*Django\*\* handles authentication, cards, transactions, administration, and reporting.

\* \*\*FastAPI\*\* handles payment processing.

\* \*\*React + Tailwind CSS\*\* provides the user interface.

\* \*\*MySQL\*\* stores application data.

\* \*\*Docker Compose\*\* runs the complete application stack.



\---



\## 1. Technology Stack



\### Frontend



\* React

\* Vite

\* Tailwind CSS

\* Axios

\* React Router



\### Backend



\* Django 5.2

\* Django REST Framework

\* Simple JWT

\* drf-spectacular

\* FastAPI

\* SQLAlchemy

\* Pydantic



\### Database



\* MySQL 8



\### Testing



\* Django Test Framework

\* pytest

\* pytest-cov

\* Coverage.py



\### DevOps



\* Docker

\* Docker Compose



\---



\## 2. Project Structure



```text

credit\_card\_payment\_system/

│

├── backend/

│   │

│   ├── django\_backend/

│   │   ├── config/

│   │   ├── users/

│   │   ├── cards/

│   │   ├── transactions/

│   │   ├── admin\_logs/

│   │   ├── manage.py

│   │   ├── requirements.txt

│   │   └── Dockerfile

│   │

│   └── fastapi\_backend/

│       ├── app/

│       │   ├── core/

│       │   ├── models/

│       │   ├── routers/

│       │   ├── schemas/

│       │   └── services/

│       ├── tests/

│       ├── requirements.txt

│       └── Dockerfile

│

├── frontend/

│   ├── src/

│   ├── package.json

│   ├── vite.config.js

│   └── Dockerfile

│

├── docker/

│   └── mysql/

│       └── init.sql

│

├── docker-compose.yml

└── README.md

```



\---



\## 3. Application Architecture



```text

&#x20;                   React + Tailwind

&#x20;                      :5173

&#x20;                         |

&#x20;            +------------+------------+

&#x20;            |                         |

&#x20;            v                         v

&#x20;      Django REST API             FastAPI

&#x20;          :8000                    :8001

&#x20;            |                         |

&#x20;            |                         |

&#x20;            +------------+------------+

&#x20;                         |

&#x20;                         v

&#x20;                       MySQL

&#x20;                        :3306

```



\### Django responsibilities



\* User registration

\* JWT authentication

\* User profile

\* Card management

\* Transaction history

\* Transaction filtering

\* CSV transaction export

\* Daily payment summary

\* Django Admin



\### FastAPI responsibilities



\* Payment processing

\* PENDING transaction creation

\* SUCCESS / FAILED simulation

\* Payment validation

\* Payment API documentation



\---



\## 4. Main Features



\### Authentication



\* User registration

\* JWT login

\* Protected API endpoints

\* Password hashing through Django authentication

\* Role-based admin access



\### Card Management



Users can:



\* Add a card

\* View saved cards

\* Delete a card



Actual card numbers are not stored in the database.



Only the following card information is stored:



```text

Masked card number

Last four digits

Card holder name

Expiry month/year

Card type

```



Example:



```text

\*\*\*\* \*\*\*\* \*\*\*\* 1111

```



CVV is not stored.



\### Payment Processing



FastAPI creates a transaction with:



```text

PENDING

```



The payment simulator then produces either:



```text

SUCCESS

```



or:



```text

FAILED

```



\### Transaction Management



Users can view:



\* Transaction ID

\* Amount

\* Currency

\* Status

\* Card

\* Payment message

\* Created date



Supported filters include:



\* Status

\* Minimum amount

\* Maximum amount

\* Transaction ID search

\* Date range



\### Administration



Administrators can access:



\* Users

\* Cards

\* Transactions

\* Daily payment summary

\* Transaction CSV export



\---



\## 5. API Documentation



\### Django Swagger



Open:



```text

http://localhost:8000/api/docs/

```



Schema:



```text

http://localhost:8000/api/schema/

```



\### FastAPI Swagger



Open:



```text

http://localhost:8001/docs

```



\---



\## 6. Important Django API Endpoints



\### Authentication



```text

POST /api/users/register/

POST /api/users/login/

GET  /api/users/profile/

```



\### Cards



```text

GET    /api/cards/

POST   /api/cards/

GET    /api/cards/{card\_id}/

DELETE /api/cards/{card\_id}/

```



\### Transactions



```text

GET /api/transactions/

GET /api/transactions/{transaction\_id}/

GET /api/transactions/export/

```



Transaction filters:



```text

/api/transactions/?status=SUCCESS



/api/transactions/?min\_amount=50



/api/transactions/?max\_amount=500



/api/transactions/?date\_from=2026-10-05\&date\_to=2026-10-05



/api/transactions/?search=TXN

```



\### Admin reporting



```text

GET /api/admin-logs/daily-summary/

```



\---



\## 7. FastAPI Payment API



Payment endpoint:



```text

POST /api/payments/

```



Example request:



```json

{

&#x20; "user\_id": 2,

&#x20; "card\_id": 1,

&#x20; "amount": 100,

&#x20; "currency": "INR"

}

```



Example response:



```json

{

&#x20; "transaction\_id": "example-transaction-id",

&#x20; "user\_id": 2,

&#x20; "card\_id": 1,

&#x20; "amount": "100.00",

&#x20; "currency": "INR",

&#x20; "status": "SUCCESS",

&#x20; "message": "Payment processed successfully."

}

```



Health endpoint:



```text

GET /health

```



Example:



```json

{

&#x20; "status": "healthy"

}

```



\---



\## 8. Running the Project with Docker



From the project root:



```cmd

cd C:\\Users\\Admin\\OneDrive\\Desktop\\credit\_card\_payment\_system

```



Start the complete application:



```cmd

docker compose up -d

```



Check containers:



```cmd

docker compose ps

```



Expected services:



```text

credit\_card\_mysql

credit\_card\_django

credit\_card\_fastapi

credit\_card\_frontend

```



\---



\## 9. Application URLs



\### React



```text

http://localhost:5173/

```



\### Django



```text

http://localhost:8000/

```



\### Django Swagger



```text

http://localhost:8000/api/docs/

```



\### Django Admin



```text

http://localhost:8000/admin/

```



\### FastAPI



```text

http://localhost:8001/

```



\### FastAPI Swagger



```text

http://localhost:8001/docs

```



\### FastAPI Health



```text

http://localhost:8001/health

```



\---



\## 10. Database



The Docker MySQL database is named:



```text

credit

```



Inside Docker, MySQL uses:



```text

Host: mysql

Port: 3306

```



The Windows host exposes MySQL on:



```text

localhost:3307

```



The main Django tables include:



```text

users\_user

cards\_card

transactions\_transaction

```



\---



\## 11. Testing



\### Django tests



Run:



```cmd

docker compose exec django python manage.py check

```



Run tests:



```cmd

docker compose exec django coverage run manage.py test users cards transactions

```



View coverage:



```cmd

docker compose exec django coverage report -m

```



Current Django result:



```text

81% coverage

```



\### FastAPI tests



Run:



```cmd

docker compose exec fastapi python -m pytest -v

```



Run coverage:



```cmd

docker compose exec fastapi python -m pytest --cov=app --cov-report=term-missing

```



Current FastAPI result:



```text

9 tests passed

96% coverage

```



\---



\## 12. Security



The application follows these security practices:



\* Passwords are hashed using Django's password hashing system.

\* JWT authentication protects private APIs.

\* Card numbers are not stored in plain text.

\* Only masked card numbers and last four digits are stored.

\* CVV is not stored.

\* Django ORM and SQLAlchemy are used instead of manually constructing SQL queries.

\* Input validation is implemented using DRF serializers and Pydantic.

\* Admin functionality is restricted by user role.

\* CORS is configured for the React application.



\---



\## 13. Development Commands



\### Start everything



```cmd

docker compose up -d

```



\### Stop everything



```cmd

docker compose down

```



\### View Django logs



```cmd

docker compose logs --tail=100 django

```



\### View FastAPI logs



```cmd

docker compose logs --tail=100 fastapi

```



\### Rebuild Django



```cmd

docker compose build django

docker compose up -d django

```



\### Rebuild FastAPI



```cmd

docker compose build fastapi

docker compose up -d fastapi

```



\### Check all services



```cmd

docker compose ps

```



\---



\## 14. Final Verification



Before submission, verify:



```text

\[ ] React opens successfully

\[ ] User registration works

\[ ] JWT login works

\[ ] Protected profile works

\[ ] Card can be added

\[ ] Full card number is never stored

\[ ] Card can be viewed/deleted

\[ ] FastAPI health endpoint works

\[ ] Payment succeeds/fails as simulated

\[ ] Transaction appears in transaction history

\[ ] Transaction filters work

\[ ] CSV export works for admin

\[ ] Daily payment summary works

\[ ] Django Admin works

\[ ] FastAPI tests pass

\[ ] Django tests pass

\[ ] Coverage is above 50%

\[ ] Docker Compose starts all services

```



\---



\## 15. Test Results



\### Django



```text

Tests: PASSED

Coverage: 81%

```



\### FastAPI



```text

Tests: 9 PASSED

Coverage: 96%

```



\### Docker



```text

MySQL: Healthy

Django: Running

FastAPI: Running

React: Running

```



\---



\## 16. Project Goal



This project demonstrates a complete full-stack payment-system architecture using separate Django and FastAPI services, secure card handling, JWT authentication, payment simulation, transaction management, administration, automated testing, Docker, and MySQL.



"# credit_card_payment_system" 
