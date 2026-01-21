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

    // Simulate checking for new proposals and decisions every 30 minutes
    useEffect(() => {
        const checkInterval = 30 * 60 * 1000; // 30 minutes in milliseconds

        const checkForUpdates = () => {
            // In production, this would call an API to check for new proposals/decisions
            // For now, simulate random notifications
            const random = Math.random();

            if (random > 0.7) {
                addNotification({
                    type: 'proposal',
                    title: 'New Proposal Submitted',
                    message: 'A new proposal "Cloud Migration Strategy" has been submitted for review.'
                });
            } else if (random > 0.4) {
                addNotification({
                    type: 'decision',
                    title: 'Decision Made',
                    message: 'Agents have reached a decision on "Q1 Budget Reallocation" - Approved with 92% confidence.'
                });
            }
        };

        // Check immediately on mount
        const timer = setTimeout(checkForUpdates, 5000); // First check after 5 seconds

        // Then check every 30 minutes
        const interval = setInterval(checkForUpdates, checkInterval);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

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
