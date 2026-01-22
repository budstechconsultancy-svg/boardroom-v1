import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';

export interface Connector {
    id: string;
    name: string;
    type: string;
    status: 'connected' | 'disconnected';
    lastSync: string;
    rowsImported: number;
    config: {
        apiKey?: string;
        endpoint?: string;
        [key: string]: any;
    };
}

interface ConnectorContextType {
    connectors: Connector[];
    loading: boolean;
    refreshConnectors: () => Promise<void>;
    addConnector: (connector: Partial<Connector>) => Promise<void>;
    updateConnector: (id: string, connector: Partial<Connector>) => Promise<void>;
    syncConnector: (id: string) => Promise<void>;
}

const ConnectorContext = createContext<ConnectorContextType | undefined>(undefined);

export const useConnectors = () => {
    const context = useContext(ConnectorContext);
    if (!context) {
        throw new Error('useConnectors must be used within a ConnectorProvider');
    }
    return context;
};

// Mapping functions
const mapDjangoToConnector = (djangoData: any): Connector => ({
    id: djangoData.id.toString(),
    name: djangoData.name,
    type: djangoData.connector_type,
    status: djangoData.is_active ? 'connected' : 'disconnected',
    lastSync: djangoData.updated_at ? new Date(djangoData.updated_at).toLocaleDateString() : 'Never',
    rowsImported: djangoData.config?.rowsImported || 0,
    config: djangoData.config || {},
});

const mapConnectorToDjango = (connector: Partial<Connector>): any => {
    const djangoData: any = {};
    if (connector.name) djangoData.name = connector.name;
    if (connector.type) djangoData.connector_type = connector.type;
    if (connector.status) djangoData.is_active = connector.status === 'connected';
    if (connector.config) djangoData.config = connector.config;
    return djangoData;
};

export const ConnectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshConnectors = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/connectors/');
            setConnectors(response.data.map(mapDjangoToConnector));
        } catch (error) {
            console.error('Error fetching connectors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshConnectors();
    }, []);

    const addConnector = async (connector: Partial<Connector>) => {
        try {
            const djangoData = mapConnectorToDjango(connector);
            await apiClient.post('/connectors/', djangoData);
            await refreshConnectors();
        } catch (error) {
            console.error('Error adding connector:', error);
            throw error;
        }
    };

    const updateConnector = async (id: string, connector: Partial<Connector>) => {
        try {
            const djangoData = mapConnectorToDjango(connector);
            await apiClient.patch(`/connectors/${id}/`, djangoData);
            await refreshConnectors();
        } catch (error) {
            console.error('Error updating connector:', error);
            throw error;
        }
    };

    const syncConnector = async (id: string) => {
        // In a real app, this would trigger a background task
        // For now, we'll just update the lastSync time in the config
        try {
            const connector = connectors.find(c => c.id === id);
            if (connector) {
                const updatedConfig = {
                    ...connector.config,
                    lastSync: new Date().toISOString(),
                    rowsImported: (connector.config.rowsImported || 0) + Math.floor(Math.random() * 100)
                };
                await updateConnector(id, {
                    status: 'connected',
                    config: updatedConfig
                });
            }
        } catch (error) {
            console.error('Error syncing connector:', error);
            throw error;
        }
    };

    return (
        <ConnectorContext.Provider value={{
            connectors,
            loading,
            refreshConnectors,
            addConnector,
            updateConnector,
            syncConnector
        }}>
            {children}
        </ConnectorContext.Provider>
    );
};
