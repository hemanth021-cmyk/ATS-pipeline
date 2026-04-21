/**
 * UI Component Library
 * Flux Talent Design System - "The Digital Curator"
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
    lg: 'text-title-lg',
    md: 'text-title-md',
    sm: 'text-title-sm',
  }[size] || 'text-title-lg';
  return <h2 className={`${sizeClass} ${className}`}>{children}</h2>;
};

export const Body = ({ size = 'md', children, className = '' }) => {
  const sizeClass = {
    lg: 'text-body-lg',
    md: 'text-body-md',
    sm: 'text-body-sm',
  }[size] || 'text-body-md';
  return <p className={`${sizeClass} ${className}`}>{children}</p>;
};

export const Label = ({ size = 'md', children, className = '' }) => {
  const sizeClass = {
    lg: 'text-label-lg',
    md: 'text-label-md',
    sm: 'text-label-sm',
  }[size] || 'text-label-md';
  return <span className={`${sizeClass} ${className}`}>{children}</span>;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
  ...props
}) => {
  const variantClass = {
    primary: 'btn-flux-primary',
    secondary: 'btn-flux-ghost',
    tertiary: 'btn-flux-tertiary',
    danger: 'bg-error text-on-primary',
  }[variant] || 'btn-flux-primary';

  return (
    <button
      className={`btn-flux ${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
};

export const TextField = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = false,
  helperText = '',
  icon,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-label-sm block opacity-70 uppercase tracking-widest font-semibold">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${icon ? 'pl-12' : 'px-5'} w-full py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/10 transition-all ${
            error ? 'bg-error-container/20 ring-1 ring-error' : ''
          }`}
          {...props}
        />
      </div>
      {helperText && (
        <span className={`text-label-sm block ${error ? 'text-error' : 'opacity-60'}`}>
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
    <div className={`surface-card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const TonalContainer = ({ children, className = '', ...props }) => {
  return (
    <div className={`tonal-section ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ============================================================================
   STATUS CHIP COMPONENTS
   ============================================================================ */
export const Chip = ({ status, label, children, className = '' }) => {
  const statusClass = {
    active: 'chip-flux--active',
    pending: 'chip-flux--pending',
    ack_pending: 'chip-flux--pending',
    waitlisted: 'chip-flux--waitlisted',
    rejected: 'bg-error-container text-on-error-container',
    withdrawn: 'bg-surface-container-highest text-on-surface-variant',
    hired: 'chip-flux--active',
    default: 'chip-flux--pending',
  }[status] || 'chip-flux--pending';

  return (
    <span className={`chip-flux ${statusClass} ${className}`}>
      {label || children}
    </span>
  );
};

/* ============================================================================
   BADGE COMPONENTS
   ============================================================================ */
export const Badge = ({ count, className = '' }) => {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
};

/* ============================================================================
   LAYOUT COMPONENTS
   ============================================================================ */
export const Header = ({ children, className = '' }) => {
  return (
    <header className={`p-8 ${className}`}>
      {children}
    </header>
  );
};

export const Sidebar = ({ children, className = '' }) => {
  return (
    <aside className={`glass w-80 h-screen fixed left-0 top-0 p-10 overflow-y-auto hidden lg:block ${className}`}>
      {children}
    </aside>
  );
};

export const Container = ({ children, className = '', ...props }) => {
  return (
    <div className={`max-w-[1600px] mx-auto px-8 ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ============================================================================
   MODAL COMPONENTS
   ============================================================================ */
export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose} />
      <div className={`relative bg-surface rounded-3xl p-10 max-w-lg w-full shadow-2xl animate-fade-in ${className}`}>
        <div className="flex justify-between items-center mb-8">
          <Title size="md">{title}</Title>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
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
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-surface-container border-t-secondary rounded-full animate-spin" />
    </div>
  );
};

export const EmptyState = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
        {icon && <span className="material-symbols-outlined text-[32px] opacity-40">{icon}</span>}
      </div>
      <Title size="sm" className="mb-2 opacity-80">
        {title}
      </Title>
      <Body size="sm" className="opacity-50 max-w-xs mx-auto">
        {description}
      </Body>
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
  TonalContainer,
  Chip,
  Badge,
  Header,
  Sidebar,
  Modal,
  Loading,
  EmptyState,
};
