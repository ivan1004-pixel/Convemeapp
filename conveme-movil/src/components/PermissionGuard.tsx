import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Permission } from '@/src/constants/permissions';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission, children, fallback, showFallback = false,
}) => {
  const { can } = usePermissions();
  if (can(permission)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  if (showFallback) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🔒 Sin permisos</Text>
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  text: { ...Typography.body, color: Colors.textSecondary },
});
