/**
 * UI Component Library
 * Executive Workspace Design System
 */
import React from 'react';
import '../design-system.css';

/* ============================================================================
   TYPOGRAPHY COMPONENTS
   ============================================================================ */
export const Headline = ({ size = 'lg', children, className = '' }) => {
  const Class = size === 'lg' ? 'headline-lg' : 'headline-sm';
  return <h1 className={`${Class} ${className}`}>{children}</h1>;
};

export const Title = ({ size = 'lg', children, className = '' }) => {
  const sizeClass = {
    lg: 'title-lg',
    md: 'title-md',
    sm: 'title-sm',
  }[size] || 'title-lg';
  return <h2 className={`${sizeClass} ${className}`}>{children}</h2>;
};

export const Body = ({ size = 'md', children, className = '' }) => {
  const sizeClass = {
    lg: 'body-lg',
    md: 'body-md',
    sm: 'body-sm',
  }[size] || 'body-md';
  return <p className={`${sizeClass} ${className}`}>{children}</p>;
};

export const Label = ({ size = 'md', children, className = '' }) => {
  const sizeClass = {
    lg: 'label-lg',
    md: 'label-md',
    sm: 'label-sm',
  }[size] || 'label-md';
  return <span className={`${sizeClass} ${className}`}>{children}</span>;
};

/* ============================================================================
   BUTTON COMPONENTS
   ============================================================================ */
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
    danger: 'btn-danger',
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6',
  }[size] || 'py-2 px-4';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

/* ============================================================================
   INPUT COMPONENTS
   ============================================================================ */
export const TextField = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = false,
  helperText = '',
  icon: Icon,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="label-sm block">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${Icon ? 'pl-10' : ''} w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-lg text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all ${
            error ? 'border-error' : ''
          }`}
          {...props}
        />
      </div>
      {helperText && (
        <span className={`label-sm block ${error ? 'text-error' : 'text-variant'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
};

/* ============================================================================
   CARD COMPONENTS
   ============================================================================ */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Container = ({ variant = 'primary', children, className = '', ...props }) => {
  const variantClass = {
    primary: 'container-primary',
    secondary: 'container-secondary',
  }[variant] || 'container-primary';
  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ============================================================================
   STATUS CHIP COMPONENTS
   ============================================================================ */
export const Chip = ({ status, label, children, className = '' }) => {
  const statusClass = {
    active: 'chip-active',
    pending: 'chip-pending',
    ack_pending: 'chip-pending',
    waitlisted: 'chip-waitlisted',
    rejected: 'chip-rejected',
    withdrawn: 'chip-rejected',
    hired: 'chip-active',
    default: 'chip-pending',
  }[status] || 'chip-pending';

  return (
    <span className={`chip ${statusClass} ${className}`}>
      {label || children}
    </span>
  );
};

/* ============================================================================
   BADGE COMPONENTS
   ============================================================================ */
export const Badge = ({ count, className = '' }) => {
  return (
    <span className={`badge ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

/* ============================================================================
   LAYOUT COMPONENTS
   ============================================================================ */
export const Header = ({ children, className = '' }) => {
  return (
    <header className={`bg-surface border-b border-surface-container p-6 ${className}`}>
      {children}
    </header>
  );
};

export const Footer = ({ children, className = '' }) => {
  return (
    <footer className={`bg-surface border-t border-surface-container p-6 ${className}`}>
      {children}
    </footer>
  );
};

export const Sidebar = ({ children, className = '' }) => {
  return (
    <aside className={`glass w-64 h-screen fixed left-0 top-0 p-6 overflow-y-auto ${className}`}>
      {children}
    </aside>
  );
};

/* ============================================================================
   LIST COMPONENTS
   ============================================================================ */
export const List = ({ items, renderItem, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="hover:bg-surface-container-low p-3 rounded-lg transition-colors">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
   MODAL COMPONENTS
   ============================================================================ */
export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl p-8 max-w-md w-full shadow-xl ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <Title size="md">{title}</Title>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ============================================================================
   LOADING & STATE COMPONENTS
   ============================================================================ */
export const Loading = () => {
  return (
    <div className="flex-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex-center flex-col h-64 text-center">
      {Icon && <Icon size={48} className="text-outline mb-4 opacity-50" />}
      <Title size="sm" className="text-on-surface-variant mb-2">
        {title}
      </Title>
      <Body size="sm" className="text-on-surface-variant">
        {description}
      </Body>
    </div>
  );
};

/* ============================================================================
   TOAST/NOTIFICATION COMPONENTS
   ============================================================================ */
export const Toast = ({ type = 'info', message, onClose }) => {
  const typeClass = {
    success: 'bg-tertiary-container text-on-tertiary-container',
    error: 'bg-error-container text-on-error-container',
    info: 'bg-primary-container text-on-primary-container',
    warning: 'bg-secondary-container text-on-secondary-container',
  }[type] || 'bg-primary-container text-on-primary-container';

  return (
    <div className={`${typeClass} rounded-lg p-4 flex justify-between items-center shadow-lg`}>
      <span className="label-md">{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">
        ✕
      </button>
    </div>
  );
};

export default {
  Headline,
  Title,
  Body,
  Label,
  Button,
  TextField,
  Card,
  Container,
  Chip,
  Badge,
  Header,
  Footer,
  Sidebar,
  List,
  Modal,
  Loading,
  EmptyState,
  Toast,
};
