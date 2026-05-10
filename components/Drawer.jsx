import React from 'react';
import Modal from './Modal';
const Drawer = ({ isOpen, onClose, title, children, variant = 'modal' }) => {
    if (!isOpen)
        return null;
    if (variant === 'modal' || variant === 'drawer') {
        return (<Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={variant === 'drawer' ? '56rem' : '42rem'} closeOnBackdrop={false}>
        {children}
      </Modal>);
    }
    return null;
};
export default Drawer;
