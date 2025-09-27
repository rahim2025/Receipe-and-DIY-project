import React from 'react';
import { X, Facebook, Twitter, Instagram, MessageCircle, Mail, Copy } from 'lucide-react';

const ShareModal = ({ post, isOpen, onClose, onShare }) => {
  if (!isOpen) return null;

  const shareOptions = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'text-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/posts/' + post.slug)}`
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'text-blue-400',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin + '/posts/' + post.slug)}`
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'text-green-500',
      url: `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.origin + '/posts/' + post.slug)}`
    },
    { 
      id: 'email', 
      name: 'Email', 
      icon: Mail, 
      color: 'text-gray-600',
      url: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent('Check out this ' + post.type + ': ' + window.location.origin + '/posts/' + post.slug)}`
    },
    { 
      id: 'copy-link', 
      name: 'Copy Link', 
      icon: Copy, 
      color: 'text-gray-600'
    }
  ];

  const handleShare = (option) => {
    if (option.id === 'copy-link') {
      onShare(option.id);
    } else {
      window.open(option.url, '_blank', 'width=600,height=400');
      onShare(option.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Share "{post.title}"
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleShare(option)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <IconComponent className={`h-5 w-5 ${option.color}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;