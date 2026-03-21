import React from 'react';
import { Button as AntButton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  danger?: boolean;
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  ghost?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  size = 'middle',
  icon,
  loading = false,
  disabled = false,
  block = false,
  ghost = false,
  danger = false,
  onClick,
  children,
  style,
}) => {
  return (
    <AntButton
      type={type}
      size={size}
      icon={icon}
      loading={loading}
      disabled={disabled}
      block={block}
      ghost={ghost}
      danger={danger}
      onClick={onClick}
      style={{
        height: type === 'default' || type === 'link' ? '32px' : '36px',
        fontWeight: 500,
        borderRadius: '6px',
        ...style,
      }}
    >
      {children}
    </AntButton>
  );
};
