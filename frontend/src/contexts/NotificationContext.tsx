import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notification } from 'antd';

interface Notification {
    id: string;
    type: 'proposal' | 'decision';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notif,
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => [newNotification, ...prev]);

        // Show antd notification
        notification.info({
            message: notif.title,
            description: notif.message,
            placement: 'topRight',
            duration: 4.5
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Notifications are now managed by ProposalContext for real data synchronization

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
