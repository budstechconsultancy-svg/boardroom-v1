# Connector Service

The Connector Service manages ERP integrations with multi-connector support.

## Supported ERPs

| ERP | Status | Features |
|-----|--------|----------|
| Tally | Production | Read/Write, Sync |
| Zoho Books | Production | Read/Write, OAuth2 |
| SAP Business One | Scaffold | Template |
| NetSuite | Scaffold | Template |

## Connector SDK

Use the SDK to build custom connectors:

```python
from connector_sdk import BaseConnector

class MyERPConnector(BaseConnector):
    async def connect(self): ...
    async def sync(self): ...
    async def read(self, table, filters): ...
    async def write(self, table, data): ...
```
