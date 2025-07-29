import React from 'react';
import { useNavigate } from 'react-router-dom';
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

    const isInternalLink = (url: string): boolean => {
        // In this app, internal links are hash-based.
        return url.startsWith('/#/');
    };

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (href) {
            // For internal links, we prevent the default browser action and use React Router to navigate.
            if (isInternalLink(href)) {
                e.preventDefault();
                const path = href.replace('/#', '');
                onClose();
                navigate(path);
            } else {
                // For all external links (like mailto: or https:), we simply close the modal
                // and let the browser handle the default action (opening email client or new tab).
                onClose();
            }
        }
    };
    
    // This regex will split the string by <a> tags, keeping the tags as part of the resulting array.
    const linkRegex = /(<a\s+[^>]*>.*?<\/a>)/gi;
    const parts = notification.message.split(linkRegex).filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Notification</h2>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">×</button>
                </div>

                <p className="text-gray-700 my-4 whitespace-pre-wrap break-words">
                     {parts.map((part, index) => {
                        if (part.match(linkRegex)) {
                            // This part is an <a> tag. We'll parse its href and content.
                            const hrefMatch = part.match(/href="([^"]*)"/i);
                            const textMatch = part.match(/>([^<]*)<\/a>/i);
                            
                            const href = hrefMatch ? hrefMatch[1] : "#";
                            const text = textMatch ? textMatch[1] : "link";
                            
                            return (
                                <a 
                                    key={index} 
                                    href={href} 
                                    onClick={handleLinkClick} 
                                    className="text-blue-600 hover:underline"
                                    // Let the browser open non-internal links in a new tab.
                                    target={!isInternalLink(href) ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                >
                                    {text}
                                </a>
                            );
                        }
                        // This is a plain text part.
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