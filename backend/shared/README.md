# Shared Backend Components

This package contains shared utilities, models, and configuration used across all microservices.

## Structure

```
shared/
├── config.py          # Configuration management
├── database.py        # Database connection and session
├── security.py        # Authentication and authorization
├── models/            # SQLAlchemy models
│   ├── base.py
│   ├── tenant.py
│   ├── user.py
│   ├── proposal.py
│   ├── agent.py
│   ├── connector.py
│   ├── audit.py
│   └── execution.py
└── utils/             # Utility functions
    ├── encryption.py
    ├── hashing.py
    └── validation.py
```
