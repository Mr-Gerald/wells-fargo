
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notification } from '../types';
import { formatTimeAgo } from '../utils/time';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notification }) => {
    const navigate = useNavigate();

    if (!isOpen || !notification) return null;

    const isInternalLink = (url: string) => {
        try {
            const urlObject = new URL(url);
            return urlObject.origin === window.location.origin && urlObject.hash.startsWith('#/');
        } catch (e) {
            // Check for relative paths like /#/account/...
            return url.startsWith('/#/');
        }
    };

    const handleLinkClick = (e: React.MouseEvent, part: string) => {
        e.preventDefault();
        onClose(); // Close modal before navigating
        if (isInternalLink(part)) {
            const path = part.replace('/#', '');
            navigate(path);
        } else {
            window.open(part, '_blank', 'noopener,noreferrer');
        }
    }
    
    const urlRegex = /(https?:\/\/[^\s]+)|(\/#\/[^\s]+)/g;
    const messageParts = notification.message.split(urlRegex).filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Notification</h2>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>

                <p className="text-gray-700 my-4 whitespace-pre-wrap break-words">
                     {messageParts.map((part, index) => {
                        if (part.match(urlRegex)) {
                            return <a key={index} href={part} onClick={(e) => handleLinkClick(e, part)} className="text-blue-600 hover:underline">{part}</a>;
                        }
                        return <span key={index}>{part}</span>;
                    })}
                </p>
                <p className="text-xs text-gray-500 text-right">{formatTimeAgo(notification.date)}</p>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-wells-red text-white font-semibold hover:bg-wells-dark-red"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;