import React from 'react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`} onClick={onClose}>
      {notification.message}
    </div>
  );
};

export default Notification;