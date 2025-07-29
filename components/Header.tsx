import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, TrashIcon, SearchIcon, FargoChatIcon, LockIcon } from '../constants';
import { Notification, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { formatTimeAgo } from '../utils/time';
import NotificationModal from './NotificationModal';
import { useChat } from '../contexts/ChatContext';

interface HeaderProps {}

const NotificationItem: React.FC<{ notification: Notification; onView: (notif: Notification) => void; onDelete: (notifId: string) => void; }> = ({ notification, onView, onDelete }) => {
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    }
    
    // By stripping HTML tags, we prevent long URLs in `href` attributes from breaking the layout.
    const plainTextMessage = notification.message.replace(/<[^>]*>?/gm, '');

    return (
        <div onClick={() => onView(notification)} className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 flex items-start cursor-pointer">
            {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>}
            {/* The `min-w-0` class is crucial in flexbox layouts to allow text to wrap and truncate properly. */}
            <div className={`flex-grow min-w-0 ${notification.isRead ? 'pl-5' : ''}`}>
                <p className="text-sm text-gray-800 pr-4 line-clamp-2">
                    {plainTextMessage}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.date)}</p>
            </div>
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-600 p-1 rounded-full flex-shrink-0">
                <TrashIcon />
            </button>
        </div>
    );
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
        return "Good morning,";
    } else if (hour < 18) {
        return "Good afternoon,";
    } else {
        return "Good evening,";
    }
};

const Header: React.FC<HeaderProps> = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);

  const notificationRef = useRef<HTMLDivElement>(null);
  const { currentUser, logout, readNotification, deleteNotification } = useAuth();
  const { openChat } = useChat();
  const greeting = getGreeting();

  const user = currentUser as User;
  const notifications = user?.notifications?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleNotifications = () => {
      setShowNotifications(prev => !prev);
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  }
  
  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  }

  const handleViewNotification = (notification: Notification) => {
    if (!notification.isRead) {
        readNotification(notification.id);
    }
    setViewingNotification(notification);
    setShowNotifications(false);
  }
  
  const handleDeleteRequest = (notificationId: string) => {
    setNotificationToDelete(notificationId);
  }

  const confirmDelete = () => {
    if(notificationToDelete) {
        deleteNotification(notificationToDelete);
    }
    setNotificationToDelete(null);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  if (!user) return null;

  return (
    <>
    <header className="p-4 bg-transparent text-gray-800">
      <div className="flex justify-between items-center mb-6">
        {/* Ask Fargo Search Bar */}
        <div onClick={openChat} className="bg-white/90 rounded-full flex items-center px-3 py-1.5 w-40 shadow-sm transition-all duration-300 ease-in-out cursor-pointer hover:shadow-md">
            <SearchIcon />
            <span className="text-gray-700 font-semibold text-sm ml-2 mr-auto">Ask Fargo</span>
            <FargoChatIcon />
        </div>
        
        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <button 
                onClick={toggleNotifications}
                className="p-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wells-gradient-start focus:ring-gray-800 relative"
            >
                <BellIcon className="text-gray-800"/>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-wells-red text-white text-xs flex items-center justify-center ring-2 ring-white">{unreadCount}</span>
                )}
            </button>
            {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30 text-gray-800">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(notification => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                                onView={handleViewNotification}
                                onDelete={handleDeleteRequest}
                            />
                        )) : <p className="p-4 text-sm text-gray-500">No new notifications.</p>}
                    </div>
                </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-1.5 hover:bg-black/10 p-1 rounded-md">
            <LockIcon className="text-gray-800"/>
            <span className="text-sm font-semibold text-gray-800">Sign off</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-normal tracking-normal">{greeting}</h1>
        <p className="text-3xl font-normal tracking-normal">{user.fullName}</p>
        {user.id === 'user-1' && user.rewards && (
            <Link to="/rewards" className="block pt-2 text-gray-600 font-semibold hover:underline text-sm">
                Wells Fargo Rewards® {user.rewards.balance.toLocaleString()} points &gt;
            </Link>
        )}
      </div>
    </header>

    <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Off"
        message="Are you sure you want to sign off?"
    />

    <ConfirmationModal
        isOpen={!!notificationToDelete}
        onClose={() => setNotificationToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Notification"
        message="Are you sure you want to permanently delete this notification?"
    />

    <NotificationModal 
        isOpen={!!viewingNotification}
        onClose={() => setViewingNotification(null)}
        notification={viewingNotification}
    />
    </>
  );
};

export default Header;